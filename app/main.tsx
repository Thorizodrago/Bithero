import { useRouter } from "expo-router";
import { onAuthStateChanged, signOut } from 'firebase/auth';
import React, { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	Modal,
	Platform,
	ScrollView,
	StatusBar,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View
} from "react-native";
import { createOrUpdateBitcoinUser, getUserByUid, getUserWalletAddress, searchUsers } from '../src/db';
import { auth } from '../src/firebase';
import SoftBackground from "../src/ui/SoftBackground";
import { colors } from "../src/ui/theme";

// Simplified Stacks transaction without complex dependencies

interface UserProfile {
	uid: string;
	username: string;
	email: string;
	stacksAddress?: string;
	realName?: string;
	profilePictureUrl?: string;
}

export default function Main() {
	const router = useRouter();
	const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [searchResults, setSearchResults] = useState<any[]>([]);

	// Profile editing states
	const [showEditProfile, setShowEditProfile] = useState(false);
	const [editRealName, setEditRealName] = useState("");
	const [editProfileUrl, setEditProfileUrl] = useState("");
	const [saving, setSaving] = useState(false);

	// User detail states
	const [selectedUser, setSelectedUser] = useState<any>(null);
	const [showUserDetail, setShowUserDetail] = useState(false);

	// Wallet management states
	const [showWalletPanel, setShowWalletPanel] = useState(false);
	const [newWalletAddress, setNewWalletAddress] = useState("");

	// Send transaction states
	const [showSendModal, setShowSendModal] = useState(false);
	const [sendAmount, setSendAmount] = useState("");
	const [recipientAddress, setRecipientAddress] = useState("");
	const [sending, setSending] = useState(false);
	const [walletChanging, setWalletChanging] = useState(false);
	const [walletMode, setWalletMode] = useState<'manual' | 'connect'>('manual');
	const [detecting, setDetecting] = useState(false);

	// Wallet connection state
	const [isWalletConnected, setIsWalletConnected] = useState(false);
	const [currentWalletAddress, setCurrentWalletAddress] = useState<any>(null);

	// Check wallet connection status
	const checkWalletConnection = async () => {
		try {
			const walletProvider = (window as any).StacksProvider || (window as any).LeatherProvider;

			if (!walletProvider) {
				setIsWalletConnected(false);
				return false;
			}

			// Test if wallet is actually connected by trying to get addresses
			try {
				const response = await walletProvider.request('stx_getAddresses');
				console.log('🔍 Wallet addresses response:', response);

				if (response?.result?.addresses?.length > 0) {
					// Find STX address specifically
					const stxAddress = response.result.addresses.find((addr: any) => addr.symbol === 'STX');
					console.log('🎯 Found STX address:', stxAddress);

					if (stxAddress) {
						setIsWalletConnected(true);
						setCurrentWalletAddress(stxAddress);
						return true;
					} else {
						console.log('❌ No STX address found in wallet');
						setIsWalletConnected(false);
						setCurrentWalletAddress(null);
						return false;
					}
				} else {
					setIsWalletConnected(false);
					setCurrentWalletAddress(null);
					return false;
				}
			} catch (e) {
				console.log('❌ Wallet connection check failed:', e);
				// Wallet exists but not connected
				setIsWalletConnected(false);
				setCurrentWalletAddress(null);
				return false;
			}
		} catch (e) {
			setIsWalletConnected(false);
			return false;
		}
	};

	// Connect wallet function
	const connectWallet = async () => {
		try {
			setDetecting(true);
			const walletProvider = (window as any).StacksProvider || (window as any).LeatherProvider;

			if (!walletProvider) {
				Alert.alert(
					'Wallet Not Found',
					'Please install Leather wallet extension first.',
					[
						{ text: 'Cancel' },
						{
							text: 'Install Leather',
							onPress: () => {
								if (Platform.OS === 'web') {
									window.open('https://leather.io/', '_blank');
								}
							}
						}
					]
				);
				setDetecting(false);
				return false;
			}

			// Request connection to wallet
			try {
				// Use stx_getAddresses to trigger connection
				const response = await walletProvider.request('stx_getAddresses');
				console.log('🔍 Connect wallet response:', response);

				if (response?.result?.addresses?.length > 0) {
					// Find STX address specifically
					const stxAddress = response.result.addresses.find((addr: any) => addr.symbol === 'STX');
					console.log('🎯 Found STX address for connection:', stxAddress);

					if (stxAddress) {
						setIsWalletConnected(true);
						setCurrentWalletAddress(stxAddress);

						// Update wallet address in database
						if (auth.currentUser && userProfile) {
							try {
								await createOrUpdateBitcoinUser(auth.currentUser, {
									username: userProfile.username,
									realName: userProfile.realName,
									profilePictureUrl: userProfile.profilePictureUrl,
									stacksAddress: stxAddress.address
								});

								// Update local state
								setUserProfile({
									...userProfile,
									stacksAddress: stxAddress.address
								});

								// Update local state
								setUserProfile({
									...userProfile,
									stacksAddress: stxAddress.address
								});

								Alert.alert('Success', `Wallet connected successfully!\nAddress: ${stxAddress.address.slice(0, 8)}...${stxAddress.address.slice(-8)}`);
							} catch (dbError) {
								console.error('Database update error:', dbError);
								Alert.alert('Partial Success', 'Wallet connected but failed to save address. Please update manually.');
							}
						}

						setDetecting(false);
						return true;
					} else {
						console.log('❌ No STX address found during connection');
						throw new Error('No STX address found in wallet');
					}
				} else {
					setIsWalletConnected(false);
					setCurrentWalletAddress(null);
					throw new Error('No addresses returned from wallet');
				}
			} catch (error: any) {
				console.error('Wallet connection error:', error);

				if (error.code === -32002) {
					Alert.alert('Info', 'Please check your wallet extension and approve the connection.');
				} else {
					Alert.alert('Error', 'Failed to connect wallet. Please try again.');
				}

				setDetecting(false);
				return false;
			}
		} catch (error) {
			console.error('Error connecting wallet:', error);
			Alert.alert('Error', 'Failed to connect wallet. Please try again.');
			setDetecting(false);
			return false;
		}
	};

	useEffect(() => {
		// Check wallet connection on component mount only
		const initWallet = async () => {
			await checkWalletConnection();
		};
		initWallet();
	}, []); useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (user) => {
			if (user && user.emailVerified) {
				try {
					const profile = await getUserByUid(user.uid);
					const walletAddress = await getUserWalletAddress(user.uid);

					if (profile) {
						setUserProfile({
							uid: user.uid,
							username: profile.username,
							email: user.email || '',
							stacksAddress: walletAddress || undefined,
							realName: profile.realName,
							profilePictureUrl: profile.profilePictureUrl
						});

						// Set the current wallet address state
						if (walletAddress) {
							setCurrentWalletAddress(walletAddress);
						}

						// Auto-connect removed to prevent popups - user must manually connect wallet
					} else {
						router.replace('/create-account');
					}
				} catch (error) {
					console.error('Error loading user profile:', error);
				}
			} else {
				router.replace('/');
			}
			setLoading(false);
		});

		return () => unsubscribe();
	}, []);

	const handleSearch = async (text: string) => {
		setSearchTerm(text);
		if (text.trim().length < 2) {
			setSearchResults([]);
			return;
		}

		const isUsernameSearch = text.startsWith('@');
		console.log('Searching for:', text, 'isUsername:', isUsernameSearch);
		const results = await searchUsers(text, isUsernameSearch);
		console.log('Search results:', results);
		setSearchResults(results);
	};

	const handleProfilePress = () => {
		setEditRealName(userProfile?.realName || "");
		setEditProfileUrl(userProfile?.profilePictureUrl || "");
		setShowEditProfile(true);
	};

	const handleSaveProfile = async () => {
		if (!userProfile) return;

		setSaving(true);
		try {
			await createOrUpdateBitcoinUser(auth.currentUser!, {
				username: userProfile.username,
				stacksAddress: userProfile.stacksAddress,
				realName: editRealName.trim() || undefined,
				profilePictureUrl: editProfileUrl.trim() || undefined
			});

			// Update local state
			setUserProfile({
				...userProfile,
				realName: editRealName.trim() || undefined,
				profilePictureUrl: editProfileUrl.trim() || undefined
			});

			setShowEditProfile(false);
		} catch (error) {
			console.error('Error saving profile:', error);
			Alert.alert('Error', 'Failed to save profile changes');
		} finally {
			setSaving(false);
		}
	}; const handleCancelEdit = () => {
		setShowEditProfile(false);
		setEditRealName(userProfile?.realName || "");
		setEditProfileUrl(userProfile?.profilePictureUrl || "");
	};

	const handleUserPress = (user: any) => {
		setSelectedUser(user);
		setShowUserDetail(true);
	};

	const handleCloseUserDetail = () => {
		setShowUserDetail(false);
		setSelectedUser(null);
	};

	const handleSendToUser = () => {
		if (selectedUser?.stacksAddress) {
			setRecipientAddress(selectedUser.stacksAddress);
			setShowUserDetail(false);
			setShowSendModal(true);
		} else {
			Alert.alert('Error', 'This user does not have a wallet address set.');
		}
	};

	const formatWalletAddress = (address: string | undefined | null) => {
		if (!address || typeof address !== 'string') return 'No wallet';
		if (address.length <= 8) return address;
		return `${address.slice(0, 2)}..${address.slice(-3)}`;
	};

	const handleWalletPress = () => {
		const walletAddr = currentWalletAddress || userProfile?.stacksAddress || "";
		setNewWalletAddress(walletAddr);
		setShowWalletPanel(true);
	};

	const handleWalletChange = async () => {
		const trimmedAddress = String(newWalletAddress || "").trim();
		if (!trimmedAddress) {
			Alert.alert('Error', 'Please enter a valid wallet address');
			return;
		}

		setWalletChanging(true);
		try {
			await createOrUpdateBitcoinUser(auth.currentUser!, {
				username: userProfile!.username,
				realName: userProfile?.realName,
				profilePictureUrl: userProfile?.profilePictureUrl,
				stacksAddress: trimmedAddress
			});

			// Update local state
			setUserProfile({
				...userProfile!,
				stacksAddress: trimmedAddress
			});
			setCurrentWalletAddress(trimmedAddress);

			setShowWalletPanel(false);
		} catch (error) {
			console.error('Error updating wallet:', error);
			Alert.alert('Error', 'Failed to update wallet address');
		} finally {
			setWalletChanging(false);
		}
	};

	// Helper function for wallet change with specific address
	const handleWalletChangeWithAddress = async (address: string) => {
		setWalletChanging(true);
		try {
			const trimmedAddress = String(address || "").trim();
			await createOrUpdateBitcoinUser(auth.currentUser!, {
				username: userProfile!.username,
				realName: userProfile?.realName,
				profilePictureUrl: userProfile?.profilePictureUrl,
				stacksAddress: trimmedAddress
			});

			// Update local state
			setUserProfile({
				...userProfile!,
				stacksAddress: trimmedAddress
			});
			setCurrentWalletAddress(trimmedAddress);

			setShowWalletPanel(false);
			Alert.alert('Success', 'Wallet address updated successfully!');
		} catch (error) {
			console.error('Error updating wallet:', error);
			Alert.alert('Error', 'Failed to update wallet address');
		} finally {
			setWalletChanging(false);
		}
	};

	const handleCancelWalletChange = () => {
		setShowWalletPanel(false);
		const walletAddr = currentWalletAddress || userProfile?.stacksAddress || "";
		setNewWalletAddress(walletAddr);
		setWalletMode('manual');
	};

	const handleDetectAddress = async () => {
		setDetecting(true);
		try {
			// Try to detect wallet connection
			if (typeof window !== 'undefined' && (window as any).StacksProvider) {
				const provider = (window as any).StacksProvider;
				const response = await provider.request({
					method: 'stx_getAddresses',
				});

				if (response.result && response.result.addresses && response.result.addresses.length > 0) {
					const address = response.result.addresses[0];
					// Automatically update the wallet address
					await handleWalletChangeWithAddress(address);
				} else {
					// No wallet detected, redirect to connect page
					Alert.alert(
						'No Wallet Connected',
						'No Stacks wallet is currently connected. Would you like to connect one?',
						[
							{ text: 'Cancel', style: 'cancel' },
							{
								text: 'Connect Wallet',
								onPress: () => {
									setShowWalletPanel(false);
									router.push('/connect-wallet');
								}
							}
						]
					);
				}
			} else {
				// No StacksProvider available, redirect to connect page
				Alert.alert(
					'Install Wallet',
					'No Stacks wallet detected. Please install Hiro Wallet or another Stacks wallet first.',
					[
						{ text: 'Cancel', style: 'cancel' },
						{
							text: 'Go to Connect Page',
							onPress: () => {
								setShowWalletPanel(false);
								router.push('/connect-wallet');
							}
						}
					]
				);
			}
		} catch (error) {
			console.error('Error detecting wallet:', error);
			Alert.alert(
				'Detection Failed',
				'Failed to detect wallet automatically. Would you like to try connecting manually?',
				[
					{ text: 'Cancel', style: 'cancel' },
					{
						text: 'Manual Connect',
						onPress: () => {
							setShowWalletPanel(false);
							router.push('/connect-wallet');
						}
					}
				]
			);
		} finally {
			setDetecting(false);
		}
	};

	const handleLogout = () => {
		Alert.alert(
			'Sign Out',
			'Are you sure you want to sign out?',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Sign Out',
					style: 'destructive',
					onPress: async () => {
						try {
							console.log('Attempting to sign out...');
							await signOut(auth);
							console.log('Sign out successful');
							// Force navigation after sign out
							setTimeout(() => {
								router.replace('/');
							}, 100);
						} catch (error) {
							console.error('Error signing out:', error);
							Alert.alert('Error', 'Failed to sign out. Please try again.');
						}
					}
				}
			]
		);
	};

	const handleSendTransaction = async () => {
		console.log('🔥 Send button clicked!');

		if (!sendAmount.trim()) {
			console.log('❌ No amount entered');
			Alert.alert('Error', 'Please enter an amount to send');
			return;
		}

		if (!recipientAddress.trim()) {
			console.log('❌ No recipient address');
			Alert.alert('Error', 'Please enter a recipient address');
			return;
		}

		// Validate amount is a positive number
		const amount = parseFloat(sendAmount);
		if (isNaN(amount) || amount <= 0) {
			console.log('❌ Invalid amount:', amount);
			Alert.alert('Error', 'Please enter a valid amount greater than 0');
			return;
		}

		// Check wallet connection first
		if (!isWalletConnected) {
			console.log('❌ Wallet not connected');
			Alert.alert('Wallet Required', 'Please connect your wallet first to send transactions.');
			return;
		}

		console.log('✅ All checks passed, showing confirmation dialog...');
		console.log('Send Data:', {
			sendAmount,
			amount,
			recipientAddress,
			isWalletConnected,
			currentWalletAddress
		});

		// Web'de Alert.alert çalışmıyor, direkt transfer yap
		console.log('📢 Web platform detected, proceeding with direct transfer...');
		console.log('🚀 Performing STX transfer...');
		performSendTransaction(amount);

	};

	const performSendTransaction = async (amount: number) => {
		console.log('🎯 PERFORMSENDTRANSACTION CALLED! Amount:', amount);
		setSending(true);

		try {
			console.log('🚀 Starting STX transfer:', {
				amount: amount,
				microStxAmount: Math.floor(amount * 1000000),
				recipient: recipientAddress,
				currentWallet: currentWalletAddress,
				userProfileWallet: userProfile?.stacksAddress
			});

			// Use current STX wallet address
			const stxWalletAddress = (currentWalletAddress && typeof currentWalletAddress === 'object' && currentWalletAddress.address)
				? currentWalletAddress.address
				: (typeof currentWalletAddress === 'string' ? currentWalletAddress : userProfile?.stacksAddress); if (!stxWalletAddress) {
					Alert.alert('Error', 'No STX wallet address available. Please reconnect your wallet.');
					setSending(false);
					return;
				}

			console.log('🎯 Using STX address:', stxWalletAddress);

			// Convert STX to microSTX (1 STX = 1,000,000 microSTX)
			const microStxAmount = Math.floor(amount * 1000000);

			console.log('💰 Direct STX transfer parameters:', {
				amount: microStxAmount,
				recipient: recipientAddress,
				memo: `BitHero: ${amount} STX`
			});

			// Use wallet provider for direct STX transfer
			const walletProvider = (window as any).StacksProvider || (window as any).LeatherProvider;

			if (walletProvider && walletProvider.request) {
				try {
					console.log('🚀 Starting direct STX transfer...');

					// Try different Leather methods
					let result;

					try {
						// Method 1: Try the simplest possible STX transfer
						console.log('🔄 Trying simple STX transfer...');
						result = await walletProvider.request({
							method: 'stx_transferSTX',
							params: {
								amount: microStxAmount,
								recipient: recipientAddress,
								memo: `BitHero: ${amount} STX`,
								network: 'testnet'
							}
						});
						console.log('✅ Simple STX transfer successful!', result);
					} catch (methodError: any) {
						console.log('🔄 Simple method failed, trying requestSTXTransfer...');
						console.error('Simple method error:', methodError);

						// Method 2: Try requestSTXTransfer (alternative Leather method)
						try {
							result = await walletProvider.request('requestSTXTransfer', {
								amount: microStxAmount.toString(),
								recipient: recipientAddress,
								memo: `BitHero: ${amount} STX`
							});
							console.log('✅ requestSTXTransfer successful!', result);
						} catch (altError: any) {
							console.log('🔄 requestSTXTransfer failed, trying basic request...');
							console.error('requestSTXTransfer error:', altError);

							// Method 3: Most basic request format
							result = await walletProvider.request('stx_transfer', {
								amount: microStxAmount,
								to: recipientAddress,
								memo: `BitHero: ${amount} STX`
							});
							console.log('✅ Basic stx_transfer successful!', result);
						}
					} console.log('✅ Transfer successful!', result);
					Alert.alert('Success', `Successfully sent ${amount} STX to ${recipientAddress}!\n\nTransaction ID: ${result.txid || result.txId || 'Pending'}`);
					setShowSendModal(false);
					setSendAmount("");
					setRecipientAddress("");
					setSending(false);
				} catch (error: any) {
					console.error('❌ Transfer failed:', error);
					console.error('❌ Error details:', {
						code: error.code,
						message: error.message,
						details: error
					});

					if (error.code === 4001) {
						Alert.alert('Cancelled', 'Transaction was cancelled by user.');
					} else if (error.code === -32002) {
						Alert.alert('Pending', 'Please check your wallet and approve the transaction.');
					} else {
						Alert.alert('Transfer Failed', `Transfer failed: ${error.message || 'Unknown error'}`);
					}
					setSending(false);
				}
			} else {
				throw new Error('Wallet provider not available');
			}

		} catch (error) {
			console.error('Error sending transaction:', error);
			Alert.alert('Error', 'Failed to send transaction. Please try again.');
			setSending(false);
		}
	};

	const handleCancelSend = () => {
		setShowSendModal(false);
		setSendAmount("");
		setRecipientAddress("");
	};

	if (loading) {
		return (
			<View style={styles.container}>
				<SoftBackground />
				<View style={styles.centerContent}>
					<Text style={styles.loadingText}>Loading...</Text>
				</View>
			</View>
		);
	}

	if (!userProfile) {
		return null;
	}

	return (
		<View style={styles.appWrapper}>
			<View style={styles.container}>
				<StatusBar barStyle="light-content" backgroundColor={colors.background} />
				<SoftBackground />

				{/* Compact Header with Search */}
				<View style={styles.compactHeader}>
					<View style={styles.headerRow}>
						<TouchableOpacity onPress={handleProfilePress} style={styles.profileButton}>
							<Image
								source={
									userProfile?.profilePictureUrl
										? { uri: userProfile.profilePictureUrl }
										: require('../assets/images/default-profile-picture-male-icon.png')
								}
								style={styles.profileImage}
								resizeMode="cover"
								tintColor={!userProfile?.profilePictureUrl ? '#fff' : undefined}
							/>
						</TouchableOpacity>

						<View style={styles.userInfo}>
							<Text style={styles.userName}>{userProfile.realName || userProfile.username}</Text>
							<View style={styles.walletAddressRow}>
								<TouchableOpacity onPress={handleWalletPress}>
									<Text style={styles.userAddress}>
										{formatWalletAddress(currentWalletAddress || userProfile.stacksAddress)}
									</Text>
								</TouchableOpacity>
								<View style={[
									styles.walletStatusDot,
									isWalletConnected ? styles.walletConnected : styles.walletDisconnected
								]} />
							</View>
						</View>

						<View style={styles.stxContainer}>
							<Text style={styles.stxSymbol}>STX</Text>
						</View>
					</View>

					{/* Search Input */}
					<TextInput
						style={styles.searchInput}
						placeholder="Search by name or @username"
						placeholderTextColor={colors.subtleText}
						value={searchTerm}
						onChangeText={handleSearch}
					/>
				</View>

				{/* Search Results */}
				<ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
					{searchTerm.length >= 2 ? (
						<View style={styles.searchResultsSection}>
							<Text style={styles.sectionTitle}>Search Results</Text>
							{searchResults.length > 0 ? (
								searchResults.map((user, index) => (
									<TouchableOpacity
										key={user.uid}
										style={styles.userItem}
										onPress={() => handleUserPress(user)}
									>
										<Image
											source={
												user.profilePictureUrl
													? { uri: user.profilePictureUrl }
													: require('../assets/images/default-profile-picture-male-icon.png')
											}
											style={styles.userAvatar}
											tintColor={!user.profilePictureUrl ? '#fff' : undefined}
										/>
										<View style={styles.userInfo}>
											<Text style={styles.userName}>
												{user.realName || 'No real name'}
											</Text>
											<Text style={styles.userSecondary}>
												@{user.username}
											</Text>
										</View>
									</TouchableOpacity>
								))
							) : (
								<View style={styles.emptyState}>
									<Text style={styles.emptyStateText}>
										{searchTerm.startsWith('@') ?
											`No users found with username "${searchTerm}"` :
											`No users found with name "${searchTerm}"`
										}
									</Text>
								</View>
							)}
						</View>
					) : (
						<View style={styles.activitySection}>
							<Text style={styles.sectionTitle}>Recent Activity</Text>
							<View style={styles.emptyState}>
								<Text style={styles.emptyStateText}>No recent transactions</Text>
							</View>
						</View>
					)}
				</ScrollView>

				<TouchableOpacity onPress={handleLogout} style={styles.signOutButton}>
					<Text style={styles.signOutButtonText}>Sign Out</Text>
				</TouchableOpacity>

				{/* Edit Profile Modal */}
				<Modal
					visible={showEditProfile}
					animationType="slide"
					presentationStyle="pageSheet"
					onRequestClose={handleCancelEdit}
				>
					<View style={styles.modalContainer}>
						<View style={styles.modalHeader}>
							<TouchableOpacity onPress={handleCancelEdit} style={styles.cancelButton}>
								<Text style={styles.cancelButtonText}>Cancel</Text>
							</TouchableOpacity>
							<Text style={styles.modalTitle}>Edit Profile</Text>
							<TouchableOpacity
								onPress={handleSaveProfile}
								style={[styles.saveButton, saving && styles.saveButtonDisabled]}
								disabled={saving}
							>
								{saving ? (
									<ActivityIndicator color="#fff" size="small" />
								) : (
									<Text style={styles.saveButtonText}>Save</Text>
								)}
							</TouchableOpacity>
						</View>

						<ScrollView style={styles.modalContent}>
							<View style={styles.editSection}>
								<Text style={styles.editLabel}>Real Name</Text>
								<TextInput
									style={styles.editInput}
									placeholder="Enter your real name"
									placeholderTextColor={colors.subtleText}
									value={editRealName}
									onChangeText={setEditRealName}
									editable={!saving}
								/>
							</View>

							<View style={styles.editSection}>
								<Text style={styles.editLabel}>Profile Picture URL</Text>
								<TextInput
									style={styles.editInput}
									placeholder="Enter profile picture URL"
									placeholderTextColor={colors.subtleText}
									value={editProfileUrl}
									onChangeText={setEditProfileUrl}
									editable={!saving}
									autoCapitalize="none"
								/>
							</View>

							{editProfileUrl ? (
								<View style={styles.previewSection}>
									<Text style={styles.editLabel}>Preview</Text>
									<Image
										source={{ uri: editProfileUrl }}
										style={styles.profilePreview}
										onError={() => Alert.alert('Error', 'Invalid image URL')}
									/>
								</View>
							) : null}
						</ScrollView>
					</View>
				</Modal>

				{/* User Detail Modal */}
				<Modal
					visible={showUserDetail}
					animationType="slide"
					presentationStyle="pageSheet"
					onRequestClose={handleCloseUserDetail}
				>
					<View style={styles.modalContainer}>
						<View style={styles.modalHeader}>
							<TouchableOpacity onPress={handleCloseUserDetail} style={styles.cancelButton}>
								<Text style={styles.cancelButtonText}>Close</Text>
							</TouchableOpacity>
							<Text style={styles.modalTitle}>User Details</Text>
							<TouchableOpacity
								onPress={handleSendToUser}
								style={styles.saveButton}
							>
								<Text style={styles.saveButtonText}>Send</Text>
							</TouchableOpacity>
						</View>

						<ScrollView style={styles.modalContent}>
							{selectedUser && (
								<>
									<View style={styles.userDetailSection}>
										<Image
											source={
												selectedUser.profilePictureUrl
													? { uri: selectedUser.profilePictureUrl }
													: require('../assets/images/default-profile-picture-male-icon.png')
											}
											style={styles.userDetailAvatar}
											tintColor={!selectedUser.profilePictureUrl ? '#fff' : undefined}
										/>
										<Text style={styles.userDetailName}>
											{selectedUser.realName || 'No real name'}
										</Text>
										<Text style={styles.userDetailUsername}>
											@{selectedUser.username}
										</Text>
									</View>

									<View style={styles.detailItem}>
										<Text style={styles.detailLabel}>Wallet Address</Text>
										<Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="middle">
											{selectedUser.stacksAddress || 'Not available'}
										</Text>
									</View>

									<View style={styles.detailItem}>
										<Text style={styles.detailLabel}>Email</Text>
										<Text style={styles.detailValue}>
											{selectedUser.email || 'Not available'}
										</Text>
									</View>

									<View style={styles.detailItem}>
										<Text style={styles.detailLabel}>Real Name</Text>
										<Text style={styles.detailValue}>
											{selectedUser.realName || 'Not set'}
										</Text>
									</View>

									<View style={styles.detailItem}>
										<Text style={styles.detailLabel}>Username</Text>
										<Text style={styles.detailValue}>
											@{selectedUser.username}
										</Text>
									</View>
								</>
							)}
						</ScrollView>
					</View>
				</Modal>

				{/* Wallet Change Modal */}
				<Modal
					visible={showWalletPanel}
					animationType="slide"
					presentationStyle="pageSheet"
					onRequestClose={handleCancelWalletChange}
				>
					<View style={styles.modalContainer}>
						<View style={styles.modalHeader}>
							<TouchableOpacity onPress={handleCancelWalletChange} style={styles.cancelButton}>
								<Text style={styles.cancelButtonText}>Cancel</Text>
							</TouchableOpacity>
							<Text style={styles.modalTitle}>Change Wallet</Text>
							{walletMode === 'manual' ? (
								<TouchableOpacity
									onPress={handleWalletChange}
									style={[styles.saveButton, (walletChanging || !String(newWalletAddress || "").trim()) && styles.saveButtonDisabled]}
									disabled={walletChanging || !String(newWalletAddress || "").trim()}
								>
									{walletChanging ? (
										<ActivityIndicator color="#fff" size="small" />
									) : (
										<Text style={styles.saveButtonText}>Save</Text>
									)}
								</TouchableOpacity>
							) : (
								<View style={styles.saveButton} />
							)}
						</View>

						<View style={styles.modalContent}>
							<View style={styles.editSection}>
								<Text style={styles.editLabel}>Current Wallet Address</Text>
								<Text style={styles.currentWalletText}>
									{userProfile?.stacksAddress || 'No wallet connected'}
								</Text>
							</View>

							{/* Wallet Connection Mode */}
							<View style={styles.editSection}>
								<Text style={styles.editLabel}>Connection Method</Text>
								<View style={styles.walletModeContainer}>
									<TouchableOpacity
										style={[
											styles.modeButton,
											walletMode === 'connect' && styles.modeButtonActive
										]}
										onPress={() => setWalletMode('connect')}
									>
										<Text style={[
											styles.modeButtonText,
											walletMode === 'connect' && styles.modeButtonTextActive
										]}>
											Connect Wallet
										</Text>
									</TouchableOpacity>
									<TouchableOpacity
										style={[
											styles.modeButton,
											walletMode === 'manual' && styles.modeButtonActive
										]}
										onPress={() => setWalletMode('manual')}
									>
										<Text style={[
											styles.modeButtonText,
											walletMode === 'manual' && styles.modeButtonTextActive
										]}>
											Manual Entry
										</Text>
									</TouchableOpacity>
								</View>
							</View>

							{walletMode === 'connect' ? (
								<View style={styles.editSection}>
									<Text style={styles.editLabel}>Auto-Detect Wallet</Text>
									<TouchableOpacity
										style={[styles.detectButton, detecting && styles.detectButtonDisabled]}
										onPress={handleDetectAddress}
										disabled={detecting}
									>
										{detecting ? (
											<>
												<ActivityIndicator color="#fff" size="small" style={styles.buttonLoader} />
												<Text style={styles.detectButtonText}>Detecting...</Text>
											</>
										) : (
											<Text style={styles.detectButtonText}>🔍 Detect & Connect Wallet</Text>
										)}
									</TouchableOpacity>
									<Text style={styles.walletConnectHelpText}>
										This will automatically detect your connected wallet and update your address. If no wallet is connected, it will prompt you to connect one.
									</Text>
								</View>
							) : (
								<View style={styles.editSection}>
									<Text style={styles.editLabel}>New Wallet Address</Text>
									<TextInput
										style={styles.editInput}
										placeholder="Enter new wallet address"
										placeholderTextColor={colors.subtleText}
										value={newWalletAddress}
										onChangeText={setNewWalletAddress}
										editable={!walletChanging}
										autoCapitalize="none"
										multiline={true}
										numberOfLines={3}
									/>
								</View>
							)}

							<View style={styles.walletHelpSection}>
								<Text style={styles.walletHelpText}>
									💡 {walletMode === 'connect'
										? 'Use "Detect" to automatically find your wallet address, or "Connect" to use the full connection flow.'
										: 'Enter your new Stacks wallet address. This will be used for all transactions.'
									}
								</Text>
							</View>
						</View>
					</View>
				</Modal>

				{/* Send Transaction Modal */}
				<Modal
					visible={showSendModal}
					animationType="slide"
					presentationStyle="pageSheet"
					onRequestClose={handleCancelSend}
				>
					<View style={styles.modalContainer}>
						<View style={styles.modalHeader}>
							<TouchableOpacity onPress={handleCancelSend} style={styles.cancelButton}>
								<Text style={styles.cancelButtonText}>Cancel</Text>
							</TouchableOpacity>
							<Text style={styles.modalTitle}>Send Transaction</Text>
							<TouchableOpacity
								onPress={handleSendTransaction}
								style={[
									styles.saveButton,
									(sending || !sendAmount.trim() || !recipientAddress.trim() || !isWalletConnected) && styles.saveButtonDisabled
								]}
								disabled={sending || !sendAmount.trim() || !recipientAddress.trim() || !isWalletConnected}
							>
								{sending ? (
									<ActivityIndicator color="#fff" size="small" />
								) : (
									<Text style={styles.saveButtonText}>Send</Text>
								)}
							</TouchableOpacity>
						</View>

						<View style={styles.modalContent}>
							{/* Wallet Connection Section */}
							<View style={styles.editSection}>
								<Text style={styles.editLabel}>Wallet Connection</Text>
								<View style={styles.walletConnectionRow}>
									<View style={styles.walletStatus}>
										<View style={[styles.walletStatusDot, isWalletConnected ? styles.walletConnected : styles.walletDisconnected]} />
										<Text style={styles.walletStatusText}>
											{isWalletConnected ? 'Wallet Connected' : 'Wallet Not Connected'}
										</Text>
									</View>
									{!isWalletConnected && (
										<TouchableOpacity
											onPress={connectWallet}
											style={[styles.connectWalletButton, detecting && styles.connectWalletButtonDisabled]}
											disabled={detecting}
										>
											{detecting ? (
												<ActivityIndicator color="#fff" size="small" />
											) : (
												<Text style={styles.connectWalletButtonText}>Connect Wallet</Text>
											)}
										</TouchableOpacity>
									)}
								</View>
							</View>

							<View style={styles.editSection}>
								<Text style={styles.editLabel}>Amount (STX)</Text>
								<TextInput
									style={styles.editInput}
									placeholder="Enter amount to send"
									placeholderTextColor={colors.subtleText}
									value={sendAmount}
									onChangeText={setSendAmount}
									editable={!sending}
									keyboardType="numeric"
								/>
							</View>

							<View style={styles.editSection}>
								<Text style={styles.editLabel}>Recipient Address</Text>
								<TextInput
									style={styles.editInput}
									placeholder="Enter recipient wallet address"
									placeholderTextColor={colors.subtleText}
									value={recipientAddress}
									onChangeText={setRecipientAddress}
									editable={!sending}
									autoCapitalize="none"
									multiline={true}
									numberOfLines={3}
								/>
							</View>

							<View style={styles.walletHelpSection}>
								<Text style={styles.walletHelpText}>
									💡 Make sure the recipient address is correct. Transactions cannot be reversed once sent.
								</Text>
							</View>
						</View>
					</View>
				</Modal>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	appWrapper: {
		flex: 1,
		backgroundColor: colors.background,
		justifyContent: 'center',
		alignItems: 'center',
	},
	container: {
		flex: 1,
		backgroundColor: colors.background,
		maxWidth: 600, // Tablet/phone max width
		alignSelf: 'center',
		width: '100%',
	},
	centerContent: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		color: colors.text,
		fontSize: 16,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingTop: Platform.OS === 'ios' ? 60 : 40,
		paddingBottom: 20,
	},
	profileButton: {
		width: 44,
		height: 44,
		borderRadius: 22,
		overflow: 'hidden',
		borderWidth: 2,
		borderColor: colors.border,
	},
	profileImage: {
		width: '100%',
		height: '100%',
	},
	stxContainer: {
		backgroundColor: colors.primary,
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
	},
	stxSymbol: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '700',
	},
	walletSection: {
		paddingHorizontal: 20,
		marginBottom: 32,
	},
	walletLabel: {
		color: colors.subtleText,
		fontSize: 14,
		marginBottom: 8,
	},
	walletAddress: {
		color: colors.text,
		fontSize: 16,
		fontFamily: 'monospace',
		backgroundColor: colors.inputBg,
		padding: 12,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: colors.border,
	},
	actionsContainer: {
		flexDirection: 'row',
		paddingHorizontal: 20,
		gap: 12,
		marginBottom: 32,
	},
	actionButton: {
		flex: 1,
		backgroundColor: colors.primary,
		paddingVertical: 14,
		borderRadius: 10,
		alignItems: 'center',
	},
	actionButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
	scrollContent: {
		flex: 1,
	},
	searchSection: {
		paddingHorizontal: 20,
		marginBottom: 20,
	},
	searchInput: {
		backgroundColor: colors.inputBg,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 10,
		paddingHorizontal: 16,
		paddingVertical: 12,
		fontSize: 16,
		color: colors.text,
		marginBottom: 8,
	},
	searchHelper: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 8,
	},
	searchHelperText: {
		fontSize: 12,
		color: colors.subtleText,
		marginLeft: 6,
	},
	activitySection: {
		paddingHorizontal: 20,
	},
	searchResultsSection: {
		paddingHorizontal: 20,
	},
	userItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 12,
		paddingHorizontal: 16,
		backgroundColor: colors.inputBg,
		marginBottom: 8,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: colors.border,
	},
	userAvatar: {
		width: 40,
		height: 40,
		borderRadius: 20,
		marginRight: 12,
	},
	userInfo: {
		flex: 1,
	},
	userName: {
		fontSize: 16,
		fontWeight: '600',
		color: colors.text,
		marginBottom: 2,
	},
	userSecondary: {
		fontSize: 14,
		color: colors.subtleText,
	},
	sectionTitle: {
		color: colors.text,
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 16,
	},
	emptyState: {
		alignItems: 'center',
		paddingVertical: 40,
	},
	emptyStateText: {
		color: colors.subtleText,
		fontSize: 16,
	},
	debugButton: {
		margin: 20,
		backgroundColor: colors.border,
		paddingVertical: 12,
		borderRadius: 8,
		alignItems: 'center',
	},
	debugButtonText: {
		color: colors.text,
		fontSize: 14,
		fontWeight: '600',
	},
	signOutButton: {
		margin: 20,
		backgroundColor: '#ff4757',
		paddingVertical: 14,
		borderRadius: 10,
		alignItems: 'center',
		...(Platform.OS === 'web' ? {
			boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.1)',
		} : {
			shadowColor: '#000',
			shadowOffset: {
				width: 0,
				height: 2,
			},
			shadowOpacity: 0.1,
			shadowRadius: 3.84,
			elevation: 5,
		}),
	},
	signOutButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
	modalContainer: {
		flex: 1,
		backgroundColor: colors.background,
	},
	modalHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
		backgroundColor: colors.background,
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: colors.text,
	},
	cancelButton: {
		paddingVertical: 8,
		paddingHorizontal: 12,
	},
	cancelButtonText: {
		color: colors.primary,
		fontSize: 16,
		fontWeight: '600',
	},
	saveButton: {
		backgroundColor: colors.primary,
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 8,
		minWidth: 60,
		alignItems: 'center',
	},
	saveButtonDisabled: {
		opacity: 0.6,
	},
	saveButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
	modalContent: {
		flex: 1,
		padding: 20,
	},
	editSection: {
		marginBottom: 24,
	},
	editLabel: {
		fontSize: 16,
		fontWeight: '600',
		color: colors.text,
		marginBottom: 8,
	},
	editInput: {
		backgroundColor: colors.inputBg,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 10,
		paddingHorizontal: 16,
		paddingVertical: 12,
		fontSize: 16,
		color: colors.text,
	},
	previewSection: {
		marginBottom: 24,
		alignItems: 'center',
	},
	profilePreview: {
		width: 80,
		height: 80,
		borderRadius: 40,
		marginTop: 8,
	},
	compactHeader: {
		paddingHorizontal: 20,
		paddingTop: Platform.OS === 'ios' ? 60 : 40,
		paddingBottom: 20,
	},
	headerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 16,
	},
	userAddress: {
		fontSize: 12,
		color: colors.primary,
		marginTop: 2,
		textDecorationLine: 'underline',
	},
	userDetailSection: {
		alignItems: 'center',
		marginBottom: 32,
		paddingVertical: 20,
	},
	userDetailAvatar: {
		width: 80,
		height: 80,
		borderRadius: 40,
		marginBottom: 16,
	},
	userDetailName: {
		fontSize: 20,
		fontWeight: '600',
		color: colors.text,
		marginBottom: 4,
	},
	userDetailUsername: {
		fontSize: 16,
		color: colors.subtleText,
	},
	detailItem: {
		marginBottom: 20,
		paddingBottom: 16,
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	detailLabel: {
		fontSize: 14,
		fontWeight: '600',
		color: colors.subtleText,
		marginBottom: 4,
	},
	detailValue: {
		fontSize: 16,
		color: colors.text,
	},
	currentWalletText: {
		fontSize: 14,
		color: colors.text,
		backgroundColor: colors.inputBg,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 8,
		padding: 12,
		fontFamily: 'monospace',
	},
	walletHelpSection: {
		marginTop: 16,
		padding: 16,
		backgroundColor: colors.inputBg,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: colors.border,
	},
	walletHelpText: {
		fontSize: 14,
		color: colors.subtleText,
		lineHeight: 20,
	},
	// New wallet modal styles
	walletModeContainer: {
		flexDirection: 'row',
		gap: 8,
		marginBottom: 12,
	},
	modeButton: {
		flex: 1,
		padding: 12,
		borderRadius: 8,
		backgroundColor: colors.inputBg,
		borderWidth: 1,
		borderColor: colors.border,
		alignItems: 'center',
	},
	modeButtonActive: {
		backgroundColor: '#e3f2fd',
		borderColor: colors.primary,
	},
	modeButtonText: {
		fontSize: 14,
		color: colors.subtleText,
		fontWeight: '500',
	},
	modeButtonTextActive: {
		color: colors.primary,
	},
	detectButton: {
		backgroundColor: '#4CAF50',
		padding: 14,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
		flexDirection: 'row',
		marginBottom: 12,
	},
	detectButtonDisabled: {
		backgroundColor: '#a5d6a7',
		opacity: 0.7,
	},
	detectButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
	buttonLoader: {
		marginRight: 8,
	},
	walletConnectHelpText: {
		fontSize: 13,
		color: colors.subtleText,
		lineHeight: 18,
		marginTop: 8,
		textAlign: 'center',
	},
	// Wallet Connection Styles
	walletConnectionRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: 8,
	},
	walletStatus: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	walletStatusDot: {
		width: 10,
		height: 10,
		borderRadius: 5,
		marginRight: 8,
	},
	walletConnected: {
		backgroundColor: '#4CAF50',
	},
	walletDisconnected: {
		backgroundColor: '#f44336',
	},
	walletStatusText: {
		fontSize: 14,
		color: colors.text,
		fontWeight: '500',
	},
	connectWalletButton: {
		backgroundColor: colors.primary,
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 6,
		alignItems: 'center',
		justifyContent: 'center',
	},
	connectWalletButtonDisabled: {
		backgroundColor: colors.subtleText,
		opacity: 0.6,
	},
	connectWalletButtonText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '600',
	},
	// Header wallet status
	walletAddressRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
});
