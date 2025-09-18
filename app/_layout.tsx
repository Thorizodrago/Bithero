import { Stack } from "expo-router";


export default function RootLayout() {
  return (

    <Stack
      screenOptions={{
        headerShown: false, //Hide header
        animation: 'slide_from_right', // Slide anim (phone)
        gestureEnabled: true, // Swipe, go back
        gestureDirection: 'horizontal', // horizontal gesture

      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Login'
        }}
      />
      <Stack.Screen
        name="create-account"
        options={{
          title: 'Create Account',
          animation: 'slide_from_right', // right to left
        }}
      />
      <Stack.Screen
        name="connect-wallet"
        options={{
          title: 'Connect Wallet',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="add-profile"
        options={{
          title: 'Add Profile',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="transfers"
        options={{
          title: 'Transfers',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="reset-password"
        options={{
          title: 'Reset Password',
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}
