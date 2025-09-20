// STX Transfer Test Script
// Bu script Stacks blockchain'de STX transfer simülasyonu yapar

const { StacksTestnet } = require('@stacks/network');
const { makeSTXTokenTransfer, broadcastTransaction, AnchoredMode } = require('@stacks/transactions');
const { createStacksPrivateKey, getAddressFromPrivateKey, TransactionVersion } = require('@stacks/transactions');

async function testSTXTransfer() {
	try {
		console.log('🚀 Starting STX Transfer Test...');

		// Test network
		const network = new StacksTestnet();

		// Test private key (sadece test için - gerçek kullanmayın!)
		const privateKey = createStacksPrivateKey('your-test-private-key-here');
		const senderAddress = getAddressFromPrivateKey(privateKey.data, TransactionVersion.Testnet);

		console.log('Sender Address:', senderAddress);

		// Transfer parametreleri
		const txOptions = {
			recipient: 'STNZV2VFAPWYTSEF05B3BNFCD8X5VARKBNR3GDSD', // Recipient address
			amount: BigInt(4000000), // 4 STX in microSTX
			senderKey: privateKey,
			network: network,
			memo: 'Test transfer from Bithero',
			anchorMode: AnchoredMode.Any,
		};

		console.log('📤 Transfer params:', {
			recipient: txOptions.recipient,
			amount: txOptions.amount.toString(),
			memo: txOptions.memo
		});

		// Transaction oluştur
		console.log('🔨 Creating transaction...');
		const transaction = await makeSTXTokenTransfer(txOptions);

		console.log('📋 Transaction created:', transaction.txid());

		// NOT: Gerçek broadcast için private key gerekir
		// const result = await broadcastTransaction(transaction, network);
		// console.log('✅ Transaction result:', result);

		console.log('✅ Test completed successfully!');

	} catch (error) {
		console.error('❌ Test failed:', error);
	}
}

// Test çalıştır
testSTXTransfer();
