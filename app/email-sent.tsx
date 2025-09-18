import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
	Alert,
	Dimensions,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from "react-native";
import SoftBackground from "../src/ui/SoftBackground";
import { colors } from "../src/ui/theme";

const { width, height } = Dimensions.get('window');

export default function EmailSent() {
	const router = useRouter();
	const params = useLocalSearchParams();

	const { type, email, title, message } = params;

	const getIconForType = () => {
		switch (type) {
			case 'password-reset':
				return '🔑';
			case 'email-verification':
				return '✉️';
			default:
				return '📧';
		}
	};

	const getSubtitleForType = () => {
		switch (type) {
			case 'password-reset':
				return "We've sent you a secure link to reset your password";
			case 'email-verification':
				return "Please verify your email address to complete registration";
			default:
				return "Please check your email";
		}
	};

	return React.createElement(View, { style: styles.container },
		React.createElement(SoftBackground, null),
		React.createElement(ScrollView, {
			contentContainerStyle: styles.scrollContainer,
			showsVerticalScrollIndicator: false
		},
			React.createElement(View, { style: styles.card },
				React.createElement(View, { style: styles.iconContainer },
					React.createElement(Text, { style: styles.icon }, getIconForType()),
					React.createElement(View, { style: styles.checkmarkContainer },
						React.createElement(Text, { style: styles.checkmark }, "✓")
					)
				),

				React.createElement(View, { style: styles.textContainer },
					React.createElement(Text, { style: styles.title }, title || "Email Sent!"),
					React.createElement(Text, { style: styles.subtitle }, getSubtitleForType()),
					React.createElement(Text, { style: styles.emailText }, email),
					React.createElement(Text, { style: styles.message },
						message || "Please check your email and follow the instructions provided."
					)
				),

				React.createElement(View, { style: styles.actionContainer },
					React.createElement(View, { style: styles.inboxNotice },
						React.createElement(Text, { style: styles.inboxNoticeText }, "📧 Check your inbox or spam folder")
					),

					React.createElement(TouchableOpacity, {
						style: styles.backButton,
						onPress: () => {
							if (type === 'email-verification') {
								router.push('/add-profile');
							} else {
								router.push("/");
							}
						}
					},
						React.createElement(Text, { style: styles.backButtonText }, type === 'email-verification' ? "→ Create Profile" : "← Back to Login")
					)
				),

				React.createElement(View, { style: styles.helpContainer },
					React.createElement(Text, { style: styles.helpTitle }, "Didn't receive the email?"),
					React.createElement(Text, { style: styles.helpText },
						"• Check your spam/junk folder\n• Make sure the email address is correct\n• Wait a few minutes and try again"
					),

					type === 'password-reset' && React.createElement(TouchableOpacity, {
						style: styles.resendButton,
						onPress: () => {
							Alert.alert(
								"Resend Email",
								"Please wait 2.5 minutes between requests to prevent spam.",
								[{ text: "OK" }]
							);
						}
					},
						React.createElement(Text, { style: styles.resendButtonText }, "Request New Reset Link")
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
	card: {
		width: "100%",
		maxWidth: 420,
		padding: 20,
		backgroundColor: colors.card,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 12,
		alignItems: "center",
		...(Platform.OS === 'web' ? {
			boxShadow: '0 6px 12px rgba(0, 0, 0, 0.06)',
		} : {
			shadowColor: "#000",
			shadowOpacity: 0.06,
			shadowRadius: 12,
			shadowOffset: { width: 0, height: 6 },
			elevation: 2,
		}),
	},
	iconContainer: {
		position: "relative",
		marginBottom: 32,
		alignItems: "center",
		justifyContent: "center",
	},
	icon: {
		fontSize: 64,
		marginBottom: 12,
	},
	checkmarkContainer: {
		display: 'none',
	},
	checkmark: {
		fontSize: 20,
	},
	textContainer: {
		alignItems: "center",
		marginBottom: 32,
	},
	title: {
		fontSize: 24,
		fontWeight: "700",
		color: "#111",
		marginBottom: 8,
		textAlign: "center",
	},
	subtitle: {
		fontSize: 14,
		color: "#666",
		textAlign: "center",
		marginBottom: 12,
		lineHeight: 20,
	},
	emailText: {
		fontSize: 14,
		color: "#111",
		fontWeight: "600",
		marginBottom: 12,
		textAlign: "center",
	},
	message: {
		fontSize: 13,
		color: "#666",
		textAlign: "center",
		lineHeight: 18,
	},
	actionContainer: {
		width: "100%",
		marginBottom: 32,
	},
	inboxNotice: {
		backgroundColor: colors.inputBg,
		borderRadius: 10,
		padding: 16,
		alignItems: "center",
		marginBottom: 12,
		borderWidth: 1,
		borderColor: colors.border,
	},
	inboxNoticeText: {
		color: colors.text,
		fontSize: 14,
		fontWeight: "600",
		textAlign: "center",
	},
	emailButton: {
		backgroundColor: colors.primary,
		paddingVertical: 14,
		paddingHorizontal: 18,
		borderRadius: 10,
		alignItems: "center",
		marginBottom: 12,
	},
	emailButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "700",
		marginBottom: 2,
	},
	emailButtonSubtext: {
		color: "#fff",
		fontSize: 12,
		opacity: 0.9,
	},
	backButton: {
		backgroundColor: "transparent",
		borderWidth: 1,
		borderColor: colors.border,
		paddingVertical: 12,
		borderRadius: 10,
		alignItems: "center",
	},
	backButtonText: {
		color: colors.text,
		fontSize: 14,
		fontWeight: "600",
	},
	helpContainer: {
		width: "100%",
		backgroundColor: colors.inputBg,
		borderRadius: 10,
		padding: 16,
		borderWidth: 1,
		borderColor: colors.border,
	},
	helpTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: colors.text,
		marginBottom: 10,
		textAlign: "center",
	},
	helpText: {
		fontSize: 13,
		color: colors.subtleText,
		lineHeight: 18,
		marginBottom: 12,
	},
	resendButton: {
		backgroundColor: "transparent",
		borderWidth: 1,
		borderColor: "#ddd",
		paddingVertical: 10,
		borderRadius: 10,
		alignItems: "center",
	},
	resendButtonText: {
		color: "#111",
		fontSize: 13,
		fontWeight: "600",
	},
});
