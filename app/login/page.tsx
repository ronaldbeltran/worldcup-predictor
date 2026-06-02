'use client'

import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {

  const supabase = createClient()

  const handleGoogleLogin = async () => {

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback'
      }
    })
  }

  return (
    <main className="flex min-h-screen items-center justify-center">

      <div className="flex flex-col gap-4">

        <h1 className="text-3xl font-bold">
          World Cup Predictor
        </h1>

        <button
          onClick={handleGoogleLogin}
          className="rounded bg-black px-4 py-2 text-white"
        >
          Continue with Google
        </button>

      </div>

    </main>
  )
}

