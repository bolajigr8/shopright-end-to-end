import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from '@clerk/clerk-react'

const App = () => {
  return (
    <div>
      <h1>Homepage</h1>
      <SignedOut>
        <SignInButton mode='modal' />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </div>
  )
}

export default App
