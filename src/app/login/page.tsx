import { Suspense } from 'react'
import LoginClientPage from './LoginClientPage'

export default function LoginPage() {
  // The Suspense boundary is added here
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginClientPage />
    </Suspense>
  )
}