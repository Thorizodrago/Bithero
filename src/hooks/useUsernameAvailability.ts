import { useEffect, useState } from 'react';
import { checkUsernameAvailable, normalizeUsername } from '../db';

export function useUsernameAvailability(username: string) {
	const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
	const [isChecking, setIsChecking] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const checkUsername = async () => {
			const normalizedUsername = normalizeUsername(username);

			// Reset states
			setError(null);

			// Don't check empty usernames
			if (!normalizedUsername || normalizedUsername.length < 2) {
				setIsAvailable(null);
				setIsChecking(false);
				return;
			}

			// Validate username format
			if (!/^[a-zA-Z0-9_-]+$/.test(normalizedUsername)) {
				setError("Username can only contain letters, numbers, underscores, and hyphens");
				setIsAvailable(false);
				setIsChecking(false);
				return;
			}

			if (normalizedUsername.length > 20) {
				setError("Username must be 20 characters or less");
				setIsAvailable(false);
				setIsChecking(false);
				return;
			}

			setIsChecking(true);

			try {
				const available = await checkUsernameAvailable(normalizedUsername);
				setIsAvailable(available);
				setError(null);
			} catch (err) {
				console.error('Error checking username availability:', err);
				setError("Failed to check username availability");
				setIsAvailable(null);
			} finally {
				setIsChecking(false);
			}
		};

		// Debounce username checking
		const timeoutId = setTimeout(checkUsername, 500);
		return () => clearTimeout(timeoutId);
	}, [username]);

	return { isAvailable, isChecking, error };
}

export function validateUsername(username: string) {
	const normalizedUsername = normalizeUsername(username);

	if (!normalizedUsername) {
		return "Username is required";
	}

	if (normalizedUsername.length < 2) {
		return "Username must be at least 2 characters";
	}

	if (normalizedUsername.length > 20) {
		return "Username must be 20 characters or less";
	}

	if (!/^[a-zA-Z0-9_-]+$/.test(normalizedUsername)) {
		return "Username can only contain letters, numbers, underscores, and hyphens";
	}

	// Reserved usernames
	const reserved = ['admin', 'support', 'help', 'api', 'www', 'mail', 'email', 'root', 'user', 'test'];
	if (reserved.includes(normalizedUsername)) {
		return "This username is reserved";
	}

	return null;
}
