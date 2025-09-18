import { useRouter } from "expo-router";
import { onAuthStateChanged } from 'firebase/auth';
import React, { useEffect, useState } from "react";
import {
	Alert,
	Dimensions,
	Image,
	Platform,
	ScrollView,
	StatusBar,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from "react-native";
import { getUserByUid } from '../src/db';
import { auth } from '../src/firebase';
import SoftBackground from "../src/ui/SoftBackground";
import { colors, components } from "../src/ui/theme";

const { width, height } = Dimensions.get('window');

export default function Main() {
	const router = useRouter();
	const [user, setUser] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [firstName, setFirstName] = useState("");

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (user) => {
			if (user && user.emailVerified) {
				setUser(user);
				// Extract first name
				if (user.displayName) {
					const name = user.displayName.split(' ')[0];
					setFirstName(name);
				} else {
					const emailName = user.email?.split('@')[0] || "User";
					setFirstName(emailName.charAt(0).toUpperCase() + emailName.slice(1));
				}
				// Check profile completeness
				try {
					const uDoc = await getUserByUid(user.uid);
					if (!uDoc || !uDoc.bitcoinAddress || !uDoc.username) {
						router.replace('/connect-wallet');
						return;
					}
				} catch { }
			} else {
				router.replace("/");
			}
			setLoading(false);
		});

		return () => unsubscribe();
	}, []);

	const handlePremiumPress = () => {
		Alert.alert("Premium Features", "Premium page coming soon!");
	};

	const handleToolsPress = () => {
		router.push('/transfers');
	};

	const handleProfilePress = () => {
		router.push("/profile");
	};

	if (loading) {
		return React.createElement(View, { style: styles.loadingContainer },
			React.createElement(Text, { style: styles.loadingText }, "Loading...")
		);
	}

	if (!user) {
		return null; // Will redirect to login
	}

	return React.createElement(View, { style: styles.container },
		React.createElement(StatusBar, {
			barStyle: "dark-content",
			backgroundColor: colors.background,
			translucent: Platform.OS === 'android'
		}),
		React.createElement(SoftBackground, null),

		React.createElement(ScrollView, {
			contentContainerStyle: styles.scrollContainer,
			showsVerticalScrollIndicator: false,
			style: styles.scrollView
		},
			// Welcome Section (outside container)
			React.createElement(View, { style: styles.welcomeSection },
				React.createElement(Text, { style: styles.welcomeText }, `Welcome, ${firstName}`)
			),

			// Main content area
			React.createElement(View, { style: styles.contentArea },
				React.createElement(View, { style: styles.dashboardCard },
					React.createElement(Text, { style: styles.dashboardTitle }, "Bithero Dashboard"),
					React.createElement(Text, { style: styles.dashboardSubtitle }, "Send Bitcoin by username, manage your profile, and explore premium tools."),
					React.createElement(View, { style: styles.quickActions },
						React.createElement(TouchableOpacity, {
							style: styles.actionButton,
							onPress: handleToolsPress
						},
							React.createElement(Text, { style: styles.actionIcon }, "💸"),
							React.createElement(Text, { style: styles.actionText }, "Send BTC")
						),
						React.createElement(TouchableOpacity, {
							style: styles.actionButton,
							onPress: handleProfilePress
						},
							React.createElement(Text, { style: styles.actionIcon }, "👤"),
							React.createElement(Text, { style: styles.actionText }, "Profile")
						),
						React.createElement(TouchableOpacity, {
							style: styles.actionButton,
							onPress: handlePremiumPress
						},
							React.createElement(Text, { style: styles.actionIcon }, "⭐"),
							React.createElement(Text, { style: styles.actionText }, "Premium")
						)
					)
				),
				React.createElement(View, { style: styles.infoCard },
					React.createElement(Text, { style: styles.infoTitle }, "How it works?"),
					React.createElement(Text, { style: styles.infoText }, "1. Create your account and verify your email.\n2. Add your Bitcoin address.\n3. Send BTC to any username instantly!\n4. Pin contacts and view your transfer history.")
				)
			)
		),

		// Bottom Tab Navigation
		React.createElement(View, { style: styles.bottomTabContainer },
			// Home Tab (Current page - active)
			React.createElement(TouchableOpacity, {
				style: styles.tabButton,
				onPress: () => { } // Already on home
			},
				React.createElement(Image, {
					source: require("../assets/images/home-icon.png"),
					style: [styles.tabIcon, styles.activeTabIcon]
				})
			),

			// Premium Tab
			React.createElement(TouchableOpacity, {
				style: styles.tabButton,
				onPress: handlePremiumPress
			},
				React.createElement(Image, {
					source: require("../assets/images/home-icon.png"),
					style: [styles.tabIcon, styles.inactiveTabIcon]
				})
			),

			// Tools Tab
			React.createElement(TouchableOpacity, {
				style: styles.tabButton,
				onPress: handleToolsPress
			},
				React.createElement(Image, {
					source: require("../assets/images/home-icon.png"),
					style: [styles.tabIcon, styles.inactiveTabIcon]
				})
			),

			// Profile Tab
			React.createElement(TouchableOpacity, {
				style: styles.tabButton,
				onPress: handleProfilePress
			},
				React.createElement(Image, {
					source: require("../assets/images/home-icon.png"),
					style: [styles.profileIcon, styles.inactiveTabIcon]
				})
			)
		)
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
	},
	loadingContainer: {
		flex: 1,
		backgroundColor: colors.background,
		justifyContent: "center",
		alignItems: "center",
	},
	loadingText: {
		color: colors.primary,
		fontSize: 18,
	},
	scrollView: {
		flex: 1,
	},
	scrollContainer: {
		flexGrow: 1,
		paddingBottom: 100,
	},
	welcomeSection: {
		paddingHorizontal: 20,
		paddingTop: Platform.OS === 'android' ? 50 : 60,
		paddingBottom: 20,
	},
	welcomeText: {
		fontSize: 24,
		fontWeight: "700",
		color: colors.text,
		textAlign: "center",
	},
	contentArea: {
		flex: 1,
		paddingHorizontal: 20,
		justifyContent: "center",
		alignItems: "center",
		minHeight: height * 0.6,
		gap: 24,
	},
	dashboardCard: {
		...components.card,
		width: '100%',
		maxWidth: 420,
		padding: 24,
	},
	dashboardTitle: {
		fontSize: 20,
		fontWeight: '700',
		color: colors.text,
		marginBottom: 6,
		textAlign: 'center',
	},
	dashboardSubtitle: {
		fontSize: 14,
		color: colors.subtleText,
		marginBottom: 18,
		textAlign: 'center',
	},
	quickActions: {
		flexDirection: 'row',
		gap: 18,
		justifyContent: 'center',
		marginBottom: 4,
	},
	actionButton: {
		backgroundColor: colors.inputBg,
		borderRadius: 10,
		paddingVertical: 16,
		paddingHorizontal: 18,
		alignItems: 'center',
		minWidth: 90,
		...(Platform.OS === 'web' ? {
			boxShadow: `0 2px 6px rgba(0, 102, 204, 0.08)`,
		} : {
			shadowColor: colors.primary,
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.08,
			shadowRadius: 6,
			elevation: 2,
		}),
	},
	actionIcon: {
		fontSize: 24,
		marginBottom: 2,
	},
	actionText: {
		fontSize: 13,
		color: colors.primary,
		fontWeight: '600',
	},
	infoCard: {
		...components.card,
		width: '100%',
		maxWidth: 420,
		padding: 18,
	},
	infoTitle: {
		fontSize: 15,
		fontWeight: '700',
		color: colors.text,
		marginBottom: 6,
	},
	infoText: {
		fontSize: 13,
		color: colors.subtleText,
		textAlign: 'center',
		lineHeight: 20,
	},
	bottomTabContainer: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		height: 80,
		backgroundColor: colors.card,
		borderTopWidth: 1,
		borderTopColor: colors.border,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-around",
		paddingBottom: Platform.OS === 'ios' ? 20 : 10,
	},
	tabButton: {
		alignItems: "center",
		justifyContent: "center",
		flex: 1,
	},
	centerTabButton: {
		alignItems: "center",
		justifyContent: "center",
		flex: 1,
	},
	tabIcon: {
		width: 24,
		height: 24,
	},
	profileIcon: {
		width: 28,
		height: 28,
		borderRadius: 14,
	},
	activeTabIcon: {
		opacity: 1,
		tintColor: colors.primary,
	},
	inactiveTabIcon: {
		opacity: 0.6,
		tintColor: colors.primary,
	},
});
