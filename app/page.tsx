import Link from 'next/link'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-950 to-neutral-900 text-neutral-50">
        <div className="container mx-auto flex min-h-screen items-center justify-center px-4">

          <div className="max-w-xl text-center">

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400/90">
              Mundial 2026
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              World Cup Predictor
            </h1>

            <p className="mt-4 text-neutral-400">
              Redirigiendo a tu dashboard...
            </p>

            <meta
              httpEquiv="refresh"
              content="3;url=/dashboard"
            />

          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-950 to-neutral-900 text-neutral-50">
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4">

        <div className="max-w-xl text-center">

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400/90">
            Mundial 2026
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            World Cup Predictor
          </h1>

          <p className="mt-4 text-neutral-400">
            Predice los resultados del Mundial
            2026, compite con tus amigos y gana
            puntos.
          </p>

          <Link
            href="/login"
            className="mt-8 inline-flex rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            Iniciar sesión
          </Link>

        </div>
      </div>
    </main>
  )
}
