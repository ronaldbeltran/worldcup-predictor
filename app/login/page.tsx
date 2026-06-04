'use client'

import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo:
          'http://localhost:3000/auth/callback',
      },
    })
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-950 to-neutral-900 text-neutral-50">
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4">

        <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900/70 p-8">

          <div className="space-y-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400/90">
              Mundial 2026
            </p>

            <h1 className="text-3xl font-semibold tracking-tight">
              World Cup Predictor
            </h1>

            <p className="text-sm text-neutral-400">
              Crea ligas privadas, comparte tus pronósticos y compite con tus amigos durante todo el Mundial.
            </p>
          </div>

          <div className="mt-8">
            <button
              onClick={handleGoogleLogin}
              className="flex w-full items-center justify-center rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm font-semibold text-neutral-50 transition-colors hover:border-emerald-500/40 hover:bg-neutral-700"
            >
              Continuar con Google
            </button>
          </div>

        </div>
      </div>
    </main>
  )
}