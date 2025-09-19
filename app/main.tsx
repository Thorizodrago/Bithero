import { useRouter } from "expo-router";
import { onAuthStateChanged } from 'firebase/auth';
import React, { useEffect, useState } from "react";
import {
	Alert,
	Image,
	Platform,
	ScrollView,
	StatusBar,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View
} from "react-native";
import { getUserByUid, getUserWalletAddress, searchUsers } from '../src/db';
import { auth } from '../src/firebase';
import SoftBackground from "../src/ui/SoftBackground";
import { colors } from "../src/ui/theme";

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

	useEffect(() => {
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
						// TODO: Load additional user data if needed
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
		console.log('Profile pressed');
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
						await auth.signOut();
						router.replace('/');
					}
				}
			]
		);
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
		<View style={styles.container}>
			<StatusBar barStyle="light-content" backgroundColor={colors.background} />
			<SoftBackground />

			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity onPress={handleProfilePress} style={styles.profileButton}>
					<Image
						source={require('../assets/images/default-profile-picture-male-icon.png')}
						style={styles.profileImage}
					/>
				</TouchableOpacity>

				<View style={styles.stxContainer}>
					<Text style={styles.stxSymbol}>STX</Text>
				</View>
			</View>

			{/* Search Section */}
			<View style={styles.searchSection}>
				<TextInput
					style={styles.searchInput}
					placeholder="Search by name or @username"
					placeholderTextColor={colors.subtleText}
					value={searchTerm}
					onChangeText={handleSearch}
				/>
				<View style={styles.searchHelper}>
					<Text style={styles.searchHelperText}>
						{searchTerm.startsWith('@')
							? "Searching by username"
							: "Searching by real name • Use @username for usernames"
						}
					</Text>
				</View>
			</View>			<View style={styles.walletSection}>
				<Text style={styles.walletLabel}>Wallet Address</Text>
				<Text style={styles.walletAddress} numberOfLines={1} ellipsizeMode="middle">
					{userProfile.stacksAddress || 'No wallet connected'}
				</Text>
			</View>

			{/* Actions */}
			<View style={styles.actionsContainer}>
				<TouchableOpacity style={styles.actionButton}>
					<Text style={styles.actionButtonText}>Send</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.actionButton}>
					<Text style={styles.actionButtonText}>Receive</Text>
				</TouchableOpacity>
			</View>

			{/* Search Results */}
			<ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
				{searchTerm.length >= 2 ? (
					<View style={styles.searchResultsSection}>
						<Text style={styles.sectionTitle}>Search Results</Text>
						{searchResults.length > 0 ? (
							searchResults.map((user, index) => (
								<TouchableOpacity key={user.uid} style={styles.userItem}>
									<Image
										source={require('../assets/images/default-profile-picture-male-icon.png')}
										style={styles.userAvatar}
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

			<TouchableOpacity onPress={handleLogout} style={styles.debugButton}>
				<Text style={styles.debugButtonText}>Sign Out</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
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
		resizeMode: 'cover',
		tintColor: '#fff',
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
		tintColor: '#fff',
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
});
