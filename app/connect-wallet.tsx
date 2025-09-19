import { AppConfig, UserSession } from '@stacks/auth';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { updateUserWalletAddress } from '../src/db';
import { auth } from '../src/firebase';
import SoftBackground from "../src/ui/SoftBackground";
import { colors, components, layout } from "../src/ui/theme";

export default function ConnectWallet() {
	const router = useRouter();
	const [address, setAddress] = useState("");
	const [isConnecting, setIsConnecting] = useState(false);
	const [userSession, setUserSession] = useState<UserSession | null>(null);

	// Initialize Stacks UserSession for web platform
	useEffect(() => {
		if (Platform.OS === 'web') {
			const appConfig = new AppConfig(['store_write', 'publish_data']);
			const session = new UserSession({ appConfig });
			setUserSession(session);

			// Check if user is already signed in with Leather
			if (session.isUserSignedIn()) {
				const userData = session.loadUserData();
				setAddress(userData.profile.stxAddress?.mainnet || '');
			}
		}
	}, []);

	const connectLeatherWallet = async () => {
		if (Platform.OS !== 'web') {
			Alert.alert('Wallet Connection', 'Leather wallet is only available on web. Please use the manual input for now.');
			return;
		}

		setIsConnecting(true);
		try {
			console.log('🚀 Starting Leather connection...');

			let accounts = null;
			let connectionMethod = '';

			// Method 1: Direct Leather WebBTC API (bypasses other wallets)
			try {
				if (typeof window !== 'undefined' && (window as any).btc && (window as any).btc.request) {
					console.log('🎯 Trying Leather WebBTC API...');
					const btcProvider = (window as any).btc;

					const response = await btcProvider.request('getAddresses');
					console.log('WebBTC response:', response);

					if (response && response.result && response.result.addresses) {
						const stxAddress = response.result.addresses.find((addr: any) =>
							addr.symbol === 'STX' || addr.type === 'stacks'
						);
						if (stxAddress && stxAddress.address) {
							accounts = [stxAddress.address];
							connectionMethod = 'WebBTC API';
						}
					}
				}
			} catch (err) {
				console.log('❌ WebBTC method failed:', err);
			}

			// Method 2: Leather-specific provider (if WebBTC failed)
			if (!accounts) {
				try {
					if (typeof window !== 'undefined' && (window as any).LeatherProvider) {
						console.log('🎯 Trying LeatherProvider...');
						const leatherProvider = (window as any).LeatherProvider;

						const response = await leatherProvider.connect();
						console.log('LeatherProvider response:', response);

						if (response && response.addresses) {
							const stxAddr = response.addresses.find((addr: any) => addr.type === 'stx');
							if (stxAddr && stxAddr.address) {
								accounts = [stxAddr.address];
								connectionMethod = 'LeatherProvider';
							}
						}
					}
				} catch (err) {
					console.log('❌ LeatherProvider method failed:', err);
				}
			}

			// Method 3: Force bypass other wallets using specific Leather detection
			if (!accounts) {
				try {
					console.log('🎯 Trying direct Leather window access...');

					// Check all window properties for Leather-specific ones
					const windowProps = Object.keys(window);
					const leatherProps = windowProps.filter(prop =>
						prop.toLowerCase().includes('leather') ||
						prop.toLowerCase().includes('hiro')
					);

					console.log('Found Leather-related properties:', leatherProps);

					for (const prop of leatherProps) {
						try {
							const provider = (window as any)[prop];
							if (provider && provider.request) {
								const response = await provider.request({
									method: 'stx_requestAccounts'
								});

								if (response && response.result && response.result.length > 0) {
									accounts = response.result;
									connectionMethod = `Direct ${prop}`;
									break;
								}
							}
						} catch (propErr) {
							console.log(`Failed with ${prop}:`, propErr);
						}
					}
				} catch (err) {
					console.log('❌ Direct access method failed:', err);
				}
			}

			// Method 4: PostMessage communication (last resort)
			if (!accounts) {
				try {
					console.log('🎯 Trying postMessage to Leather...');

					accounts = await new Promise((resolve, reject) => {
						const timeout = setTimeout(() => {
							reject(new Error('Leather connection timeout'));
						}, 5000);

						const handleMessage = (event: MessageEvent) => {
							if (event.data && event.data.source === 'leather-extension') {
								clearTimeout(timeout);
								window.removeEventListener('message', handleMessage);

								if (event.data.payload && event.data.payload.addresses) {
									const stxAddress = event.data.payload.addresses.stx;
									if (stxAddress) {
										resolve([stxAddress]);
									} else {
										reject(new Error('No STX address in response'));
									}
								} else {
									reject(new Error('Invalid response format'));
								}
							}
						};

						window.addEventListener('message', handleMessage);

						// Send connection request to Leather
						window.postMessage({
							type: 'connectWallet',
							target: 'leather-extension'
						}, '*');
					});

					connectionMethod = 'PostMessage';
				} catch (err) {
					console.log('❌ PostMessage method failed:', err);
				}
			}

			// Process results
			if (accounts && accounts.length > 0) {
				const stxAddress = accounts[0];
				setAddress(stxAddress);
				Alert.alert(
					'🎉 Leather Connected!',
					`Successfully connected via ${connectionMethod}\n\nAddress: ${stxAddress.slice(0, 8)}...${stxAddress.slice(-8)}\n\n✅ Bypassed wallet conflicts!`
				);
			} else {
				throw new Error(`Connection failed. Multiple wallets detected:\n\n• MetaMask: ${!!(window as any).ethereum}\n• Phantom: ${!!(window as any).solana}\n• Other wallets may be interfering\n\n💡 Try:\n1. Disable MetaMask/Phantom temporarily\n2. Refresh the page\n3. Use manual address input below`);
			}

		} catch (error) {
			console.error('💥 All Leather connection methods failed:', error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			Alert.alert(
				'Connection Failed 😔',
				`${errorMessage}\n\n🔧 Solutions:\n• Temporarily disable MetaMask/Phantom\n• Refresh the page and try again\n• Use manual address input below`
			);
		} finally {
			setIsConnecting(false);
		}
	};

	const validateStacksAddress = (addr: string) => {
		if (!addr || addr.length < 40) return false;
		// More flexible Stacks address validation (SP, SM for mainnet, ST for testnet)
		return /^S[PMT][0-9A-HJKMNP-Z]{38,40}$/i.test(addr.trim());
	};

	const handleContinue = async () => {
		const trimmedAddress = address.trim();
		if (!validateStacksAddress(trimmedAddress)) {
			Alert.alert('Invalid Address', 'Please enter a valid Stacks (STX) address. Address should start with SP, SM, or ST.');
			return;
		}

		const user = auth.currentUser;
		if (!user) {
			Alert.alert('Not signed in', 'Please log in first.');
			router.replace('/');
			return;
		}

		try {
			setIsConnecting(true);
			console.log('Saving wallet address...');

			// Save wallet address to database
			await updateUserWalletAddress(user.uid, trimmedAddress);

			console.log('Wallet address saved successfully!');
			// Navigate to main app
			router.replace('/main');
		} catch (error) {
			console.error('Error in handleContinue:', error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			Alert.alert('Error', `Failed to save wallet address: ${errorMessage}`);
		} finally {
			setIsConnecting(false);
		}
	};

	return (
		<View style={layout.gradientBg}>
			<SoftBackground />
			<View style={styles.centerContent}>
				<View style={styles.header}>
					<Text style={styles.stepTitle}>Connect Leather Wallet</Text>
					<View style={styles.progressOuter}>
						<View style={[styles.progressInner, { width: '66%' }]} />
					</View>
				</View>

				<View style={styles.content}>
					{Platform.OS === 'web' && (
						<TouchableOpacity
							style={[components.cta, styles.connectButton]}
							onPress={connectLeatherWallet}
							disabled={isConnecting}
						>
							<Text style={components.ctaText}>
								{isConnecting ? 'Connecting to your wallet...' : 'Connect Leather'}
							</Text>
						</TouchableOpacity>
					)}

					<View style={styles.divider}>
						<View style={styles.line} />
						<Text style={styles.orText}>or enter manually</Text>
						<View style={styles.line} />
					</View>

					<Text style={components.fieldLabel}>Stacks (STX) Address</Text>
					<TextInput
						style={[components.textField, styles.input]}
						placeholder="SP1234..."
						placeholderTextColor={colors.subtleText}
						autoCapitalize="none"
						value={address}
						onChangeText={setAddress}
					/>
					<Text style={styles.helper}>
						{Platform.OS === 'web'
							? 'Smart detection bypasses MetaMask/Phantom conflicts. If connection fails, try disabling other wallets temporarily.'
							: 'Enter your Stacks (STX) address to continue.'
						}
					</Text>

					<TouchableOpacity
						style={[
							components.cta,
							(!validateStacksAddress(address) || isConnecting) && components.disabledButton
						]}
						onPress={handleContinue}
						disabled={!validateStacksAddress(address) || isConnecting}
					>
						{isConnecting ? (
							<ActivityIndicator color="#fff" />
						) : (
							<Text style={components.ctaText}>Continue</Text>
						)}
					</TouchableOpacity>

					<TouchableOpacity onPress={() => router.back()}>
						<Text style={styles.link}>← Back</Text>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	centerContent: {
		...components.card,
		justifyContent: 'center',
		maxWidth: 450,
		alignSelf: 'center',
		width: '90%',
		margin: 20,
	},
	header: {
		marginBottom: 32,
		alignItems: 'center',
	},
	stepTitle: {
		...components.title,
		fontSize: 24,
		marginBottom: 16,
	},
	progressOuter: {
		height: 8,
		backgroundColor: colors.border,
		borderRadius: 999,
		width: '100%',
		maxWidth: 250,
	},
	progressInner: {
		height: 8,
		backgroundColor: colors.secondary,
		borderRadius: 999
	},
	content: {
		gap: 16,
		alignItems: 'center',
	},
	connectButton: {
		backgroundColor: colors.primary,
		borderColor: colors.primaryDark,
		borderWidth: 1,
		// Removed gradient background for solid color theme
	},
	divider: {
		flexDirection: 'row',
		alignItems: 'center',
		width: '100%',
		marginVertical: 12,
	},
	line: {
		flex: 1,
		height: 1,
		backgroundColor: colors.border,
	},
	orText: {
		color: colors.subtleText,
		fontSize: 12,
		marginHorizontal: 16,
		textTransform: 'uppercase',
		letterSpacing: 1,
	},
	input: {
		width: '100%',
		textAlign: 'center',
	},
	helper: {
		color: colors.subtleText,
		fontSize: 13,
		textAlign: 'center',
		maxWidth: 350,
		lineHeight: 18,
	},
	link: {
		color: colors.secondary,
		textAlign: 'center',
		marginTop: 16,
		fontSize: 16,
		fontWeight: '600',
	}
});
