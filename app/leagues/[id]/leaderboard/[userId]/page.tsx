import Link from 'next/link'
import { notFound } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type League = {
  id: string
  name: string
  tournament_id:  string
}

type User = {
  id: string
  display_name: string
}


type Team = {
    name: string
  }
  
  type MatchRow = {
    id: string
    kickoff_at: string
  
    home_team: Team | Team[] | null
    away_team: Team | Team[] | null
  
    match_results:
      | {
          home_score: number
          away_score: number
        }
      | {
          home_score: number
          away_score: number
        }[]
      | null
  }

  function unwrapTeam(
    team: Team | Team[] | null
  ): Team | null {
    if (!team) return null
  
    return Array.isArray(team)
      ? (team[0] ?? null)
      : team
  }
  
export default async function UserScoreDetailPage({
  params,
}: {
  params: Promise<{
    id: string
    userId: string
  }>
}) {
  const { id, userId } = await params

  const supabase = await createClient()

  const [
    { data: league, error: leagueError },
    { data: selectedUser, error: userError },
  ] = await Promise.all([
    supabase
      .from('leagues')
      .select(`
        id,
        name,
        tournament_id
      `)
      .eq('id', id)
      .single<League>(),

    supabase
      .from('users')
      .select(`
        id,
        display_name
      `)
      .eq('id', userId)
      .single<User>(),
  ])

  if (
    leagueError ||
    userError ||
    !league ||
    !selectedUser
  ) {
    notFound()
  }

  const { data: matches } = await supabase
  .from('matches')
  .select(`
    id,
    kickoff_at,

    home_team:teams!home_team_id (
      name
    ),

    away_team:teams!away_team_id (
      name
    ),

    match_results (
      home_score,
      away_score
    )
  `)
  .eq('tournament_id', league.tournament_id)
  .order('kickoff_at', {
    ascending: false,
  })


  const finishedMatches =
  ((matches as MatchRow[] | null) ?? []).filter(
    (match) => match.match_results
  )
  const { data: predictions } = await supabase
  .from('predictions')
  .select(`
    match_id,
    predicted_home_score,
    predicted_away_score,

    prediction_scores (
      total_points,
      explanation
    )
  `)
  .eq('league_id', id)
  .eq('user_id', userId)


  const predictionMap = new Map(
    (predictions ?? []).map((prediction) => [
      prediction.match_id,
      {
        predicted_home_score:
          prediction.predicted_home_score,
  
        predicted_away_score:
          prediction.predicted_away_score,
  
        total_points:
          (prediction as any)
            .prediction_scores?.total_points ?? 0,
  
        explanation:
          (prediction as any)
            .prediction_scores?.explanation ?? null,
      },
    ])
  )

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-950 to-neutral-900 text-neutral-50">
      <div className="container mx-auto space-y-6 py-6">
        <header className="space-y-4">
          <Link
            href={`/leagues/${id}/leaderboard`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400 transition hover:text-neutral-200"
          >
            <span aria-hidden>←</span>
            Volver al ranking
          </Link>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400/90">
              Detalle de puntuación
            </p>

            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {selectedUser.display_name}
            </h1>

            <p className="text-sm text-neutral-400">
              Historial completo de predicciones y puntos obtenidos
            </p>
          </div>
        </header>

        <Card className="border-neutral-800 bg-neutral-950 text-neutral-50">
          <CardHeader>
            <CardTitle>
              Historial de puntuación
            </CardTitle>
          </CardHeader>

          <CardContent>
  {!finishedMatches.length ? (
    <p className="text-sm text-neutral-400">
      No hay partidos finalizados.
    </p>
  ) : (
    <div className="space-y-3">
      {finishedMatches.map((match) => {
        const prediction =
          predictionMap.get(match.id)

        const home = unwrapTeam(
          match.home_team
        )

        const away = unwrapTeam(
          match.away_team
        )

        const result = Array.isArray(
          match.match_results
        )
          ? match.match_results[0]
          : match.match_results

        return (
          <div
            key={match.id}
            className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-3"
          >
            <p className="text-xs text-neutral-500">
              {new Intl.DateTimeFormat(
                'es-CO',
                {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  timeZone:
                    'America/Bogota',
                }
              ).format(
                new Date(match.kickoff_at)
              )}
            </p>

            <p className="mt-2 text-lg font-semibold">
              {home?.name}{' '}
              <span className="font-bold">
                {result?.home_score}
              </span>
              {' - '}
              <span className="font-bold">
                {result?.away_score}
              </span>{' '}
              {away?.name}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="text-neutral-400">
                Pronóstico:
              </span>

              <span className="font-medium">
                {prediction
                  ? `${prediction.predicted_home_score} - ${prediction.predicted_away_score}`
                  : 'Sin pronóstico'}
              </span>

              <span className="font-semibold text-emerald-400">
                {prediction?.total_points ??
                  0}{' '}
                pts
              </span>
            </div>

            <div className="mt-2">
              {!prediction?.explanation ? (
                <p className="text-xs text-neutral-500">
                  No realizó pronóstico para este partido.
                </p>
              ) : (
                <details>
                  <summary className="cursor-pointer text-xs text-neutral-400 hover:text-neutral-200">
                    Ver puntuación ▼
                  </summary>

                  <div className="mt-3 space-y-1 text-xs text-neutral-300">
                    {prediction.explanation
                      .replaceAll(
                        '\\n',
                        '\n'
                      )
                      .split('\n')
                      .filter(Boolean)
                      .map(
                        (
                          line: string,
                          index: number
                        ) => (
                          <p key={index}>
                            {line}
                          </p>
                        )
                      )}
                  </div>
                </details>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )}
</CardContent>
        </Card>
      </div>
    </main>
  )
}