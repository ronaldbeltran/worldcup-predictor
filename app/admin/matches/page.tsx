import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ResultCard } from '@/components/admin/result-card'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'

const ADMIN_EMAIL = 'ronald.beltran.r@gmail.com'

type Team = {
  name: string
  fifa_code: string | null
}

type MatchRow = {
  id: string
  kickoff_at: string
  stage: string
  status: string
  home_team: Team | Team[] | null
  away_team: Team | Team[] | null
}

type MatchResultRow = {
  match_id: string
  home_score: number
  away_score: number
  loaded_at: string
}

function unwrapTeam(team: Team | Team[] | null): Team | null {
  if (!team) return null
  return Array.isArray(team) ? (team[0] ?? null) : team
}

export default async function AdminMatchesPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user || user.email !== ADMIN_EMAIL) {
    notFound()
  }

  const [{ data: matches, error: matchesError }, { data: results }] =
    await Promise.all([
      supabase
        .from('matches')
        .select(
          `
        id,
        kickoff_at,
        stage,
        status,
        home_team:teams!home_team_id (
          name,
          fifa_code
        ),
        away_team:teams!away_team_id (
          name,
          fifa_code
        )
      `
        )
        .order('kickoff_at', { ascending: true }),
      supabase
        .from('match_results')
        .select('match_id, home_score, away_score, loaded_at'),
    ])

  const matchList = (matches as MatchRow[] | null) ?? []

  const resultsMap = new Map<string, MatchResultRow>(
    ((results as MatchResultRow[] | null) ?? []).map((result) => [
      result.match_id,
      result,
    ])
  )

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-950 to-neutral-900 text-neutral-50">
      <div className="mx-auto flex w-full max-w-5xl flex-col px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">
            Admin
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Resultados de partidos
          </h1>
          <p className="text-sm text-neutral-400">
            Carga y actualiza marcadores finales del torneo.
          </p>
        </header>

        {matchesError ? (
          <Card className="mt-6 bg-neutral-950/80 text-neutral-50 ring-neutral-800">
            <CardHeader>
              <CardTitle className="text-base">Error al cargar</CardTitle>
              <CardDescription className="text-xs text-neutral-400">
                No se pudieron cargar los partidos. Intenta de nuevo más tarde.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : matchList.length === 0 ? (
          <Card className="mt-6 bg-neutral-950/80 text-neutral-50 ring-neutral-800">
            <CardHeader>
              <CardTitle className="text-base">Sin partidos</CardTitle>
              <CardDescription className="text-xs text-neutral-400">
                No hay partidos registrados en la base de datos.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5">
            {matchList.map((match) => {
              const home = unwrapTeam(match.home_team)
              const away = unwrapTeam(match.away_team)
              const existing = resultsMap.get(match.id)

              return (
                <li key={match.id}>
                  <ResultCard
                    matchId={match.id}
                    homeTeam={home?.name ?? '—'}
                    awayTeam={away?.name ?? '—'}
                    kickoffAt={match.kickoff_at}
                    stage={match.stage}
                    status={match.status}
                    initialHomeScore={existing?.home_score ?? null}
                    initialAwayScore={existing?.away_score ?? null}
                  />
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </main>
  )
}
