import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import { sendPasswordResetEmail } from 'firebase/auth';
import React, { useState } from "react";
import {
	Alert,
	Dimensions,
	Platform,
	ScrollView,
	StatusBar,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View
} from "react-native";
import { auth } from '../src/firebase';
import SoftBackground from "../src/ui/SoftBackground";
import { colors, components } from "../src/ui/theme";

const { width, height } = Dimensions.get('window');

export default function ForgotPassword() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [emailFocused, setEmailFocused] = useState(false);

	const validateEmail = (email: string) => {
		const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return regex.test(email);
	};

	const handleResetPassword = async () => {
		if (!email.trim()) {
			Alert.alert("Email Required", "Please enter your email address.");
			return;
		}

		if (!validateEmail(email.trim())) {
			Alert.alert("Invalid Email", "Please enter a valid email address.");
			return;
		}

		// Check rate limiting
		try {
			const lastResetTime = await AsyncStorage.getItem(`lastPasswordReset_${email.trim()}`);
			if (lastResetTime) {
				const timeDiff = Date.now() - parseInt(lastResetTime);
				const cooldownTime = 2.5 * 60 * 1000; // 2.5 minutes in milliseconds

				if (timeDiff < cooldownTime) {
					const remainingTime = Math.ceil((cooldownTime - timeDiff) / 1000);
					const minutes = Math.floor(remainingTime / 60);
					const seconds = remainingTime % 60;
					Alert.alert(
						"Please Wait",
						`You can request another password reset in ${minutes}:${seconds.toString().padStart(2, '0')}`
					);
					return;
				}
			}
		} catch (error) {
			console.error('Error checking rate limit:', error);
		}

		setIsLoading(true);

		try {
			// Send password reset email with action code settings
			const actionCodeSettings = {
				url: `${window.location.origin}/password-reset-success`,
				handleCodeInApp: false,
			};

			try {
				await sendPasswordResetEmail(auth, email.trim(), actionCodeSettings);
			} catch (resetError) {
				console.warn('Password reset with action code failed, trying default:', resetError);
				// Fallback to default reset
				await sendPasswordResetEmail(auth, email.trim());
			}

			// Store the timestamp for rate limiting
			await AsyncStorage.setItem(`lastPasswordReset_${email.trim()}`, Date.now().toString());

			// Navigate to email sent confirmation page
			router.push({
				pathname: "/email-sent",
				params: {
					type: "password-reset",
					email: email.trim(),
					title: "Password Reset Email Sent",
					message: "We've sent a password reset link to your email address. Please check your email and follow the instructions."
				}
			});

		} catch (error: any) {
			console.error("Password reset error:", error);

			let errorMessage = "Failed to send password reset email. Please try again.";

			// Firebase specific error handling
			switch (error.code) {
				case 'auth/user-not-found':
					errorMessage = "No account found with this email address.";
					break;
				case 'auth/invalid-email':
					errorMessage = "Invalid email address.";
					break;
				case 'auth/too-many-requests':
					errorMessage = "Too many reset attempts. Please try again later.";
					break;
				case 'auth/network-request-failed':
					errorMessage = "Network error. Please check your connection.";
					break;
				default:
					errorMessage = "Failed to send reset email. Please try again.";
			}

			Alert.alert("Reset Failed", errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	return React.createElement(View, { style: styles.container },
		React.createElement(StatusBar, {
			barStyle: "dark-content",
			backgroundColor: colors.background,
			translucent: Platform.OS === 'android'
		}),
		React.createElement(SoftBackground, null),
		React.createElement(ScrollView, {
			contentContainerStyle: styles.scrollContainer,
			keyboardShouldPersistTaps: "handled",
			showsVerticalScrollIndicator: false
		},
			React.createElement(View, { style: styles.headerContainer },
				React.createElement(Text, { style: styles.headerTitle }, "Reset Password"),
				React.createElement(Text, { style: styles.headerSubtitle },
					"Enter your email address and we'll send you a link to reset your password."
				)
			),

			React.createElement(View, { style: styles.card },
				React.createElement(View, { style: styles.inputContainer },
					React.createElement(TextInput, {
						style: [
							styles.input,
							emailFocused && styles.inputFocused
						],
						placeholder: "Enter your email address",
						placeholderTextColor: "#999",
						keyboardType: "email-address",
						autoCapitalize: "none",
						value: email,
						onChangeText: setEmail,
						onFocus: () => setEmailFocused(true),
						onBlur: () => setEmailFocused(false)
					})
				),

				React.createElement(TouchableOpacity, {
					style: [styles.resetButton, isLoading && styles.disabledButton],
					onPress: handleResetPassword,
					disabled: isLoading
				},
					React.createElement(Text, { style: styles.buttonText },
						isLoading ? "Sending..." : "Send Reset Link"
					)
				),

				React.createElement(View, { style: styles.backContainer },
					React.createElement(TouchableOpacity, { onPress: () => router.push("/") },
						React.createElement(Text, { style: styles.backLink }, "← Back to Login")
					)
				)
			)
		)
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
	},
	scrollContainer: {
		flexGrow: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingVertical: 40,
		paddingHorizontal: 20,
	},
	headerContainer: {
		alignItems: "center",
		marginBottom: 40,
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: "700",
		color: colors.text,
		marginBottom: 8,
		textAlign: "center",
	},
	headerSubtitle: {
		fontSize: 14,
		color: colors.subtleText,
		textAlign: "center",
		marginBottom: 16,
		lineHeight: 20,
		paddingHorizontal: 20,
	},
	card: {
		...components.card,
		width: "100%",
		maxWidth: 420,
		padding: 24,
	},
	inputContainer: {
		marginBottom: 24,
	},
	input: {
		width: "100%",
		height: 48,
		borderWidth: 1,
		borderColor: colors.inputBorder,
		borderRadius: 10,
		paddingHorizontal: 12,
		fontSize: 16,
		backgroundColor: colors.inputBg,
		color: colors.text,
	},
	inputFocused: {
		borderColor: colors.primary,
		borderWidth: 2,
	},
	resetButton: {
		...components.cta,
		marginBottom: 16,
	},
	disabledButton: {
		...components.disabledButton,
	},
	buttonText: {
		...components.ctaText,
		letterSpacing: 0.2,
	},
	backContainer: {
		alignItems: "center",
	},
	backLink: {
		fontSize: 14,
		color: colors.text,
		fontWeight: "600",
	},
});
