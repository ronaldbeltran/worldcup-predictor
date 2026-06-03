import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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
    .select('id')
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
    <main className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Mundial 2026
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-4xl">
              Mis Torneos
            </h1>
            <p className="mt-2 max-w-xl text-neutral-600 dark:text-neutral-400">
              Tus ligas privadas. Comparte el código de invitación para que más
              amigos se unan.
            </p>
          </div>

          <Link
            href="/leagues/create"
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white dark:focus-visible:outline-neutral-100"
          >
            Crear Torneo
          </Link>
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
            <h2 className="mt-5 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
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
                  <article className="flex h-full flex-col rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm transition duration-200 group-hover:-translate-y-0.5 group-hover:border-neutral-300 group-hover:shadow-md group-active:translate-y-0 group-active:shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:group-hover:border-neutral-700">
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                      {league.name}
                    </h2>

                    <dl className="mt-5 flex flex-1 flex-col gap-4 text-sm">
                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                          Código de invitación
                        </dt>
                        <dd className="mt-1 font-mono text-base font-semibold tracking-wider text-emerald-700 dark:text-emerald-400">
                          {league.invite_code}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                          Creado
                        </dt>
                        <dd className="mt-1 text-neutral-700 dark:text-neutral-300">
                          <time dateTime={league.created_at}>
                            {formatCreatedAt(league.created_at)}
                          </time>
                        </dd>
                      </div>
                    </dl>
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
