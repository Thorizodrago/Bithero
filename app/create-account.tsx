import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail, sendEmailVerification } from 'firebase/auth';
import React, { useRef, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Dimensions,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View
} from "react-native";
import { checkUsernameAvailable, claimUsername } from '../src/db';
import { auth } from '../src/firebase';
import SoftBackground from "../src/ui/SoftBackground";
import { colors, components, layout } from "../src/ui/theme";

const { width, height } = Dimensions.get('window');

interface FormState {
	username: string;
	email: string;
	password: string;
	confirmPassword: string;
}

export default function CreateAccount() {
	const [form, setForm] = useState<FormState>({
		username: "",
		email: "",
		password: "",
		confirmPassword: "",
	});

	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const submittingRef = useRef(false);
	const router = useRouter();

	const checkEmailExists = async (email: string): Promise<boolean> => {
		try {
			const signInMethods = await fetchSignInMethodsForEmail(auth, email);
			return signInMethods.length > 0;
		} catch (error) { console.error("Error checking email:", error); return false; }
	};
	const handleChange = (key: keyof FormState, value: string) => {
		setForm({ ...form, [key]: value });
	};
	const validateEmail = (email: string): boolean => {
		const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return regex.test(email);
	};
	const handleSubmit = async (): Promise<void> => {
		if (submittingRef.current || isSubmitting) return; // prevent double-taps
		submittingRef.current = true;
		setIsSubmitting(true);
		const { username, email, password, confirmPassword } = form;
		if (!username.trim()) { Alert.alert("Error", "Nickname is required!"); submittingRef.current = false; setIsSubmitting(false); return; }
		if (!email.trim()) { Alert.alert("Error", "Email is required!"); submittingRef.current = false; setIsSubmitting(false); return; }
		if (!password.trim()) { Alert.alert("Error", "Password is required!"); submittingRef.current = false; setIsSubmitting(false); return; }
		if (!confirmPassword.trim()) { Alert.alert("Error", "Please confirm your password!"); submittingRef.current = false; setIsSubmitting(false); return; }
		if (!validateEmail(email.trim())) { Alert.alert("Invalid Email", "Please enter a valid email address."); submittingRef.current = false; setIsSubmitting(false); return; }
		if (password.length < 6) { Alert.alert("Weak Password", "Password must be at least 6 characters long."); submittingRef.current = false; setIsSubmitting(false); return; }
		if (password !== confirmPassword) { Alert.alert("Error", "Passwords do not match!"); submittingRef.current = false; setIsSubmitting(false); return; }
		try {
			const emailExists = await checkEmailExists(email.trim());
			if (emailExists) {
				Alert.alert("Email Already in Use", "This email is already registered. Please use a different email or try signing in.");
				submittingRef.current = false;
				setIsSubmitting(false);
				return;
			}
			const available = await checkUsernameAvailable(username.trim());
			if (!available) {
				Alert.alert("Nickname Taken", "This nickname is already in use. Please choose another.");
				submittingRef.current = false;
				setIsSubmitting(false);
				return;
			}
			const lastVerificationTime = await AsyncStorage.getItem(`lastEmailVerification_${email.trim()}`);
			if (lastVerificationTime) {
				const timeDiff = Date.now() - parseInt(lastVerificationTime);
				const cooldownTime = 1 * 60 * 1000; // 1 minute cooldown
				if (timeDiff < cooldownTime) {
					const remainingTime = Math.ceil((cooldownTime - timeDiff) / 1000);
					const minutes = Math.floor(remainingTime / 60);
					const seconds = remainingTime % 60;
					Alert.alert("Please Wait", `You can request another verification email in ${minutes}:${seconds.toString().padStart(2, '0')}`);
					submittingRef.current = false;
					setIsSubmitting(false);
					return;
				}
			}
			const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
			const user = userCredential.user;
			// Transactionally claim username to prevent duplicates
			try {
				await claimUsername(user.uid, username.trim());
			} catch (e: any) {
				// If username was taken between check and claim, clean up and ask for another
				try { await user.delete(); } catch { }
				Alert.alert("Nickname Taken", "This nickname was just taken. Please choose another.");
				submittingRef.current = false;
				setIsSubmitting(false);
				return;
			}
			await sendEmailVerification(user);
			await AsyncStorage.setItem(`lastEmailVerification_${email.trim()}`, Date.now().toString());
			router.push({ pathname: "/email-sent", params: { type: "email-verification", email: email.trim(), title: "Account Created Successfully!", message: "We've sent a verification email to your address. Please verify your email before signing in." } });
		} catch (error: any) {
			let errorMessage = "An error occurred while creating your account.";
			if (error.code === 'auth/email-already-in-use') { errorMessage = "This email is already registered. Please use a different email."; }
			else if (error.code === 'auth/weak-password') { errorMessage = "Password is too weak. Please use a stronger password."; }
			else if (error.code === 'auth/invalid-email') { errorMessage = "Invalid email address. Please enter a valid email."; }
			Alert.alert("Error", errorMessage);
			submittingRef.current = false;
			setIsSubmitting(false);
		} finally {
			submittingRef.current = false;
			setIsSubmitting(false);
		}
	};
	return (
		<View style={layout.gradientBg}>
			<SoftBackground />
			<View style={layout.centeredContainer}>
				<View style={components.card}>
					<Text style={components.title}>Create your account</Text>
					<View style={styles.progressOuter}>
						<View style={[styles.progressInner, { width: '33%' }]} />
					</View>
					<View style={styles.formContent}>
						<View style={styles.field}>
							<Text style={components.fieldLabel}>Nickname</Text>
							<TextInput
								style={[components.textField, styles.textField]}
								placeholder="Pick a unique nickname"
								placeholderTextColor={colors.subtleText}
								value={form.username}
								onChangeText={text => handleChange("username", text)}
							/>
						</View>
						<View style={styles.field}>
							<Text style={components.fieldLabel}>Email</Text>
							<TextInput
								style={[components.textField, styles.textField]}
								placeholder="you@example.com"
								placeholderTextColor={colors.subtleText}
								keyboardType="email-address"
								autoCapitalize="none"
								value={form.email}
								onChangeText={text => handleChange("email", text)}
							/>
						</View>
						<View style={styles.field}>
							<Text style={components.fieldLabel}>Password</Text>
							<TextInput
								style={[components.textField, styles.textField]}
								placeholder="••••••••"
								placeholderTextColor={colors.subtleText}
								secureTextEntry
								value={form.password}
								onChangeText={text => handleChange("password", text)}
							/>
						</View>
						<View style={styles.field}>
							<Text style={components.fieldLabel}>Confirm Password</Text>
							<TextInput
								style={[components.textField, styles.textField]}
								placeholder="••••••••"
								placeholderTextColor={colors.subtleText}
								secureTextEntry
								value={form.confirmPassword}
								onChangeText={text => handleChange("confirmPassword", text)}
							/>
						</View>
						<TouchableOpacity style={[components.cta, isSubmitting && components.disabledButton]} onPress={handleSubmit} disabled={isSubmitting}>
							{isSubmitting ? (
								<ActivityIndicator color="#fff" />
							) : (
								<Text style={components.ctaText}>Continue</Text>
							)}
						</TouchableOpacity>
						<TouchableOpacity onPress={() => router.back()}>
							<Text style={styles.backLink}>← Back to Login</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	progressOuter: {
		height: 8,
		backgroundColor: colors.border,
		borderRadius: 999,
		width: '100%',
		marginBottom: 24,
		marginTop: 8,
	},
	progressInner: {
		height: 8,
		backgroundColor: colors.secondary,
		borderRadius: 999,
	},
	formContent: {
		width: '100%',
		gap: 20,
	},
	field: {
		gap: 8,
	},
	textField: {
		marginBottom: 0,
	},
	backLink: {
		color: colors.secondary,
		textAlign: 'center',
		marginTop: 20,
		fontWeight: '600',
		fontSize: 16,
	},
});
