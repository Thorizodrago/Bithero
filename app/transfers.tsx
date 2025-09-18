import { onAuthStateChanged } from 'firebase/auth';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import {
	findUserByUsername,
	getPinnedContacts,
	getRecentTransfers,
	logTransfer,
	searchUsersByPrefix
} from '../src/db';
import { auth } from '../src/firebase';
import SoftBackground from "../src/ui/SoftBackground";
import { colors, components } from "../src/ui/theme";

export default function Transfers() {
	const [uid, setUid] = useState<string | null>(null);
	const [query, setQuery] = useState('');
	const [amount, setAmount] = useState('');
	const [note, setNote] = useState('');
	const [loading, setLoading] = useState(false);
	const [results, setResults] = useState<Array<{ id: string; username: string; bitcoinAddress: string; uid: string }>>([]);
	const [recent, setRecent] = useState<any[]>([]);
	const [pinned, setPinned] = useState<any[]>([]);

	useEffect(() => {
		const unsub = onAuthStateChanged(auth, async (user) => {
			if (!user) return;
			setUid(user.uid);
			// Load initial data
			const [txs, pins] = await Promise.all([
				getRecentTransfers(user.uid, 10),
				getPinnedContacts(user.uid, 20),
			]);
			setRecent(txs);
			setPinned(pins);
		});
		return () => unsub();
	}, []);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			if (!query) { setResults([]); return; }
			const res = await searchUsersByPrefix(query.trim());
			if (!cancelled) {
				setResults(res.map(r => ({
					id: r.id!,
					username: r.username,
					bitcoinAddress: r.bitcoinAddress || r.stacksAddress || '',
					uid: r.uid
				})));
			}
		})();
		return () => { cancelled = true; };
	}, [query]);

	const canSend = useMemo(() => {
		const a = parseInt(amount, 10);
		return uid && results.length === 1 && Number.isFinite(a) && a > 0;
	}, [uid, results, amount]);

	async function handleSend() {
		if (!uid) return;
		const target = results[0];
		const a = parseInt(amount, 10);
		if (!target || !Number.isFinite(a) || a <= 0) return;
		setLoading(true);
		try {
			// Confirm target up-to-date
			const fresh = await findUserByUsername(target.username);
			if (!fresh) throw new Error('User not found');
			await logTransfer({
				fromUid: uid,
				toUid: fresh.uid,
				toUsername: fresh.username,
				toAddress: fresh.bitcoinAddress || fresh.stacksAddress || '',
				amountSats: a,
				note: note || undefined,
			});
			Alert.alert('Sent', `Sent ${a} sats to @${fresh.username}`);
			setAmount('');
			setNote('');
			setQuery('');
			const txs = await getRecentTransfers(uid, 10);
			setRecent(txs);
		} catch (e: any) {
			Alert.alert('Error', e.message || 'Failed to send');
		} finally {
			setLoading(false);
		}
	}

	function renderUserItem(item: { id: string; username: string }) {
		return (
			<View style={styles.resultItem}>
				<Text style={styles.resultUsername}>@{item.username}</Text>
			</View>
		);
	}

	return (
		<KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
			<SoftBackground />
			<View style={styles.header}>
				<Text style={styles.title}>Send by Username</Text>
				<Text style={styles.subtitle}>Type a username, enter sats, and send. Pinned and recent appear below.</Text>
			</View>

			<View style={styles.card}>
				<Text style={styles.label}>Username</Text>
				<TextInput
					style={styles.input}
					placeholder="e.g. satoshi"
					value={query}
					autoCapitalize="none"
					onChangeText={setQuery}
				/>
				{results.length > 0 && (
					<View style={styles.resultsBox}>
						<FlatList
							data={results}
							keyExtractor={(i) => i.id}
							renderItem={({ item }) => (
								<TouchableOpacity onPress={() => setQuery(item.username)}>{renderUserItem(item)}</TouchableOpacity>
							)}
						/>
					</View>
				)}

				<Text style={[styles.label, { marginTop: 16 }]}>Amount (sats)</Text>
				<TextInput
					style={styles.input}
					placeholder="1000"
					value={amount}
					keyboardType="numeric"
					onChangeText={setAmount}
				/>

				<Text style={[styles.label, { marginTop: 16 }]}>Note (optional)</Text>
				<TextInput
					style={[styles.input, { height: 44 }]}
					placeholder="Thanks!"
					value={note}
					onChangeText={setNote}
				/>

				<TouchableOpacity style={[styles.sendButton, !canSend && { opacity: 0.5 }]} disabled={!canSend || loading} onPress={handleSend}>
					<Text style={styles.sendButtonText}>{loading ? 'Sending…' : 'Send'}</Text>
				</TouchableOpacity>
			</View>

			{pinned.length > 0 && (
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Pinned</Text>
					{pinned.map((p) => (
						<TouchableOpacity key={p.contactUid} style={styles.row} onPress={() => setQuery(p.contactUsername)}>
							<Text style={styles.rowText}>@{p.contactUsername}</Text>
						</TouchableOpacity>
					))}
				</View>
			)}

			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Recent</Text>
				{recent.length === 0 ? (
					<Text style={styles.emptyText}>No transfers yet.</Text>
				) : (
					recent.map((t) => (
						<View key={t.id} style={styles.row}>
							<Text style={styles.rowText}>@{t.toUsername}</Text>
							<Text style={styles.rowMeta}>{t.amountSats} sats</Text>
						</View>
					))
				)}
			</View>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: colors.background, paddingTop: 48, paddingHorizontal: 20 },
	header: { marginBottom: 16 },
	title: { fontSize: 22, fontWeight: '700', color: colors.text },
	subtitle: { fontSize: 13, color: colors.subtleText, marginTop: 4 },
	card: { ...components.card, alignItems: 'stretch', padding: 16 },
	label: { fontSize: 13, color: colors.text, marginBottom: 6, fontWeight: '600' },
	input: { height: 40, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 8, paddingHorizontal: 12, backgroundColor: colors.inputBg, color: colors.text },
	resultsBox: { maxHeight: 160, marginTop: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 8 },
	resultItem: { paddingVertical: 10, paddingHorizontal: 12 },
	resultUsername: { fontSize: 14, color: colors.text },
	sendButton: { ...components.cta, height: 44, borderRadius: 8, justifyContent: 'center' },
	sendButtonText: { ...components.ctaText },
	section: { marginTop: 24 },
	sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8 },
	row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
	rowText: { fontSize: 14, color: colors.text },
	rowMeta: { fontSize: 12, color: colors.subtleText },
	emptyText: { fontSize: 13, color: colors.subtleText },
});
