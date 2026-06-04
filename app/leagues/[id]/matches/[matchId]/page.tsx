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
}

type Team = {
  name: string
}

type MatchResult = {
  home_score: number
  away_score: number
}

type MatchDetail = {
  id: string
  kickoff_at: string

  home_team: Team | Team[] | null
  away_team: Team | Team[] | null

  match_results:
    | MatchResult
    | MatchResult[]
    | null
}

type MemberUser = {
  display_name: string
}

type MemberRow = {
  user_id: string
  users:
    | MemberUser
    | MemberUser[]
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

function unwrapUser(
  user:
    | MemberUser
    | MemberUser[]
    | null
): MemberUser | null {
  if (!user) return null

  return Array.isArray(user)
    ? (user[0] ?? null)
    : user
}

export default async function MatchPredictionsPage({
  params,
}: {
  params: Promise<{
    id: string
    matchId: string
  }>
}) {
  const { id, matchId } =
    await params

  const supabase =
    await createClient()

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    const { data: currentUser,error: currentTuserError } =
  await supabase
    .from('users')
    .select('id')
    .eq(
      'auth_user_id',
      authUser?.id
    )
    .single()

  const [
    {
      data: league,
      error: leagueError,
    },
    {
      data: match,
      error: matchError,
    },
  ] = await Promise.all([
    supabase
      .from('leagues')
      .select(`
        id,
        name
      `)
      .eq('id', id)
      .single<League>(),

    supabase
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
      .eq('id', matchId)
      .single<MatchDetail>(),
  ])

  if (
    leagueError ||
    matchError ||
    currentTuserError  ||
    !league ||
    !match
  ) {
    notFound()
  }

  const {
    data: members,
    error: membersError,
  } = await supabase
    .from('league_members')
    .select(`
      user_id,

      users (
        display_name
      )
    `)
    .eq('league_id', id)

  if (membersError) {
    return (
      <div className="p-6 text-red-400">
        Error cargando miembros
      </div>
    )
  }
  const memberList =
  (members as MemberRow[] | null) ??
  []

  const { data: predictions, error: predictionsError} = await supabase
  .from('predictions')
  .select(`
    user_id,

    predicted_home_score,
    predicted_away_score,

    prediction_scores (
      total_points,
      explanation
    )
  `)
  .eq('league_id', id)
  .eq('match_id', matchId)

  if (predictionsError) {
    return (
      <div className="p-6 text-red-400">
        Error cargando las predicciones
      </div>
    )
  }

  const predictionMap = new Map(
    (predictions ?? []).map((prediction) => [
      prediction.user_id,
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

  const membersWithScores = memberList
  .map((member, index) => {
    const user = unwrapUser(
      member.users
    )

    const prediction =
      predictionMap.get(member.user_id)

    return {
      ...member,
      user,
      prediction,
      points:
        prediction?.total_points ?? 0,
    }
  })
  .sort((a, b) => {
    return b.points - a.points
  })



  const home =
    unwrapTeam(match.home_team)

  const away =
    unwrapTeam(match.away_team)

  const result = Array.isArray(
    match.match_results
  )
    ? match.match_results[0]
    : match.match_results

 

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-950 to-neutral-900 text-neutral-50">
      <div className="container mx-auto space-y-6 py-6">

        <header className="space-y-4">
          <Link
            href={`/leagues/${id}/matches`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400 transition hover:text-neutral-200"
          >
            <span aria-hidden>←</span>
            Volver a partidos
          </Link>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400/90">
              Pronósticos del partido
            </p>

            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {league.name}
            </h1>
          </div>
        </header>

        <Card className="border-neutral-800 bg-neutral-950 text-neutral-50">
          <CardHeader>
            <CardTitle>
              Partido
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">

              <p className="text-sm text-neutral-400">
                {new Intl.DateTimeFormat(
                  'es-CO',
                  {
                    dateStyle:
                      'medium',
                    timeStyle:
                      'short',
                    timeZone:
                      'America/Bogota',
                  }
                ).format(
                  new Date(
                    match.kickoff_at
                  )
                )}
              </p>

              <p className="text-xl font-semibold">
                {home?.name}

                {result ? (
                  <>
                    {' '}
                    <span className="font-bold">
                      {
                        result.home_score
                      }
                    </span>

                    {' - '}

                    <span className="font-bold">
                      {
                        result.away_score
                      }
                    </span>{' '}

                    {away?.name}
                  </>
                ) : (
                  <>
                    {' vs '}
                    {away?.name}
                  </>
                )}
              </p>

            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-800 bg-neutral-950 text-neutral-50">
          <CardHeader>
            <CardTitle>
              Participantes
            </CardTitle>
          </CardHeader>

          <CardContent>
            {!memberList.length ? (
              <p className="text-sm text-neutral-400">
                No hay miembros en
                esta liga.
              </p>
            ) : (
              <div className="space-y-2">

                {membersWithScores.map(
                  (member,index) => {
                    const user = member.user

                    const prediction =
                      member.prediction
                      const isCurrentUser = currentUser?.id === member.user_id
                      const rankLabel =
  index === 0
    ? '🥇'
    : index === 1
      ? '🥈'
      : index === 2
        ? '🥉'
        : ''
                    return (
                      
                  
                    <div
                      key={member.user_id}
                      className="rounded-lg border border-neutral-800 bg-neutral-900/70 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                        <p className="font-medium">
  {rankLabel
    ? `${rankLabel} `
    : ''}
  {user?.display_name}

  {isCurrentUser ? (
    <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
      Tú
    </span>
  ) : null}
</p>
                    
                          <p className="text-sm text-neutral-400">
                            {prediction
                              ? `${prediction.predicted_home_score} - ${prediction.predicted_away_score}`
                              : 'Sin pronóstico'}
                          </p>
                        </div>
                    
                        <div className="text-right">
                          <p className="font-semibold text-emerald-400">
                            {prediction?.total_points ?? 0}
                            {' '}
                            pts
                          </p>
                        </div>
                      </div>
                    
                      {prediction?.explanation ? (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs text-neutral-400 hover:text-neutral-200">
                            Ver puntuación ▼
                          </summary>
                    
                          <div className="mt-3 space-y-1 text-xs text-neutral-300">
                            {prediction.explanation
                              .replaceAll('\\n', '\n')
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
                      ) : null}
                    </div>
                    )
                  }
                )}

              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </main>
  )
}