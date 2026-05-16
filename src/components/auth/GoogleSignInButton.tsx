'use client'
import { GoogleLogin } from '@react-oauth/google'

interface Props {
  onSuccess: (idToken: string) => void
  onError: (message: string) => void
  disabled?: boolean
}

export default function GoogleSignInButton({ onSuccess, onError, disabled }: Props) {
  return (
    <div className="google-signin-shell w-full max-w-[352px] mx-auto" aria-disabled={disabled || undefined}>
      <GoogleLogin
        onSuccess={(cr) => onSuccess(cr.credential!)}
        onError={() => onError('Google sign-in was cancelled.')}
        theme="outline"
        shape="rectangular"
        text="continue_with"
        width="352"
      />
    </div>
  )
}
