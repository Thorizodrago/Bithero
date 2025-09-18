import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { updateUserProfile } from '../src/db';
import { auth } from '../src/firebase';
import { colors, components } from "../src/ui/theme";

export default function AddProfile() {
	const router = useRouter();
	const params = useLocalSearchParams();
	const [realName, setRealName] = useState("");
	const [avatarUrl, setAvatarUrl] = useState("");

	const handleFinish = async () => {
		const user = auth.currentUser;
		if (!user) {
			Alert.alert('Not signed in', 'Please log in first.');
			router.replace('/');
			return;
		}
		await updateUserProfile(user.uid, { realName, profilePictureUrl: avatarUrl || undefined });
		await AsyncStorage.removeItem('pendingUsername');
		router.replace('/main');
	};

	return (
		<View style={styles.gradientBg}>
			<View style={styles.centeredContainer}>
				<View style={styles.card}>
					<Text style={styles.title}>Create your profile</Text>
					<View style={styles.progressOuter}><View style={[styles.progressInner, { width: '100%' }]} /></View>
					<View style={styles.formContent}>
						<View style={styles.field}>
							<Text style={styles.fieldLabel}>Real Name (optional)</Text>
							<TextInput style={styles.textField} placeholder="Satoshi Nakamoto" placeholderTextColor="#999" value={realName} onChangeText={setRealName} />
						</View>
						<View style={styles.field}>
							<Text style={styles.fieldLabel}>Profile Picture URL (optional)</Text>
							<TextInput style={styles.textField} placeholder="https://..." placeholderTextColor="#999" value={avatarUrl} onChangeText={setAvatarUrl} />
						</View>
						{!!avatarUrl && (
							<Image source={{ uri: avatarUrl }} style={styles.preview} />
						)}
						<TouchableOpacity style={styles.cta} onPress={handleFinish}>
							<Text style={styles.ctaText}>Finish and go to Home</Text>
						</TouchableOpacity>
						<TouchableOpacity onPress={() => router.back()}>
							<Text style={styles.backLink}>← Back</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</View>
	);
}

import { Platform } from "react-native";
const styles = StyleSheet.create({
	gradientBg: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#f7f8fa',
		...(Platform.OS === 'web' ? { background: 'linear-gradient(135deg, #e0e7ff 0%, #fff 100%)' } : {}),
	},
	centeredContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		width: '100%',
	},
	card: {
		...components.card,
		width: '100%',
		maxWidth: 370,
		padding: 28,
	},
	title: {
		fontSize: 22,
		fontWeight: '700',
		color: colors.text,
		marginBottom: 10,
		textAlign: 'center',
	},
	progressOuter: {
		height: 6,
		backgroundColor: '#eee',
		borderRadius: 999,
		width: '100%',
		marginBottom: 18,
	},
	progressInner: {
		height: 6,
		backgroundColor: colors.primary,
		borderRadius: 999,
	},
	formContent: {
		width: '100%',
		gap: 12,
	},
	field: {
		gap: 6,
	},
	fieldLabel: {
		...components.fieldLabel,
	},
	textField: {
		...components.textField,
	},
	cta: {
		...components.cta,
		marginTop: 8,
	},
	ctaText: {
		...components.ctaText,
	},
	backLink: {
		color: colors.primary,
		textAlign: 'center',
		marginTop: 16,
		fontWeight: '600',
	},
	preview: {
		width: 120,
		height: 120,
		borderRadius: 60,
		alignSelf: 'center',
		marginTop: 8
	}
});
