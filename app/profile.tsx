import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from "expo-router";
import { onAuthStateChanged, signOut, updateProfile } from 'firebase/auth';
import React, { useEffect, useState } from "react";
import {
	Alert,
	Dimensions,
	Image,
	Platform,
	ScrollView,
	StatusBar,
	StyleSheet,
	Switch,
	Text,
	TextInput,
	TouchableOpacity,
	View
} from "react-native";
import { auth } from '../src/firebase';
import { colors } from "../src/ui/theme";

const { width, height } = Dimensions.get('window');

export default function Profile() {
	const router = useRouter();
	const [user, setUser] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [birthDate, setBirthDate] = useState("");
	const [gender, setGender] = useState("male");
	const [isDarkTheme, setIsDarkTheme] = useState(true);
	const [profileImage, setProfileImage] = useState<string | null>(null);
	const [isEditing, setIsEditing] = useState(false);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			if (user && user.emailVerified) {
				setUser(user);
				// Load profile data
				if (user.displayName) {
					const nameParts = user.displayName.split(' ');
					setFirstName(nameParts[0] || "");
					setLastName(nameParts[1] || "");
				}
				if (user.photoURL) {
					setProfileImage(user.photoURL);
				}
				loadProfileData();
			} else {
				router.replace("/");
			}
			setLoading(false);
		});

		return () => unsubscribe();
	}, []);

	const loadProfileData = async () => {
		try {
			const savedBirthDate = await AsyncStorage.getItem('userBirthDate');
			const savedGender = await AsyncStorage.getItem('userGender');
			const savedTheme = await AsyncStorage.getItem('isDarkTheme');

			if (savedBirthDate) setBirthDate(savedBirthDate);
			if (savedGender) setGender(savedGender);
			if (savedTheme) setIsDarkTheme(savedTheme === 'true');
		} catch (error) {
			console.error('Error loading profile data:', error);
		}
	};

	const saveProfileData = async () => {
		try {
			await AsyncStorage.setItem('userBirthDate', birthDate);
			await AsyncStorage.setItem('userGender', gender);
			await AsyncStorage.setItem('isDarkTheme', isDarkTheme.toString());

			// Update Firebase profile
			if (user) {
				const displayName = `${firstName} ${lastName}`.trim();
				await updateProfile(user, {
					displayName: displayName || undefined,
					photoURL: profileImage || undefined
				});
			}

			Alert.alert("Success", "Profile updated successfully!");
			setIsEditing(false);
		} catch (error) {
			console.error('Error saving profile data:', error);
			Alert.alert("Error", "Failed to update profile. Please try again.");
		}
	};

	const pickImage = async () => {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.5,
		});

		if (!result.canceled) {
			setProfileImage(result.assets[0].uri);
		}
	};

	const handleSignOut = async () => {
		try {
			await signOut(auth);
			await AsyncStorage.removeItem('rememberedEmail');
			await AsyncStorage.removeItem('rememberedPassword');
			await AsyncStorage.removeItem('rememberMe');
			router.replace("/");
		} catch (error) {
			console.error('Sign out error:', error);
			Alert.alert("Error", "Failed to sign out. Please try again.");
		}
	};

	const confirmSignOut = () => {
		Alert.alert(
			"Sign Out",
			"Are you sure you want to sign out?",
			[
				{ text: "Cancel", style: "cancel" },
				{ text: "Sign Out", style: "destructive", onPress: handleSignOut }
			]
		);
	};

	if (loading) {
		return React.createElement(View, { style: styles.loadingContainer },
			React.createElement(Text, { style: styles.loadingText }, "Loading...")
		);
	}

	if (!user) {
		return null;
	}

	return React.createElement(View, { style: styles.container },
		React.createElement(StatusBar, {
			barStyle: "light-content",
			backgroundColor: colors.background,
			translucent: Platform.OS === 'android'
		}),

		// Header
		React.createElement(View, { style: styles.header },
			React.createElement(TouchableOpacity, {
				style: styles.backButton,
				onPress: () => router.back()
			},
				React.createElement(Text, { style: styles.backButtonText }, "← Back")
			),
			React.createElement(Text, { style: styles.headerTitle }, "Profile"),
			React.createElement(TouchableOpacity, {
				style: styles.editButton,
				onPress: () => setIsEditing(!isEditing)
			},
				React.createElement(Text, { style: styles.editButtonText }, isEditing ? "Cancel" : "Edit")
			)
		),

		React.createElement(ScrollView, {
			contentContainerStyle: styles.scrollContainer,
			showsVerticalScrollIndicator: false
		},
			// Profile Image Section
			React.createElement(View, { style: styles.profileImageSection },
				React.createElement(TouchableOpacity, {
					style: styles.profileImageContainer,
					onPress: isEditing ? pickImage : undefined,
					disabled: !isEditing
				},
					React.createElement(Image, {
						source: profileImage
							? { uri: profileImage }
							: require("../assets/images/default-profile-picture-male-icon.png"),
						style: styles.profileImage
					}),
					isEditing && React.createElement(View, { style: styles.imageEditOverlay },
						React.createElement(Text, { style: styles.imageEditText }, "📷")
					)
				),
				React.createElement(Text, { style: styles.emailText }, user.email)
			),

			// Personal Information
			React.createElement(Text, { style: styles.sectionTitle }, "Personal Information"),

			React.createElement(View, { style: styles.inputGroup },
				React.createElement(Text, { style: styles.inputLabel }, "First Name"),
				React.createElement(TextInput, {
					style: [styles.input, !isEditing && styles.inputDisabled],
					value: firstName,
					onChangeText: setFirstName,
					editable: isEditing,
					placeholder: "Enter first name",
					placeholderTextColor: "rgba(255, 255, 255, 0.5)"
				})
			),

			React.createElement(View, { style: styles.inputGroup },
				React.createElement(Text, { style: styles.inputLabel }, "Last Name"),
				React.createElement(TextInput, {
					style: [styles.input, !isEditing && styles.inputDisabled],
					value: lastName,
					onChangeText: setLastName,
					editable: isEditing,
					placeholder: "Enter last name",
					placeholderTextColor: "rgba(255, 255, 255, 0.5)"
				})
			),

			React.createElement(View, { style: styles.inputGroup },
				React.createElement(Text, { style: styles.inputLabel }, "Birth Date"),
				React.createElement(TextInput, {
					style: [styles.input, !isEditing && styles.inputDisabled],
					value: birthDate,
					onChangeText: setBirthDate,
					editable: isEditing,
					placeholder: "DD/MM/YYYY",
					placeholderTextColor: "rgba(255, 255, 255, 0.5)"
				})
			),

			React.createElement(View, { style: styles.inputGroup },
				React.createElement(Text, { style: styles.inputLabel }, "Gender"),
				React.createElement(View, { style: styles.genderContainer },
					React.createElement(TouchableOpacity, {
						onPress: () => isEditing && setGender('male'),
						disabled: !isEditing
					},
						React.createElement(Text, {
							style: [styles.genderText, gender === 'male' && styles.genderTextActive]
						}, "Male")
					),
					React.createElement(TouchableOpacity, {
						onPress: () => isEditing && setGender('female'),
						disabled: !isEditing
					},
						React.createElement(Text, {
							style: [styles.genderText, gender === 'female' && styles.genderTextActive]
						}, "Female")
					)
				)
			),

			// Preferences
			React.createElement(Text, { style: styles.sectionTitle }, "Preferences"),

			React.createElement(View, { style: styles.switchContainer },
				React.createElement(Text, { style: styles.switchLabel }, "Dark Theme"),
				React.createElement(Switch, {
					value: isDarkTheme,
					onValueChange: setIsDarkTheme,
					trackColor: { false: "#767577", true: "#00D4AA" },
					thumbColor: isDarkTheme ? "#fff" : "#f4f3f4"
				})
			),

			// Account Actions
			React.createElement(Text, { style: styles.sectionTitle }, "Account"),

			React.createElement(View, { style: styles.accountStats },
				React.createElement(View, { style: styles.statItem },
					React.createElement(Text, { style: styles.statLabel }, "Member Since"),
					React.createElement(Text, { style: styles.statValue },
						new Date(user.metadata?.creationTime || Date.now()).toLocaleDateString()
					)
				),
				React.createElement(View, { style: styles.statItem },
					React.createElement(Text, { style: styles.statLabel }, "Email Verified"),
					React.createElement(Text, { style: styles.statValue }, "✅ Yes")
				)
			),

			// Action Buttons
			React.createElement(View, { style: styles.actionButtons },
				isEditing && React.createElement(TouchableOpacity, {
					onPress: saveProfileData
				},
					React.createElement(Text, { style: styles.saveButtonText }, "Save Changes")
				),

				React.createElement(TouchableOpacity, {
					onPress: confirmSignOut
				},
					React.createElement(Text, { style: styles.signOutButtonText }, "Sign Out")
				)
			)
		),

		// Bottom Tab Navigation
		React.createElement(View, { style: styles.bottomTabContainer },
			// Home Tab
			React.createElement(TouchableOpacity, {
				style: styles.tabButton,
				onPress: () => router.push("/main")
			},
				React.createElement(Image, {
					source: require("../assets/images/home-icon.png"),
					style: [styles.tabIcon, styles.inactiveTabIcon]
				})
			),

			// Premium Tab
			React.createElement(TouchableOpacity, {
				style: styles.tabButton,
				onPress: () => Alert.alert("Premium", "Premium page coming soon!")
			},
				React.createElement(Image, {
					source: require("../assets/images/home-icon.png"),
					style: [styles.tabIcon, styles.inactiveTabIcon]
				})
			),


			// Tools Tab
			React.createElement(TouchableOpacity, {
				style: styles.tabButton,
				onPress: () => Alert.alert("Tools", "Tools page coming soon!")
			},
				React.createElement(Image, {
					source: require("../assets/images/home-icon.png"),
					style: [styles.tabIcon, styles.inactiveTabIcon]
				})
			),

			// Profile Tab (Current page - active)
			React.createElement(TouchableOpacity, {
				style: styles.tabButton,
				onPress: () => { } // Already on profile
			},
				React.createElement(Image, {
					source: require("../assets/images/home-icon.png"),
					style: [styles.profileIcon, styles.activeTabIcon]
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
		color: colors.text,
		fontSize: 18,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 20,
		paddingTop: Platform.OS === 'android' ? 50 : 60,
		paddingBottom: 20,
	},
	backButton: {
		padding: 8,
	},
	backButtonText: {
		color: colors.text,
		fontSize: 16,
		fontWeight: "600",
	},
	headerTitle: {
		fontSize: 20,
		fontWeight: "700",
		color: colors.text,
	},
	editButton: {
		backgroundColor: colors.primary,
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 10,
	},
	editButtonText: {
		color: "#fff",
		fontSize: 14,
		fontWeight: "600",
	},
	scrollContainer: {
		flexGrow: 1,
		paddingHorizontal: 20,
		paddingBottom: 100,
	},
	profileImageSection: {
		alignItems: "center",
		marginBottom: 30,
	},
	profileImageContainer: {
		position: "relative",
		marginBottom: 15,
	},
	profileImage: {
		width: 120,
		height: 120,
		borderRadius: 60,
		borderWidth: 3,
		borderColor: colors.primary,
	},
	imageEditOverlay: {
		position: "absolute",
		bottom: 0,
		right: 0,
		backgroundColor: colors.primary,
		borderRadius: 20,
		width: 40,
		height: 40,
		justifyContent: "center",
		alignItems: "center",
	},
	imageEditText: {
		fontSize: 18,
	},
	emailText: {
		fontSize: 16,
		color: colors.subtleText,
		textAlign: "center",
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: colors.text,
		marginBottom: 16,
		marginTop: 16,
	},
	inputGroup: {
		marginBottom: 20,
	},
	inputLabel: {
		fontSize: 14,
		color: colors.textSecondary,
		marginBottom: 8,
		fontWeight: "600",
	},
	input: {
		backgroundColor: colors.inputBg,
		borderRadius: 10,
		paddingHorizontal: 12,
		paddingVertical: 12,
		fontSize: 16,
		color: colors.text,
		borderWidth: 1,
		borderColor: colors.inputBorder,
	},
	inputDisabled: {
		backgroundColor: colors.card,
		borderColor: colors.border,
	},
	genderContainer: {
		flexDirection: "row",
		gap: 20,
	},
	genderText: {
		fontSize: 16,
		color: colors.subtleText,
		fontWeight: "500",
		paddingVertical: 8,
	},
	genderTextActive: {
		color: colors.text,
		fontWeight: "700",
	},
	switchContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 10,
		marginBottom: 20,
	},
	switchLabel: {
		fontSize: 16,
		color: colors.text,
		fontWeight: "600",
	},
	accountStats: {
		marginBottom: 30,
	},
	statItem: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	statLabel: {
		fontSize: 14,
		color: colors.subtleText,
	},
	statValue: {
		fontSize: 14,
		color: colors.text,
		fontWeight: "600",
	},
	actionButtons: {
		marginTop: 30,
		marginBottom: 20,
	},
	saveButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "700",
		textAlign: "center",
		paddingVertical: 12,
		backgroundColor: colors.primary,
		borderRadius: 10,
	},
	signOutButtonText: {
		color: colors.error,
		fontSize: 16,
		fontWeight: "600",
		textAlign: "center",
		paddingVertical: 12,
		marginTop: 10,
		borderWidth: 1,
		borderColor: 'rgba(239, 68, 68, 0.3)',
		borderRadius: 10,
		backgroundColor: 'rgba(239, 68, 68, 0.1)',
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
		tintColor: "#111",
	},
	inactiveTabIcon: {
		opacity: 0.6,
		tintColor: "#111",
	},
});
