//THIS CODE IS PLANNED FOR FUTURE WORK
import { useLocalSearchParams, useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from 'firebase/auth';
import React, { useEffect, useRef, useState } from "react";
import {
	Alert,
	BackHandler,
	Dimensions,
	Image,
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

export default function VerifyCode() {
	const GridBackground = () => {
		const gridLines: React.ReactElement[] = [];
		const gridSize = 30;
		const numLinesX = Math.ceil(width / gridSize) + 2;
		const numLinesY = Math.ceil(height / gridSize) + 2;

		for (let i = 0; i < numLinesX; i++) {
			gridLines.push(
				React.createElement(View, {
					key: `v-${i}`,
					style: [
						styles.gridLine,
						{
							left: i * gridSize,
							width: 1,
							height: '100%',
						},
					]
				})
			);
		}

		for (let i = 0; i < numLinesY; i++) {
			gridLines.push(
				React.createElement(View, {
					key: `h-${i}`,
					style: [
						styles.gridLine,
						{
							top: i * gridSize,
							height: 1,
							width: '100%',
						},
					]
				})
			);
		}

		return React.createElement(View, { style: styles.backgroundContainer }, gridLines);
	};

	const router = useRouter();
	const params = useLocalSearchParams();
	const { name, email, password, verificationCode } = params;

	const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
	const [currentIndex, setCurrentIndex] = useState<number>(0);
	const [isVerifying, setIsVerifying] = useState<boolean>(false);

	const inputRefs = useRef<TextInput[]>([]);

	// Focus first input on mount
	useEffect(() => {
		if (inputRefs.current[0]) {
			inputRefs.current[0].focus();
		}

		// Android back button handler
		const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
			router.back();
			return true;
		});

		return () => backHandler.remove();
	}, []);

	// Auto-verify when all fields are filled
	useEffect(() => {
		const fullCode = code.join('');
		if (fullCode.length === 6) {
			handleVerification(fullCode);
		}
	}, [code]);

	const handleCodeChange = (text: string, index: number) => {
		// Only allow digits - Android keyboard fix
		const digit = text.replace(/[^0-9]/g, '');

		if (digit.length > 1) {
			// If multiple digits pasted, distribute them
			const digits = digit.slice(0, 6).split('');
			const newCode = [...code];

			digits.forEach((d, i) => {
				if (index + i < 6) {
					newCode[index + i] = d;
				}
			});

			setCode(newCode);

			// Focus the last filled input + 1
			const nextIndex = Math.min(index + digits.length, 5);
			if (inputRefs.current[nextIndex]) {
				// Android delay for better UX
				setTimeout(() => {
					inputRefs.current[nextIndex]?.focus();
					setCurrentIndex(nextIndex);
				}, 50);
			}
		} else {
			// Single digit input
			const newCode = [...code];
			newCode[index] = digit;
			setCode(newCode);

			// Auto-focus next input with Android delay
			if (digit && index < 5) {
				setTimeout(() => {
					if (inputRefs.current[index + 1]) {
						inputRefs.current[index + 1].focus();
						setCurrentIndex(index + 1);
					}
				}, 50);
			}
		}
	}; const handleKeyPress = (e: any, index: number) => {
		if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
			// Focus previous input on backspace if current is empty
			if (inputRefs.current[index - 1]) {
				inputRefs.current[index - 1].focus();
				setCurrentIndex(index - 1);
			}
		}
	};

	const handleVerification = async (enteredCode: string) => {
		if (isVerifying) return;

		setIsVerifying(true);

		try {
			if (enteredCode === verificationCode) {
				// Create the account
				await createUserWithEmailAndPassword(auth, email as string, password as string);

				// Navigate to index with success message
				router.replace({
					pathname: "/",
					params: { showSuccess: "true" }
				});
			} else {
				Alert.alert("Invalid Code", "The verification code you entered is incorrect. Please try again.");
				// Clear the code
				setCode(["", "", "", "", "", ""]);
				setCurrentIndex(0);
				if (inputRefs.current[0]) {
					inputRefs.current[0].focus();
				}
			}
		} catch (error: any) {
			console.error("Account creation error:", error);
			Alert.alert("Error", error.message);
		} finally {
			setIsVerifying(false);
		}
	};

	const resendCode = () => {
		Alert.alert("Code Resent", "A new verification code has been sent to your email.");
		// Here you would call the resend email function
	};

	return React.createElement(View, { style: styles.container },
		React.createElement(SoftBackground, null),
		React.createElement(View, { style: styles.content },
			React.createElement(View, { style: styles.logoContainer },
				React.createElement(Image, {
					source: require("../assets/images/home-icon.png"),
					style: styles.logo
				})
			),

			React.createElement(View, { style: styles.card },
				React.createElement(View, { style: styles.headerContainer },
					React.createElement(Text, { style: styles.title }, "Verify Your Email"),
					React.createElement(Text, { style: styles.subtitle },
						`We sent a 6-digit code to\n${email}`
					)
				),

				React.createElement(View, { style: styles.codeContainer },
					...code.map((digit, index) =>
						React.createElement(TextInput, {
							key: index,
							ref: (ref) => {
								if (ref) inputRefs.current[index] = ref;
							},
							style: [
								styles.codeInput,
								currentIndex === index && styles.codeInputFocused,
								digit && styles.codeInputFilled
							],
							value: digit,
							onChangeText: (text) => handleCodeChange(text, index),
							onKeyPress: (e) => handleKeyPress(e, index),
							onFocus: () => setCurrentIndex(index),
							keyboardType: "numeric",
							maxLength: 1,
							selectTextOnFocus: true
						})
					)
				),

				React.createElement(View, { style: styles.actionContainer },
					React.createElement(TouchableOpacity, { style: styles.resendButton, onPress: resendCode },
						React.createElement(Text, { style: styles.resendText }, "Didn't receive the code? Resend")
					),

					React.createElement(TouchableOpacity, { style: styles.backButton, onPress: () => router.back() },
						React.createElement(Text, { style: styles.backText }, "← Back to Create Account")
					)
				)
			)
		)
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#ffffff",
	},
	backgroundContainer: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		overflow: 'hidden',
	},
	gridLine: {
		position: 'absolute',
		backgroundColor: 'transparent',
	},
	content: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 20,
	},
	logoContainer: {
		alignItems: "center",
		marginBottom: 30,
	},
	logo: {
		width: 120,
		height: 120,
	},
	card: {
		...components.card,
		width: "100%",
		maxWidth: 420,
		padding: 24,
	},
	headerContainer: {
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
		fontSize: 14,
		color: colors.subtleText,
		textAlign: "center",
		lineHeight: 20,
	},
	codeContainer: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 32,
		paddingHorizontal: 15,
	},
	codeInput: {
		width: 42,
		height: 56,
		borderWidth: 1,
		borderColor: colors.inputBorder,
		borderRadius: 10,
		textAlign: "center",
		fontSize: 22,
		fontWeight: "700",
		color: colors.text,
		backgroundColor: colors.inputBg,
		marginHorizontal: 4,
	},
	codeInputFocused: {
		borderColor: colors.primary,
		backgroundColor: colors.inputBg,
	},
	codeInputFilled: {
		borderColor: colors.primary,
		backgroundColor: colors.inputBg,
	},
	actionContainer: {
		alignItems: "center",
	},
	resendButton: {
		paddingVertical: 10,
		paddingHorizontal: 18,
		marginBottom: 20,
	},
	resendText: {
		fontSize: 14,
		color: colors.primary,
		fontWeight: "600",
	},
	backButton: {
		paddingVertical: 10,
	},
	backText: {
		fontSize: 14,
		color: "#111",
	},
});
