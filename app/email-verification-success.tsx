import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from "react-native";
import SoftBackground from "../src/ui/SoftBackground";
import { colors } from "../src/ui/theme";

export default function EmailVerificationSuccess() {
	const router = useRouter();

	useEffect(() => {
		// Auto redirect after 3 seconds
		const timer = setTimeout(() => {
			router.replace("/connect-wallet");
		}, 3000);

		return () => clearTimeout(timer);
	}, []);

	return React.createElement(View, { style: styles.container },
		React.createElement(SoftBackground, null),
		React.createElement(ScrollView, {
			contentContainerStyle: styles.scrollContainer,
			showsVerticalScrollIndicator: false
		},
			React.createElement(View, { style: styles.card },
				React.createElement(View, { style: styles.iconContainer },
					React.createElement(Text, { style: styles.icon }, "✅"),
				),

				React.createElement(View, { style: styles.textContainer },
					React.createElement(Text, { style: styles.title }, "Email Verified!"),
					React.createElement(Text, { style: styles.subtitle }, "Your email has been successfully verified."),
					React.createElement(Text, { style: styles.message },
						"You can now sign in to your Bithero account."
					)
				),

				React.createElement(View, { style: styles.actionContainer },
					React.createElement(TouchableOpacity, {
						style: styles.loginButton,
						onPress: () => router.replace("/connect-wallet")
					},
						React.createElement(Text, { style: styles.loginButtonText }, "Connect Wallet")
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
		marginBottom: 32,
		alignItems: "center",
		justifyContent: "center",
	},
	icon: {
		fontSize: 64,
		marginBottom: 12,
	},
	textContainer: {
		alignItems: "center",
		marginBottom: 32,
	},
	title: {
		fontSize: 24,
		fontWeight: "700",
		color: colors.text,
		marginBottom: 8,
		textAlign: "center",
	},
	subtitle: {
		fontSize: 16,
		color: colors.textSecondary,
		textAlign: "center",
		marginBottom: 12,
		lineHeight: 22,
	},
	message: {
		fontSize: 14,
		color: colors.subtleText,
		textAlign: "center",
		lineHeight: 18,
	},
	actionContainer: {
		width: "100%",
	},
	loginButton: {
		backgroundColor: colors.primary,
		paddingVertical: 14,
		paddingHorizontal: 18,
		borderRadius: 10,
		alignItems: "center",
	},
	loginButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "700",
	},
});
