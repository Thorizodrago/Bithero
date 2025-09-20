# 🚀 BitHero - Decentralized STX Wallet & Payment Platform

**BitHero**, Stacks blockchain üzerinde STX token transferi yapabilen, kullanıcı dostu bir mobil ve web uygulamasıdır. Kullanıcılar username ile kayıt olabilir, Leather wallet bağlayabilir ve kolay bir şekilde STX transfer işlemleri gerçekleştirebilir.

## 🎯 Amaç

BitHero'nun temel amacı:
- **Basit STX Transferleri**: Karmaşık wallet adresleri yerine username kullanarak STX gönderimi
- **Kullanıcı Dostu Arayüz**: Crypto deneyimi olmayan kullanıcılar için basit tasarım
- **Güvenli Wallet Entegrasyonu**: Leather wallet ile güvenli bağlantı
- **Sosyal Crypto Deneyimi**: Username tabanlı sosyal crypto işlemleri

## ✨ Özellikler

- 🔐 **Firebase Authentication** ile güvenli kullanıcı yönetimi
- 💼 **Leather Wallet Integration** ile STX wallet bağlantısı
- 💸 **Direct STX Transfers** - gerçek STX token transferleri
- 👤 **Username System** - kolay kullanıcı bulma ve gönderim
- 🔍 **Real-time Search** - kullanıcı arama ve keşfetme
- 📱 **Cross-platform** - Web ve mobil destekli
- 🌐 **Stacks Testnet** desteği

## 🛠️ Kullanılan Teknolojiler

### Frontend
- **React Native** - Cross-platform mobil uygulama
- **Expo** - Development ve deployment framework
- **TypeScript** - Type-safe development
- **React Router** - Navigation management

### Backend & Database
- **Firebase Auth** - Kullanıcı kimlik doğrulama
- **Firestore** - NoSQL real-time database
- **Firebase Storage** - File storage

### Blockchain & Wallet
- **Stacks Blockchain** - STX token network
- **Leather Wallet** - Stacks wallet provider
- **Clarinet** - Smart contract development
- **Stacks.js** - Stacks blockchain integration

### Development Tools
- **ESLint** - Code linting
- **Git** - Version control
- **VS Code** - Development environment

## 🏗️ Proje Yapısı

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

### Öngereksinimler

1. **Node.js** (v18 veya üzeri)
```bash
# Node.js versiyonunu kontrol et
node --version
```

2. **Expo CLI**
```bash
# Expo CLI'yi global olarak yükle
npm install -g @expo/cli
```

3. **Git**
```bash
# Git versiyonunu kontrol et
git --version
```

### Kurulum Adımları

1. **Repository'yi klonla**
```bash
git clone https://github.com/Thorizodrago/Bithero.git
cd Bithero
```

2. **Dependencies'leri yükle**
```bash
npm install
```

3. **Firebase Configuration**
   - Firebase Console'da yeni proje oluştur
   - `src/firebase.ts` dosyasında Firebase config'i güncelle
   - Authentication ve Firestore'u etkinleştir

4. **Development server'ı başlat**
```bash
npx expo start
```

5. **Uygulamayı çalıştır**
   - **Web için**: Browser'da açılan URL'ye git
   - **Mobil için**: Expo Go app ile QR kodu tara
   - **iOS Simulator**: `i` tuşuna bas
   - **Android Emulator**: `a` tuşuna bas

### Smart Contract Development

1. **Clarinet'i yükle**
```bash
# macOS
brew install clarinet

# Linux/Windows
curl -L https://github.com/hirosystems/clarinet/releases/latest/download/clarinet-linux-x64.tar.gz | tar xz
```

2. **Contract'ı test et**
```bash
cd contract
clarinet test
```

3. **Contract'ı deploy et**
```bash
clarinet deploy --testnet
```

## 🔧 Configuration

### Environment Variables

`.env` dosyası oluştur:
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

1. **Leather Wallet Extension yükle**
   - Chrome Web Store'dan Leather Wallet'i yükle
   - Yeni wallet oluştur veya mevcut wallet'i import et
   - Testnet'e geç (Settings > Network > Testnet)

2. **Test STX al**
   - [Stacks Testnet Faucet](https://explorer.stacks.co/sandbox/faucet) kullan
   - Wallet adresini gir ve STX token al

## 📱 Kullanım

### 1. Hesap Oluşturma
- Uygulama açıldığında "Create Account" butonuna tıkla
- Username, email ve şifre ile kayıt ol
- Email doğrulaması tamamla

### 2. Wallet Bağlama
- Ana sayfada "Connect Wallet" butonuna tıkla
- Leather wallet açılacak, bağlantıyı onayla
- STX adresi otomatik olarak kaydedilecek

### 3. STX Gönderme
- "Send" sekmesine git
- Amount ve recipient address gir
- "Send STX" butonuna bas
- Leather wallet'ta transaction'ı onayla
- Transfer tamamlanacak

### 4. Kullanıcı Arama
- Search bar'da "@username" formatında ara
- Kullanıcıları bul ve profil bilgilerini gör

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

- [ ] Mainnet support
- [ ] Multi-currency support (BTC, other tokens)
- [ ] Transaction history
- [ ] Push notifications
- [ ] QR code scanning
- [ ] Batch transfers
- [ ] DeFi integrations

## 🐛 Known Issues

- Web platform'da Alert.alert çalışmıyor (custom modal ile çözüldü)
- Leather wallet deprecation warnings (güncelleme gerekli)
- iOS Safari'de wallet connection issues

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Developer**: Thorizodrago
- **Blockchain**: Stacks Network
- **Wallet**: Leather Wallet

## 📞 Support

- GitHub Issues: [Create Issue](https://github.com/Thorizodrago/Bithero/issues)
- Email: support@bithero.app
- Documentation: [Wiki](https://github.com/Thorizodrago/Bithero/wiki)

## 🙏 Acknowledgments

- Stacks Foundation for blockchain infrastructure
- Leather team for wallet integration
- Expo team for cross-platform framework
- Firebase for backend services

---

**Made with ❤️ for the Stacks ecosystem**
