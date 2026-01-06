import { ClerkProvider } from '@clerk/clerk-expo'
import { Stack } from 'expo-router'
import '../global.css'
import { tokenCache } from '@clerk/clerk-expo/token-cache'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache}>
      <QueryClientProvider client={new QueryClient()}>
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </ClerkProvider>
  )
}
