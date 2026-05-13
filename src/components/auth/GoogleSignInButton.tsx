'use client'
import { GoogleLogin } from '@react-oauth/google'

interface Props {
  onSuccess: (idToken: string) => void
  onError: (message: string) => void
  disabled?: boolean
}

export default function GoogleSignInButton({ onSuccess, onError }: Props) {
  return (
    <div className="w-full flex justify-center">
      <GoogleLogin
        onSuccess={(cr) => onSuccess(cr.credential!)}
        onError={() => onError('Google sign-in was cancelled.')}
        theme="filled_black"
        shape="rectangular"
        text="continue_with"
        width="352"
      />
    </div>
  )
}
