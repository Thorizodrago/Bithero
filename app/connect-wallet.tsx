import { AppConfig, UserSession } from '@stacks/auth';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { createOrUpdateBitcoinUser, getUserByUid } from '../src/db';
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

		if (!userSession) return;

		setIsConnecting(true);
		try {
			// Check if Leather wallet is available
			if (typeof window !== 'undefined' && (window as any).StacksProvider) {
				const provider = (window as any).StacksProvider;
				const response = await provider.request({
					method: 'stx_getAddresses'
				});

				if (response.result && response.result.addresses.length > 0) {
					const stxAddress = response.result.addresses[0];
					setAddress(stxAddress);
					Alert.alert('Wallet Connected', `Connected to: ${stxAddress.slice(0, 8)}...${stxAddress.slice(-8)}`);
				}
			} else {
				Alert.alert('Leather Not Found', 'Please install Leather wallet extension and try again.');
			}
		} catch (error) {
			console.error('Leather connection error:', error);
			Alert.alert('Connection Failed', 'Failed to connect to Leather wallet. Please try again.');
		} finally {
			setIsConnecting(false);
		}
	};

	const validateStacksAddress = (addr: string) => {
		// Basic Stacks address validation - starts with SP or SM for mainnet
		return /^S[PM][0-9A-Z]{38,40}$/i.test(addr);
	};

	const handleContinue = async () => {
		if (!validateStacksAddress(address)) {
			Alert.alert('Invalid Address', 'Please enter a valid Stacks (STX) address.');
			return;
		}
		const user = auth.currentUser;
		if (!user) {
			Alert.alert('Not signed in', 'Please log in first.');
			router.replace('/');
			return;
		}

		const profile = await getUserByUid(user.uid);
		const username = profile?.username;
		if (!username) {
			Alert.alert('Missing nickname', 'Your nickname was not set. Please go back and try creating your account again.');
			router.replace('/create-account');
			return;
		}

		// Save STX address instead of Bitcoin address
		await createOrUpdateBitcoinUser(user, { username, stacksAddress: address });
		router.push(`/add-profile?address=${encodeURIComponent(address)}` as any);
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
								{isConnecting ? '🔄 Connecting...' : '🔗 Connect Leather Wallet'}
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
							? 'Use Leather wallet for secure connection, or enter your STX address manually.'
							: 'Enter your Stacks (STX) address to continue.'
						}
					</Text>

					<TouchableOpacity
						style={[components.cta, !validateStacksAddress(address) && components.disabledButton]}
						onPress={handleContinue}
						disabled={!validateStacksAddress(address)}
					>
						<Text style={components.ctaText}>Continue</Text>
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
