#!/bin/bash

# Stacks API Test Scripts
echo "🚀 Testing Stacks API endpoints..."

# 1. Get account info
echo "📋 Getting account info for recipient address..."
curl -s "https://stacks-node-api.testnet.stacks.co/v1/addresses/stacks/STNZV2VFAPWYTSEF05B3BNFCD8X5VARKBNR3GDSD" | jq

# 2. Get STX balance
echo "💰 Getting STX balance..."
curl -s "https://stacks-node-api.testnet.stacks.co/extended/v1/address/STNZV2VFAPWYTSEF05B3BNFCD8X5VARKBNR3GDSD/stx" | jq

# 3. Get account transactions
echo "📜 Getting account transactions..."
curl -s "https://stacks-node-api.testnet.stacks.co/extended/v1/address/STNZV2VFAPWYTSEF05B3BNFCD8X5VARKBNR3GDSD/transactions?limit=5" | jq

# 4. Check network status
echo "🌐 Getting network info..."
curl -s "https://stacks-node-api.testnet.stacks.co/v2/info" | jq

# 5. Test transaction fee estimation
echo "💸 Getting fee estimation..."
curl -s -X POST "https://stacks-node-api.testnet.stacks.co/v2/fees/transaction" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_payload": {
      "transaction_type": "token_transfer",
      "token_transfer": {
        "recipient_address": "STNZV2VFAPWYTSEF05B3BNFCD8X5VARKBNR3GDSD",
        "amount": "4000000",
        "memo": "0x"
      }
    }
  }' | jq

echo "✅ All tests completed!"
