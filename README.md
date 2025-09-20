# 🚀 BitHero - Decentralized STX Wallet & Payment Platform

**BitHero** is a user-friendly mobile and web application built on the Stacks blockchain that enables STX token transfers. Users can register with a username, connect their Leather wallet, and easily perform STX transfer operations.

## 🎯 Goal

The main goals of BitHero are:
- **Simple STX Transfers**: Send STX using usernames instead of complex wallet addresses  
- **User-Friendly Interface**: Simple design for users with no crypto experience  
- **Secure Wallet Integration**: Safe connection with Leather wallet  
- **Social Crypto Experience**: Username-based social crypto transactions  

## ✨ Features

- 🔐 **Firebase Authentication** for secure user management  
- 💼 **Leather Wallet Integration** for STX wallet connection  
- 💸 **Direct STX Transfers** – real STX token transfers  
- 👤 **Username System** – easy user search and sending  
- 🔍 **Real-time Search** – discover and find users instantly  
- 📱 **Cross-platform** – Web and mobile supported  
- 🌐 **Stacks Testnet** support  

## 🛠️ Technologies Used

### Frontend
- **React Native** – Cross-platform mobile app  
- **Expo** – Development and deployment framework  
- **TypeScript** – Type-safe development  
- **React Router** – Navigation management  

### Backend & Database
- **Firebase Auth** – User authentication  
- **Firestore** – NoSQL real-time database  
- **Firebase Storage** – File storage  

### Blockchain & Wallet
- **Stacks Blockchain** – STX token network  
- **Leather Wallet** – Stacks wallet provider  
- **Clarinet** – Smart contract development  
- **Stacks.js** – Stacks blockchain integration  

### Development Tools
- **ESLint** – Code linting  
- **Git** – Version control  
- **VS Code** – Development environment  

## 🏗️ Project Structure

```
Bithero/
├── app/                          # React Native screens
│   ├── _layout.tsx              # App layout
│   ├── index.tsx                # Login screen
│   ├── main.tsx                 # Main wallet interface
│   ├── create-account.tsx       # Account creation
│   ├── profile.tsx              # User profile
│   └── ...
├── assets/                       # Static assets
│   ├── images/                  # App icons and images
│   └── fonts/                   # Custom fonts
├── src/                         # Core logic
│   └── firebase.ts              # Firebase configuration
├── contract/                    # Smart contracts
│   └── username-registry.clar   # Username management contract
├── app.json                     # Expo configuration
├── package.json                 # Dependencies
└── README.md                    # This file
```

## 🚀 Development Setup

### Prerequisites

1. **Node.js** (v18 or higher)
```bash
# Check Node.js version
node --version
```

2. **Expo CLI**
```bash
# Install Expo CLI globally
npm install -g @expo/cli
```

3. **Git**
```bash
# Check Git version
git --version
```

### Setup Steps

1. **Clone repository**
```bash
git clone https://github.com/Thorizodrago/Bithero.git
cd Bithero
```

2. **Install dependencies**
```bash
npm install
```

3. **Firebase Configuration**
   - Create a new project in Firebase Console  
   - Update Firebase config in `src/firebase.ts`  
   - Enable Authentication and Firestore  

4. **Start development server**
```bash
npx expo start
```

5. **Run the app**
   - **Web**: Open the provided URL in your browser  
   - **Mobile**: Scan the QR code with Expo Go app  
   - **iOS Simulator**: Press `i`  
   - **Android Emulator**: Press `a`  

### Smart Contract Development

1. **Install Clarinet**
```bash
# macOS
brew install clarinet

# Linux/Windows
curl -L https://github.com/hirosystems/clarinet/releases/latest/download/clarinet-linux-x64.tar.gz | tar xz
```

2. **Test contract**
```bash
cd contract
clarinet test
```

3. **Deploy contract**
```bash
clarinet deploy --testnet
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file:
```bash
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

# Stacks Configuration
EXPO_PUBLIC_STACKS_NETWORK=testnet
EXPO_PUBLIC_CONTRACT_ADDRESS=your_contract_address
```

### Wallet Setup

1. **Install Leather Wallet Extension**  
   - Download from Chrome Web Store  
   - Create or import a wallet  
   - Switch to Testnet (Settings > Network > Testnet)  

2. **Get Test STX**  
   - Use [Stacks Testnet Faucet](https://explorer.stacks.co/sandbox/faucet)  
   - Enter your wallet address and receive STX tokens  

## 📱 Usage

### 1. Create Account
- Open the app and click "Create Account"  
- Sign up with username, email, and password  
- Complete email verification  

### 2. Connect Wallet
- On the main screen, click "Connect Wallet"  
- Leather wallet opens, approve the connection  
- STX address is saved automatically  

### 3. Send STX
- Go to "Send" tab  
- Enter amount and recipient address  
- Click "Send STX"  
- Approve transaction in Leather wallet  
- Transfer completes  

### 4. Search Users
- Search with "@username" format  
- Find users and view their profile  

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### Contract Tests
```bash
cd contract
clarinet test
```

## 🚀 Deployment

### Web Deployment
```bash
# Build for web
npx expo export -p web

# Deploy to Netlify/Vercel
npm run deploy
```

### Mobile App Build
```bash
# iOS build
npx expo build:ios

# Android build
npx expo build:android
```

## 🤝 Contributing

1. Fork the repository  
2. Create feature branch (`git checkout -b feature/amazing-feature`)  
3. Commit changes (`git commit -m 'Add amazing feature'`)  
4. Push to branch (`git push origin feature/amazing-feature`)  
5. Open Pull Request  

## 📋 TODO

-  Mainnet support  
-  Multi-currency support (BTC, other tokens)  
-  Transaction history  
-  Push notifications  
-  QR code scanning  
-  Batch transfers  
-  DeFi integrations  

## 👥 Team

- **Developers**: Efe Yılmaz and Ömer Balaban  
- **Blockchain**: Stacks Network  
- **Wallet**: Leather Wallet  


---

**Made with ❤️, ☕ and 🤖 for the Stacks ecosystem**
