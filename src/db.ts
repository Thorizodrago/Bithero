import type { User as FirebaseAuthUser } from 'firebase/auth';
import { Timestamp, addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, runTransaction, setDoc, where } from 'firebase/firestore';
import { db } from './firebase';

export interface BitcoinUser {
	uid: string;
	username: string; // unique
	usernameLower?: string;
	bitcoinAddress?: string; // Keep for backward compatibility
	stacksAddress?: string;   // New Stacks address field
	email: string;
	profilePictureUrl?: string;
	realName?: string;
	createdAt: Timestamp;
	updatedAt: Timestamp;
	additionalBitcoinAddresses?: string[];
	additionalStacksAddresses?: string[]; // Additional Stacks addresses
	fiatCurrencyPreference?: string;
	notificationsEnabled?: boolean;
}

export interface TransferRecord {
	id?: string;
	fromUid: string;
	toUid: string;
	toUsername: string;
	toAddress: string;
	amountSats: number;
	note?: string;
	createdAt: Timestamp;
}

export interface PinnedContact {
	uid: string;      // owner uid
	contactUid: string;
	contactUsername: string;
	pinnedAt: Timestamp;
}

// Helpers
export async function createOrUpdateBitcoinUser(firebaseUser: FirebaseAuthUser, params: {
	username: string;
	bitcoinAddress?: string;
	stacksAddress?: string;
	profilePictureUrl?: string;
	realName?: string;
}) {
	const userRef = doc(db, 'users', firebaseUser.uid);
	const snap = await getDoc(userRef);
	const now = Timestamp.now();

	const data: Partial<BitcoinUser> = {
		uid: firebaseUser.uid,
		username: params.username,
		usernameLower: normalizeUsername(params.username),
		email: firebaseUser.email || '',
		createdAt: snap.exists() ? (snap.data().createdAt as Timestamp) : now,
		updatedAt: now,
	};

	// Only add fields that are not undefined to avoid Firestore errors
	if (params.bitcoinAddress !== undefined) {
		data.bitcoinAddress = params.bitcoinAddress;
	}
	if (params.stacksAddress !== undefined) {
		data.stacksAddress = params.stacksAddress;
	}
	if (params.profilePictureUrl !== undefined) {
		data.profilePictureUrl = params.profilePictureUrl;
	}
	if (params.realName !== undefined) {
		data.realName = params.realName;
	}

	await setDoc(userRef, data as BitcoinUser, { merge: true });
	return data as BitcoinUser;
}

export async function findUserByUsername(username: string) {
	const key = normalizeUsername(username);
	const mapRef = doc(db, 'usernames', key);
	const mapSnap = await getDoc(mapRef);
	if (!mapSnap.exists()) return null;
	const { uid } = mapSnap.data() as { uid: string };
	return await getUserByUid(uid);
}

export async function findUserByBitcoinAddress(address: string) {
	const usersRef = collection(db, 'users');
	const q = query(usersRef, where('bitcoinAddress', '==', address));
	const qs = await getDocs(q);
	if (qs.empty) return null;
	const d = qs.docs[0];
	return { id: d.id, ...(d.data() as BitcoinUser) };
}

export async function logTransfer(record: Omit<TransferRecord, 'createdAt'>) {
	const col = collection(db, 'transfers');
	const docRef = await addDoc(col, { ...record, createdAt: Timestamp.now() });
	return docRef.id;
}

export async function getRecentTransfers(uid: string, max = 10) {
	const colRef = collection(db, 'transfers');
	const q = query(colRef, where('fromUid', '==', uid), orderBy('createdAt', 'desc'), limit(max));
	const qs = await getDocs(q);
	return qs.docs.map(d => ({ id: d.id, ...(d.data() as TransferRecord) }));
}

export async function pinContact(uid: string, contactUid: string, contactUsername: string) {
	const ref = doc(db, 'pinnedContacts', `${uid}_${contactUid}`);
	await setDoc(ref, { uid, contactUid, contactUsername, pinnedAt: Timestamp.now() } satisfies PinnedContact);
}

export async function unpinContact(uid: string, contactUid: string) {
	const ref = doc(db, 'pinnedContacts', `${uid}_${contactUid}`);
	await deleteDoc(ref);
}

export async function getPinnedContacts(uid: string, max = 20) {
	const colRef = collection(db, 'pinnedContacts');
	const q = query(colRef, where('uid', '==', uid), orderBy('pinnedAt', 'desc'), limit(max));
	const qs = await getDocs(q);
	return qs.docs.map(d => d.data() as PinnedContact);
}

export async function checkUsernameAvailable(username: string, currentUid?: string) {
	const key = normalizeUsername(username);
	const ref = doc(db, 'usernames', key);
	const snap = await getDoc(ref);
	if (!snap.exists()) return true;
	const data = snap.data() as { uid: string };
	return data.uid === currentUid;
}

export async function checkEmailExists(email: string): Promise<boolean> {
	try {
		const usersRef = collection(db, 'users');
		const q = query(usersRef, where('email', '==', email.toLowerCase()));
		const querySnapshot = await getDocs(q);
		return !querySnapshot.empty;
	} catch (error) {
		console.error('Error checking email existence:', error);
		return false;
	}
}

export async function getUserByUid(uid: string) {
	const ref = doc(db, 'users', uid);
	const snap = await getDoc(ref);
	if (!snap.exists()) return null;
	return { id: snap.id, ...(snap.data() as BitcoinUser) };
}

export async function updateUserProfile(uid: string, data: { realName?: string; profilePictureUrl?: string; }) {
	const ref = doc(db, 'users', uid);
	const payload: Partial<BitcoinUser> = {
		...data,
		updatedAt: Timestamp.now(),
	} as Partial<BitcoinUser>;
	await setDoc(ref, payload, { merge: true });
}

export async function searchUsersByPrefix(prefix: string, max = 10) {
	// Firestore doesn't support contains; for prefix search, we need startAt/endAt with ordered field
	// Here we keep it simple: exact match via where; a more advanced search would require indexing or Algolia.
	const user = await findUserByUsername(prefix);
	return user ? [user] : [];
}

// Utilities for username normalization and claiming
export function normalizeUsername(name: string) {
	return (name || '').trim().replace(/^@+/, '').toLowerCase();
}

export async function claimUsername(uid: string, username: string) {
	const key = normalizeUsername(username);
	const usernamesRef = doc(db, 'usernames', key);
	const userRef = doc(db, 'users', uid);

	await runTransaction(db, async (tx) => {
		const mapSnap = await tx.get(usernamesRef);
		if (mapSnap.exists()) {
			const data = mapSnap.data() as { uid: string };
			if (data.uid !== uid) {
				throw new Error('username-taken');
			}
			// If already owned by same user, continue to sync profile fields
		}

		tx.set(usernamesRef, { uid, username, claimedAt: Timestamp.now() });
		tx.set(userRef, { username, usernameLower: key, updatedAt: Timestamp.now() } as Partial<BitcoinUser>, { merge: true });
	});
}

export async function releaseUsername(uid: string, username: string) {
	const key = normalizeUsername(username);
	const usernamesRef = doc(db, 'usernames', key);
	const snap = await getDoc(usernamesRef);
	if (snap.exists() && (snap.data() as { uid: string }).uid === uid) {
		await deleteDoc(usernamesRef);
	}
}

export async function deleteUser(uid: string) {
	// Get user data first to release username
	const userRef = doc(db, 'users', uid);
	const userSnap = await getDoc(userRef);

	if (userSnap.exists()) {
		const userData = userSnap.data() as BitcoinUser;

		// Release username if exists
		if (userData.username) {
			await releaseUsername(uid, userData.username);
		}

		// Delete user document
		await deleteDoc(userRef);

		// Clean up related data
		await cleanupUserData(uid);
	}
}

export async function cleanupUserData(uid: string) {
	try {
		// Delete pinned contacts
		const pinnedContactsRef = collection(db, 'pinnedContacts');
		const pinnedQuery = query(pinnedContactsRef, where('uid', '==', uid));
		const pinnedSnap = await getDocs(pinnedQuery);

		const deletePromises = pinnedSnap.docs.map(doc => deleteDoc(doc.ref));
		await Promise.all(deletePromises);

		// Note: We keep transfer records for audit purposes
		// They contain historical data that shouldn't be deleted

	} catch (error) {
		console.error('Error cleaning up user data:', error);
	}
}
