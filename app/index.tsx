import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from "expo-router";
import { Auth, signInWithEmailAndPassword } from 'firebase/auth';
import React, { useEffect, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { getUserWalletAddress } from '../src/db';
import { auth } from '../src/firebase';
import SoftBackground from "../src/ui/SoftBackground";
import { colors, components, layout } from "../src/ui/theme";

const { width, height } = Dimensions.get('window');

function GridBackground() {
  const gridLines = [];
  const gridSize = 30;
  const numLinesX = Math.ceil(width / gridSize) + 2;
  const numLinesY = Math.ceil(height / gridSize) + 2;

  // Dikey çizgiler
  for (let i = 0; i < numLinesX; i++) {
    gridLines.push(
      React.createElement(View, {
        key: `v-${i}`,
        style: [
          styles.gridLine,
          {
            left: i * gridSize,
            width: 1,
            height: '100%',
          },
        ]
      })
    );
  }

  // Yatay çizgiler
  for (let i = 0; i < numLinesY; i++) {
    gridLines.push(
      React.createElement(View, {
        key: `h-${i}`,
        style: [
          styles.gridLine,
          {
            top: i * gridSize,
            height: 1,
            width: '100%',
          },
        ]
      })
    );
  }

  return React.createElement(View, { style: styles.backgroundContainer }, gridLines);
}

const firebaseAuth: Auth = auth;

function LoginForm({ router }: { router: any }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Uygulama açıldığında kayıtlı bilgileri yükle
  useEffect(() => {
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem('rememberedEmail');
      const savedPassword = await AsyncStorage.getItem('rememberedPassword');
      const isRemembered = await AsyncStorage.getItem('rememberMe');

      // Set remember me state first
      if (isRemembered === 'true') {
        setRememberMe(true);

        // Only auto-fill if remember me was previously enabled
        if (savedEmail && savedPassword) {
          setEmail(savedEmail);
          setPassword(savedPassword);
        }
      } else {
        setRememberMe(false);
        // Don't auto-fill if remember me was disabled
      }
    } catch (error) {
      console.error('Error loading saved credentials:', error);
    }
  };

  const saveCredentials = async () => {
    try {
      await AsyncStorage.setItem('rememberMe', rememberMe.toString());

      if (rememberMe) {
        await AsyncStorage.setItem('rememberedEmail', email);
        await AsyncStorage.setItem('rememberedPassword', password);
      } else {
        await AsyncStorage.removeItem('rememberedEmail');
        await AsyncStorage.removeItem('rememberedPassword');
      }
    } catch (error) {
      console.error('Error saving credentials:', error);
    }
  };

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const clearErrors = () => {
    setEmailError("");
    setPasswordError("");
    setGeneralError("");
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) setEmailError(""); // Clear error when user types
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError) setPasswordError(""); // Clear error when user types
  };

  const handleForgotPassword = () => {
    // Navigate directly to the forgot password page
    router.push("/forgot-password");
  };

  const handleLogin = async () => {
    clearErrors(); // Clear previous errors

    // Validation
    if (!email.trim()) {
      setEmailError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    if (!password) {
      setPasswordError("Password is required");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const user = userCredential.user;

      // Check if email is verified
      if (!user.emailVerified) {
        setGeneralError("Please verify your email address before signing in");
        setEmailError("Email not verified");

        Alert.alert(
          "Email Not Verified",
          "Please verify your email address before signing in. Check your email and click the verification link.",
          [
            {
              text: "Resend Verification",
              onPress: async () => {
                try {
                  // Check rate limiting for verification email
                  const lastVerificationTime = await AsyncStorage.getItem(`lastEmailVerification_${user.email || email}`);
                  if (lastVerificationTime) {
                    const timeDiff = Date.now() - parseInt(lastVerificationTime);
                    const cooldownTime = 1 * 60 * 1000; // 1 minute cooldown
                    if (timeDiff < cooldownTime) {
                      const remainingTime = Math.ceil((cooldownTime - timeDiff) / 1000);
                      const minutes = Math.floor(remainingTime / 60);
                      const seconds = remainingTime % 60;
                      Alert.alert("Please Wait", `You can request another verification email in ${minutes}:${seconds.toString().padStart(2, '0')}`);
                      return;
                    }
                  }

                  const { sendEmailVerification } = await import('firebase/auth');

                  // Send email verification with action code settings
                  const actionCodeSettings = {
                    url: `${window.location.origin}/email-verification-success`,
                    handleCodeInApp: false,
                  };

                  try {
                    await sendEmailVerification(user, actionCodeSettings);
                  } catch (verificationError) {
                    console.warn('Email verification with action code failed, trying default:', verificationError);
                    // Fallback to default verification
                    await sendEmailVerification(user);
                  }

                  // Store timestamp for rate limiting
                  await AsyncStorage.setItem(`lastEmailVerification_${user.email || email}`, Date.now().toString());

                  router.push({
                    pathname: "/email-sent",
                    params: {
                      type: "email-verification",
                      email: user.email || email,
                      title: "Verification Email Sent",
                      message: "A new verification email has been sent to your email address."
                    }
                  });
                } catch (error) {
                  console.error("Error resending verification:", error);
                  setGeneralError("Failed to resend verification email");
                }
              }
            },
            { text: "OK", style: "default" }
          ]
        );
        // Sign out the user since email is not verified
        await firebaseAuth.signOut();
        return;
      }

      // Başarılı girişte bilgileri kaydet/sil
      await saveCredentials();

      // Check if user has wallet address
      const walletAddress = await getUserWalletAddress(user.uid);

      if (walletAddress) {
        // User has wallet, go to main app
        router.push("/main");
      } else {
        // User needs to connect wallet first
        router.push("/connect-wallet");
      }

    } catch (error: any) {
      console.error("Login error:", error);

      // Clear previous errors
      clearErrors();

      // Firebase specific error handling with inline errors
      switch (error.code) {
        case 'auth/user-not-found':
          setEmailError("No account found with this email");
          setGeneralError("No account found with this email address");
          break;
        case 'auth/wrong-password':
          setPasswordError("Incorrect password");
          setGeneralError("Incorrect password");
          break;
        case 'auth/invalid-email':
          setEmailError("Invalid email address");
          setGeneralError("Invalid email address");
          break;
        case 'auth/user-disabled':
          setEmailError("This account has been disabled");
          setGeneralError("This account has been disabled");
          break;
        case 'auth/too-many-requests':
          setGeneralError("Too many failed attempts. Please try again later");
          break;
        case 'auth/network-request-failed':
          setGeneralError("Network error. Please check your connection");
          break;
        case 'auth/invalid-credential':
          setEmailError("Email or password is incorrect");
          setPasswordError("Email or password is incorrect");
          setGeneralError("Email or password is incorrect");
          break;
        default:
          setGeneralError("Login failed. Please try again");
      }
    }
  };
  return React.createElement(View, { style: styles.formContainer },
    React.createElement(View, { style: styles.welcomeContainer },
      React.createElement(Text, { style: styles.welcomeTitle }, "Welcome to Bithero"),
      React.createElement(Text, { style: styles.welcomeSubtitle }, "Sign in to continue")
    ),

    React.createElement(View, { style: styles.inputContainer },
      React.createElement(TextInput, {
        style: [
          styles.input,
          emailFocused && styles.inputFocused,
          emailError ? styles.inputError : null
        ],
        placeholder: "Email",
        placeholderTextColor: "#999",
        keyboardType: "email-address",
        autoCapitalize: "none",
        value: email,
        onChangeText: handleEmailChange,
        onFocus: () => setEmailFocused(true),
        onBlur: () => setEmailFocused(false)
      }),
      emailError ? React.createElement(Text, { style: styles.errorText }, emailError) : null,

      React.createElement(TextInput, {
        style: [
          styles.input,
          passwordFocused && styles.inputFocused,
          passwordError ? styles.inputError : null
        ],
        placeholder: "Password",
        placeholderTextColor: "#999",
        secureTextEntry: true,
        value: password,
        onChangeText: handlePasswordChange,
        onFocus: () => setPasswordFocused(true),
        onBlur: () => setPasswordFocused(false)
      }),
      passwordError ? React.createElement(Text, { style: styles.errorText }, passwordError) : null,

      generalError ? React.createElement(Text, { style: styles.generalErrorText }, generalError) : null
    ),

    React.createElement(View, { style: styles.optionsContainer },
      React.createElement(View, { style: styles.rememberContainer },
        React.createElement(Switch, {
          value: rememberMe,
          onValueChange: setRememberMe,
          trackColor: { false: "#E5E5E5", true: "#0066CC" },
          thumbColor: rememberMe ? "#fff" : "#fff",
          style: styles.switch
        }),
        React.createElement(Text, { style: styles.rememberText }, "Remember Me")
      ),
      React.createElement(TouchableOpacity, { onPress: handleForgotPassword },
        React.createElement(Text, { style: styles.forgotPassword }, "Forgot Password?")
      )
    ),

    React.createElement(TouchableOpacity, { style: styles.loginButton, onPress: handleLogin },
      React.createElement(Text, { style: styles.buttonText }, "Login")
    ),

    React.createElement(View, { style: styles.signupContainer },
      React.createElement(Text, { style: styles.signUpText }, "Don't have a Bithero account? "),
      React.createElement(TouchableOpacity, { onPress: () => router.push("/create-account") },
        React.createElement(Text, { style: styles.signUpLink }, "Create One")
      )
    )
  );
}

export default function Index() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [showSuccess, setShowSuccess] = useState(false);
  const successAnimation = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (params.showSuccess === "true") {
      setShowSuccess(true);
      // Start animation
      const useNative = Platform.OS !== 'web';
      Animated.sequence([
        Animated.timing(successAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: useNative,
        }),
        Animated.delay(3000),
        Animated.timing(successAnimation, {
          toValue: 0,
          duration: 500,
          useNativeDriver: useNative,
        }),
      ]).start(() => {
        setShowSuccess(false);
      });
    }
  }, [params.showSuccess]);

  const SuccessMessage = () => {
    if (!showSuccess) return null;

    return React.createElement(Animated.View, {
      style: [
        styles.successContainer,
        {
          opacity: successAnimation,
          transform: [
            {
              translateY: successAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
        },
      ]
    },
      React.createElement(View, { style: styles.successContent },
        React.createElement(Text, { style: styles.successIcon }, "✓"),
        React.createElement(Text, { style: styles.successText }, "Account created successfully!"),
        React.createElement(Text, { style: styles.successSubtext }, "Welcome to Bithero")
      )
    );
  };

  return React.createElement(View, { style: styles.container },
    React.createElement(StatusBar, {
      barStyle: "light-content",
      backgroundColor: colors.background,
      translucent: Platform.OS === 'android'
    }),
    React.createElement(SoftBackground, null),
    React.createElement(ScrollView, {
      contentContainerStyle: styles.scrollContainer,
      keyboardShouldPersistTaps: "handled",
      showsVerticalScrollIndicator: false
    },
      React.createElement(View, { style: styles.logoContainer },
        React.createElement(View, { style: styles.logoTouchable },
          React.createElement(Image, {
            source: require("../assets/images/home-icon.png"),
            style: styles.logo
          })
        )
      ),
      React.createElement(LoginForm, { router })
    ),
    React.createElement(SuccessMessage)
  );
}

const styles = StyleSheet.create({
  container: {
    ...layout.gradientBg,
  },
  backgroundContainer: {
    // kept for compatibility with GridBackground component, not rendered
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  gridLine: {
    // inert style; GridBackground not rendered in dark theme
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 0,
    marginTop: 40,
    position: "relative",
  },
  logoTouchable: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  logo: {
    width: 220,
    height: 220,
    borderRadius: 0, // Remove rounded border
    borderWidth: 0,  // Remove purple border
    borderColor: 'transparent', // Remove border color
    // Remove box shadow/elevation
  },
  formContainer: {
    ...components.card,
    width: "100%",
    maxWidth: 420,
    padding: 32,
  },
  welcomeContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  welcomeTitle: {
    ...components.title,
    fontSize: 28,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: colors.subtleText,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 0,
  },
  input: {
    ...components.textField,
    width: "100%",
    height: 52,
    marginBottom: 16,
    fontSize: 16,
  },
  inputFocused: {
    ...components.textFieldFocused,
  },
  optionsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  rememberContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  switch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
  rememberText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  forgotPassword: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: "600",
    margin: 10,
  },
  loginButton: {
    ...components.cta,
    marginBottom: 20,
  },
  buttonText: {
    ...components.ctaText,
    letterSpacing: 0.2,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signUpText: {
    fontSize: 14,
    color: colors.subtleText,
  },
  signUpLink: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: "700",
  },
  successContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  successContent: {
    backgroundColor: colors.success,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)',
    } : {}),
  },
  successIcon: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "700",
    marginRight: 8,
  },
  successText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "700",
    flex: 1,
  },
  successSubtext: {
    fontSize: 12,
    color: "#fff",
    opacity: 0.9,
    marginLeft: 6,
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
    marginBottom: 8,
    marginLeft: 4,
  },
  generalErrorText: {
    fontSize: 13,
    color: colors.error,
    textAlign: "center",
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
});
