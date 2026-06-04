import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PostLoginRedirect from '@/components/post-login-redirect'
import SignOutButton from '@/components/sign-out-button'

type League = {
  id: string
  name: string
  invite_code: string
  created_at: string
}

type LeagueMemberRow = {
  leagues: League | League[] | null
}

function formatCreatedAt(isoDate: string) {
  return new Intl.DateTimeFormat('es', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(isoDate))
}

function extractLeagues(rows: LeagueMemberRow[] | null): League[] {
  if (!rows) return []

  const leagues: League[] = []

  for (const row of rows) {
    const { leagues: leagueData } = row
    if (!leagueData) continue

    if (Array.isArray(leagueData)) {
      leagues.push(...leagueData)
    } else {
      leagues.push(leagueData)
    }
  }

  return leagues.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { data: dbUser, error: userError } = await supabase
    .from('users')
    .select('id ,display_name')
    .eq('auth_user_id', user.id)
    .single()

  if (userError || !dbUser) {
    redirect('/login')
  }

  const { data: memberships, error: leaguesError } = await supabase
    .from('league_members')
    .select(
      `
      leagues (
        id,
        name,
        invite_code,
        created_at
      )
    `
    )
    .eq('user_id', dbUser.id)

  const leagues = extractLeagues(memberships as LeagueMemberRow[] | null)

  return (
    <main  className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-950 to-neutral-900 text-neutral-50">
     
     <PostLoginRedirect />

      <div className="container mx-auto space-y-6 py-6">
        <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400/90">
  Mundial 2026
</p>

<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
  Mis ligas
</h1>

<p className="text-sm text-neutral-400">
  Gestiona tus ligas y accede rápidamente a los pronósticos.
</p>
          </div>

          <div className="flex items-center gap-4">
          <Link
  href="/leagues/create"
  className="inline-flex shrink-0 items-center justify-center rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800"
>
  Crear Torneo
</Link>
<div className="text-right">
  <p className="text-sm font-medium text-neutral-200">
    {dbUser.display_name}
  </p>

  <SignOutButton />
</div>



</div>
        </header>

        {leaguesError ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
          >
            No se pudieron cargar tus torneos. Intenta de nuevo más tarde.
          </div>
        ) : leagues.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-neutral-300 bg-white/80 px-6 py-16 text-center shadow-sm dark:border-neutral-700 dark:bg-neutral-900/60">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
              <svg
                className="h-7 w-7 text-neutral-500 dark:text-neutral-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 6v.75m0 3v.75m0 3v.75m-9 3H7.5a2.25 2.25 0 0 1-2.25-2.25v-4.5m0-9A2.25 2.25 0 0 1 7.5 3h1.372c.516 0 .966.351 1.091.852l1.106 4.423a11.042 11.042 0 0 0 5.516 5.516l4.423 1.106c.5.125.852.575.852 1.091V19.5a2.25 2.25 0 0 1-2.25 2.25h-1.5m-9 0h9"
                />
              </svg>
            </div>
            <h2 className="mt-5 text-lg font-semibold text-neutral-400 dark:text-neutral-50">
              Aún no tienes torneos
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-600 dark:text-neutral-400">
              Crea tu primer torneo y empieza a predecir los partidos del
              Mundial con tus amigos.
            </p>
            <Link
              href="/leagues/create"
              className="mt-6 inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-50 dark:hover:bg-neutral-700"
            >
              Crear tu primer torneo
            </Link>
          </section>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {leagues.map((league) => (
              <li key={league.id}>
                <Link
                  href={`/leagues/${league.id}`}
                  className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50 dark:focus-visible:ring-offset-neutral-950"
                >
                  <article className="lex h-full flex-col rounded-xl border border-neutral-800 bg-neutral-900/70 p-4 transition-colors hover:border-emerald-500/40">
                    <h2 className="text-2xl font-semibold tracking-tight sm:text-2xl">
                      {league.name}
                    </h2>

  

                        <div className="mt-4 space-y-2 text-sm">
                        <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                          Código de invitación
                        </dt>
  <p className="font-mono font-semibold tracking-wider text-emerald-400">
    {league.invite_code}
  </p>

  <p className="text-neutral-400">
    Creada{' '}
    {formatCreatedAt(
      league.created_at
    )}
  </p>
</div>


                  </article>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
