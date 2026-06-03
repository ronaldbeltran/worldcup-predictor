import Link from 'next/link'

import { PredictionCard } from '@/components/predictions/prediction-card'


import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type League = {
  id: string
  name: string
  tournament_id: string
}

type Team = {
  name: string
  fifa_code: string | null
}

type MatchRow = {
  id: string
  stage: string
  kickoff_at: string
  status: string
  home_team: Team | Team[] | null
  away_team: Team | Team[] | null
}

type MatchState = 'upcoming' | 'locked' | 'finished'

const FIVE_MINUTES_MS = 5 * 60 * 1000


function formatKickoff(isoDate: string) {

  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(isoDate))
}



function unwrapTeam(team: Team | Team[] | null): Team | null {
  if (!team) return null
  return Array.isArray(team) ? (team[0] ?? null) : team
}

function getMatchState(status: string, kickoffAt: string): MatchState {
  if (status !== 'scheduled') {
    return 'finished'
  }

  const msUntilKickoff = new Date(kickoffAt).getTime() - Date.now()

  if (msUntilKickoff > FIVE_MINUTES_MS) {
    return 'upcoming'
  }
  return 'locked'
}

function getStateLabel(state: MatchState) {
  switch (state) {
    case 'upcoming':
      return 'Próximo'
    case 'locked':
      return 'Bloqueado'
    case 'finished':
      return 'Finalizado'
  }
}

function formatStage(stage: string) {
  return stage
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

type MatchesPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function LeagueMatchesPage({ params }: MatchesPageProps) {
  const { id } = await params
  const supabase = await createClient()


const {
  data: { user: authUser },
} = await supabase.auth.getUser()

let dbUserId: string | null = null

if (authUser) {

  const { data: dbUser } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', authUser.id)
    .single()

  dbUserId = dbUser?.id ?? null
}




  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('id, name, tournament_id')
    .eq('id', id)
    .single<League>()

  if (leagueError || !league) {
    notFound()
  }

  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select(
      `
      id,
      stage,
      kickoff_at,
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
    .eq('tournament_id', league.tournament_id)
    .order('kickoff_at', { ascending: true })

  const matchList = (matches as MatchRow[] | null) ?? []

let predictionsMap = new Map()

if (dbUserId) {

  const { data: predictions } = await supabase
    .from('predictions')
    .select(`
      match_id,
      predicted_home_score,
      predicted_away_score,
          prediction_scores (
      total_points,
      explanation
    ),

    match:matches (
      match_results (
        home_score,
        away_score
      )
    )
    `)
    .eq('league_id', league.id)
    .eq('user_id', dbUserId)

    console.log(
      'PREDICTION SAMPLE',
      JSON.stringify(predictions, null, 2)
    )

  predictionsMap = new Map(
    (predictions ?? []).map((prediction) => [
      prediction.match_id,
      {
        predicted_home_score: prediction.predicted_home_score,
        predicted_away_score: prediction.predicted_away_score,
  
        total_points:
          (prediction as any).prediction_scores?.total_points ?? null,
  
        explanation:
        (prediction as any).prediction_scores?.explanation ?? null,
  
        official_home_score:
        (prediction as any).match?.match_results?.home_score ?? null,
  
        official_away_score:
        (prediction as any).match?.match_results?.away_score ?? null,
      },
    ])
  )
}


  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-950 to-neutral-900 text-neutral-50">
      <div className="mx-auto flex w-full max-w-5xl flex-col px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <header className="space-y-4">
          <Link
            href={`/leagues/${league.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400 transition hover:text-neutral-200"
          >
            <span aria-hidden>←</span>
            Volver a la liga
          </Link>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400/90">
              Partidos
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {league.name}
            </h1>
            <p className="text-sm text-neutral-400">
              Calendario del torneo · ordenado por fecha de inicio
            </p>
          </div>
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
                Aún no hay partidos programados para este torneo.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5">
            {matchList.map((match) => {
              const home = unwrapTeam(match.home_team)
              const away = unwrapTeam(match.away_team)
              const state = getMatchState(match.status, match.kickoff_at)
              const existingPrediction =predictionsMap.get(match.id)

              console.log(
                'MATCH',
                match.id,
                existingPrediction
              )

              return (
                <li key={match.id}> 
                  <PredictionCard
                   leagueId={league.id} 
                   matchId={match.id} 
                   homeTeam={home?.name ?? '—'} 
                   awayTeam={away?.name ?? '—'} 
                   kickoffAt={match.kickoff_at} 
                   isLocked={state === 'locked'} 
                   initialHomeScore={existingPrediction?.predicted_home_score ?? null}
                   initialAwayScore={existingPrediction?.predicted_away_score ?? null}
                   officialHomeScore={existingPrediction?.official_home_score ?? null}
                   officialAwayScore={existingPrediction?.official_away_score ?? null}
                   totalPoints={existingPrediction?.total_points ?? null}
                   explanation={existingPrediction?.explanation ?? null}

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
