import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CopyInviteButton } from '@/components/leagues/copy-invite-button'
import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type League = {
  id: string
  name: string
  invite_code: string
  created_at: string
  owner_user_id: string
}

type Owner = {
  display_name: string | null
}

function formatCreatedAt(isoDate: string) {
  return new Intl.DateTimeFormat('es', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(isoDate))
}

type LeaguePageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function LeaguePage({ params }: LeaguePageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('id, name, invite_code, created_at, owner_user_id')
    .eq('id', id)
    .single<League>()

  if (leagueError || !league) {
    notFound()
  }

  const [{ data: membersCountData }, { data: owner }] = await Promise.all([
    supabase
      .from('league_members')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('users')
      .select('display_name')
      .eq('id', league.owner_user_id)
      .single<Owner>(),
  ])

  const membersCount = membersCountData?.length ?? null

  const ownerName =
    owner?.display_name && owner.display_name.trim().length > 0
      ? owner.display_name
      : 'Anónimo'

  //const tabs = ['Overview', 'Matches', 'Ranking', 'Members'] as const

const tabs = [
  {
    label: 'Overview',
    href: `/leagues/${league.id}`,
  },
  {
    label: 'Matches',
    href: `/leagues/${league.id}/matches`,
  },
  {
    label: 'Ranking',
    href: `/leagues/${league.id}/leaderboard`,
  },
  {
    label: 'Members',
    href: '#',
  },
]







  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-950 to-neutral-900 text-neutral-50">
      <div className="mx-auto flex w-full max-w-4xl flex-col px-4 pb-10 pt-8 sm:px-6 lg:px-8">
        <header className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400/90">
              Liga
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {league.name}
            </h1>
          </div>

          <div className="flex flex-col gap-3 text-sm text-neutral-300 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-neutral-900/80 px-3 py-1 text-xs font-medium text-neutral-300 ring-1 ring-neutral-700/80">
                Código:{' '}
                <span className="font-mono text-emerald-400">
                  {league.invite_code}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-neutral-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Creada el {formatCreatedAt(league.created_at)}
              </span>
            </div>
          </div>
        </header>

        <nav className="mt-6 overflow-x-auto">
          <ul className="flex min-w-max gap-1 rounded-full bg-neutral-900/80 p-1 text-xs text-neutral-300 ring-1 ring-neutral-800">


{tabs.map((tab) => (
  <li key={tab.label} className="flex-1">

    <Link
      href={tab.href}
      className="block w-full rounded-full px-4 py-2 text-center text-[11px] font-medium tracking-wide text-neutral-400 transition hover:bg-neutral-800 hover:text-neutral-100"
    >
      {tab.label}
    </Link>

  </li>
))}





          </ul>
        </nav>

        <section className="mt-6 space-y-4">
          <Card className="bg-gradient-to-b from-neutral-900/80 to-neutral-950/90 text-neutral-50 ring-neutral-800">
            <CardHeader className="border-b border-neutral-800/80 pb-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-sm font-semibold">
                    Overview
                  </CardTitle>
                  <CardDescription className="mt-1 text-[11px] text-neutral-400">
                    Resumen rápido de tu liga.
                  </CardDescription>
                </div>
                <CopyInviteButton inviteCode={league.invite_code} />
              </div>
            </CardHeader>

            <CardContent className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-3">
              <div className="rounded-xl bg-neutral-900/80 p-3 ring-1 ring-neutral-800/80">
                <p className="text-[11px] font-medium text-neutral-400">
                  Miembros
                </p>
                <p className="mt-1 text-xl font-semibold">
                  {membersCount ?? '—'}
                </p>
                <p className="mt-1 text-[11px] text-neutral-500">
                  Jugadores en esta liga
                </p>
              </div>

              <div className="rounded-xl bg-neutral-900/80 p-3 ring-1 ring-neutral-800/80">
                <p className="text-[11px] font-medium text-neutral-400">
                  Creador
                </p>
                <p className="mt-1 text-sm font-semibold">{ownerName}</p>
                <p className="mt-1 text-[11px] text-neutral-500">
                  Administra esta liga
                </p>
              </div>

              <div className="rounded-xl bg-neutral-900/80 p-3 ring-1 ring-neutral-800/80">
                <p className="text-[11px] font-medium text-neutral-400">
                  Código de invitación
                </p>
                <p className="mt-1 font-mono text-sm font-semibold tracking-widest text-emerald-400">
                  {league.invite_code}
                </p>
                <p className="mt-1 text-[11px] text-neutral-500">
                  Compártelo para invitar amigos
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card className="bg-neutral-950/80 text-neutral-50 ring-neutral-800">
              <CardHeader>
                <CardTitle className="text-sm">Partidos</CardTitle>
                <CardDescription className="text-[11px]">
                  Próximamente podrás ver y gestionar los partidos desde aquí.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-neutral-950/80 text-neutral-50 ring-neutral-800">
              <CardHeader>
                <CardTitle className="text-sm">Ranking</CardTitle>
                <CardDescription className="text-[11px]">
                  Pronto verás la tabla de posiciones de tu liga.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>
      </div>
    </main>
  )
}

