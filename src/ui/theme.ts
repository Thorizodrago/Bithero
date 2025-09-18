import { Platform } from 'react-native';

export const colors = {
	primary: '#0066CC',        // Blue primary
	primaryDark: '#0052A3',    // Darker blue
	secondary: '#00AA88',      // Teal accent
	background: '#1A1A1A',     // Non-dark black
	card: '#2A2A2A',          // Dark gray card
	cardLight: '#333333',      // Lighter card variant  
	border: '#444444',         // Medium gray border
	text: '#FFFFFF',          // White text
	textSecondary: '#CCCCCC',  // Light gray text
	subtleText: '#999999',     // Medium gray text
	inputBg: '#333333',        // Dark gray input background
	inputBorder: '#555555',    // Input border
	error: '#FF4444',          // Red error
	success: '#00CC66',        // Green success
	warning: '#FFAA00',        // Orange warning
	gradient: {
		start: '#1A1A1A',       // Non-dark black
		middle: '#1A1A1A',      // Same as start (no gradient)
		end: '#1A1A1A',         // Same as start (no gradient)
	},
};

export const layout = {
	gradientBg: {
		flex: 1,
		justifyContent: 'center' as const,
		alignItems: 'center' as const,
		backgroundColor: colors.background,
		// Removed gradient background - using solid color only
	},
	centeredContainer: {
		flex: 1,
		justifyContent: 'center' as const,
		alignItems: 'center' as const,
		width: '100%' as const,
	},
};

export const components = {
	card: {
		width: '100%' as const,
		maxWidth: 400,
		backgroundColor: colors.card,
		borderRadius: 20,
		padding: 32,
		borderWidth: 1,
		borderColor: colors.border,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.15,
		shadowRadius: 16,
		elevation: 8,
		alignItems: 'center' as const,
		// Removed gradient background - using solid color only
	},
	title: {
		fontSize: 26,
		fontWeight: '700' as const,
		color: colors.text,
		marginBottom: 12,
		textAlign: 'center' as const,
		letterSpacing: -0.5,
	},
	cta: {
		backgroundColor: colors.primary,
		paddingVertical: 16,
		paddingHorizontal: 24,
		borderRadius: 14,
		alignItems: 'center' as const,
		alignSelf: 'stretch' as const,
		marginTop: 12,
		shadowColor: colors.primary,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 8,
		elevation: 4,
		// Removed gradient background - using solid color only
	},
	ctaText: {
		color: '#FFFFFF',
		fontWeight: '700' as const,
		fontSize: 16,
		letterSpacing: 0.5,
	},
	disabledButton: {
		opacity: 0.4,
	},
	fieldLabel: {
		color: colors.textSecondary,
		fontSize: 14,
		fontWeight: '600' as const,
		marginBottom: 6,
	},
	textField: {
		borderColor: colors.inputBorder,
		borderWidth: 1,
		borderRadius: 12,
		padding: 16,
		color: colors.text,
		backgroundColor: colors.inputBg,
		fontSize: 16,
		...(Platform.OS === 'web' ? {
			transition: 'all 0.2s ease',
		} : {}),
	},
	textFieldFocused: {
		borderColor: colors.primary,
		...(Platform.OS === 'web' ? {
			boxShadow: `0 0 0 3px rgba(139, 92, 246, 0.1)`,
		} : {}),
	},
};
