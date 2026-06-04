'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
//import { PredictionCard } from '@/components/predictions/prediction-card'
import { cn } from '@/lib/utils'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export type PredictionCardProps = {
  leagueId: string
  matchId: string
  homeTeam: string
  awayTeam: string
  kickoffAt: string
  isLocked: boolean
  initialHomeScore?: number | null
  initialAwayScore?: number | null
  officialHomeScore?: number | null
  officialAwayScore?: number | null
  totalPoints?: number | null
  explanation?: string | null
}


function formatKickoff(isoDate: string) {

  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(isoDate))
}



function scoreToInputValue(score: number | null | undefined) {
  return score != null ? String(score) : ''
}

function parseScore(value: string) {
  if (value.trim() === '') return null
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed) || parsed < 0) return null
  return parsed
}

export function PredictionCard({
  leagueId,
  matchId,
  homeTeam,
  awayTeam,
  kickoffAt,
  isLocked,
  initialHomeScore,
  initialAwayScore,
  officialHomeScore,
  officialAwayScore,
  totalPoints,
  explanation,
}: PredictionCardProps) {
  const supabase = createClient()

  const [homeScore, setHomeScore] = useState(() =>
    scoreToInputValue(initialHomeScore)
  )
  const [awayScore, setAwayScore] = useState(() =>
    scoreToInputValue(initialAwayScore)
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [showExplanation, setShowExplanation] = useState(false)

  const handleSave = async () => {
    if (isLocked) return

    const predictedHome = parseScore(homeScore)
    const predictedAway = parseScore(awayScore)

    if (predictedHome === null || predictedAway === null) {
      setError('Ingresa un marcador válido para ambos equipos.')
      setSuccess(false)
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess(false)

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        setError('Debes iniciar sesión para guardar tu predicción.')
        return
      }

      const { data: dbUser, error: dbUserError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single<{ id: string }>()

      if (dbUserError || !dbUser) {
        setError('No se encontró tu perfil de usuario.')
        return
      }

      const { error: upsertError } = await supabase.from('predictions').upsert(
        {
          league_id: leagueId,
          user_id: dbUser.id,
          match_id: matchId,
          predicted_home_score: predictedHome,
          predicted_away_score: predictedAway,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'league_id,user_id,match_id' }
      )

      if (upsertError) {
        setError('No se pudo guardar la predicción. Intenta de nuevo.')
        return
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 2500)
    } catch (err) {
      console.error(err)
      setError('Ocurrió un error inesperado.')
    } finally {
      setLoading(false)
    }
  }

  console.log('CARD DATA', {
    officialHomeScore,
    officialAwayScore,
    totalPoints,
    explanation,
  })


  return (
    <Card className="rounded-2xl bg-gradient-to-b from-neutral-900/80 to-neutral-950/90 text-neutral-50 ring-neutral-800">
      <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-neutral-800/80 pb-4">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-sm font-semibold text-neutral-50">
            Tu predicción
          </CardTitle>
          <CardDescription className="text-xs text-neutral-400">
            <time dateTime={kickoffAt}>{formatKickoff(kickoffAt)}</time>
          </CardDescription>
        </div>
        {isLocked ? <Badge variant="locked">Bloqueado</Badge> : null}
      </CardHeader>

      <CardContent className="space-y-5 py-5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3 sm:gap-4">

<div className="space-y-2 text-center">

  <p className="truncate text-xs font-medium uppercase tracking-wide text-neutral-500">
    {homeTeam}
  </p>

  {!isLocked ? (

    <Input
      type="number"
      inputMode="numeric"
      min={0}
      max={99}
      disabled={loading}
      value={homeScore}
      onChange={(e) => {
        setHomeScore(e.target.value)
        setSuccess(false)
        setError('')
      }}
      aria-label={`Marcador ${homeTeam}`}
      className={cn(
        'h-16 rounded-xl border-neutral-700 bg-neutral-900/80 text-center text-2xl font-bold tabular-nums text-neutral-50',
        'focus-visible:border-emerald-500/60 focus-visible:ring-emerald-500/30'
      )}
    />

  ) : (

<Input readOnly value={homeScore !== '' ? homeScore : '-'} className={cn( 'h-16 rounded-xl border-neutral-700 bg-neutral-900/80 text-center text-2xl font-bold tabular-nums text-neutral-50', 'pointer-events-none' )} />

  )}

</div>



          <span className="pb-5 text-sm font-bold text-neutral-500">—</span>

<div className="space-y-2 text-center">

  <p className="truncate text-xs font-medium uppercase tracking-wide text-neutral-500">
    {awayTeam}
  </p>

  {!isLocked ? (

    <Input
      type="number"
      inputMode="numeric"
      min={0}
      max={99}
      disabled={loading}
      value={awayScore}
      onChange={(e) => {
        setAwayScore(e.target.value)
        setSuccess(false)
        setError('')
      }}
      aria-label={`Marcador ${awayTeam}`}
      className={cn(
        'h-16 rounded-xl border-neutral-700 bg-neutral-900/80 text-center text-2xl font-bold tabular-nums text-neutral-50',
        'focus-visible:border-emerald-500/60 focus-visible:ring-emerald-500/30'
      )}
    />

  ) : (

<Input readOnly value={awayScore !== '' ? awayScore : '-'} className={cn( 'h-16 rounded-xl border-neutral-700 bg-neutral-900/80 text-center text-2xl font-bold tabular-nums text-neutral-50', 'pointer-events-none' )} />

  )}

</div>


        </div>

        {isLocked ? (
          <p className="text-center text-xs text-orange-300/90">
            Las predicciones están cerradas para este partido.
            <Link
    href={`/leagues/${leagueId}/matches/${matchId}`}
    className="inline-flex text-xs text-emerald-400 hover:text-emerald-300"
  >
    Ver todos los pronósticos →
  </Link>
          </p>
          

          
        ) : null}

{officialHomeScore !== null &&
 officialAwayScore !== null ? (
  <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
    <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
      Resultado oficial
    </p>

    <div className="mt-2 flex items-center justify-between">
  <p className="text-2xl font-semibold text-neutral-100">
    {officialHomeScore} — {officialAwayScore}
  </p>

  {totalPoints !== null ? (
  <p
    className={`text-lg font-semibold ${
      Number(totalPoints) > 0
        ? 'text-emerald-400'
        : 'text-neutral-400'
    }`}
  >
    {Number(totalPoints) > 0 ? '+' : ''}
    {totalPoints} pts
  </p>
) : null}

</div>

<button
  type="button"
  onClick={() => setShowExplanation(!showExplanation)}
  className="mt-2 text-xs text-neutral-400 hover:text-neutral-200"
>
  {showExplanation ? 'Ocultar puntuación ▲' : 'Ver puntuación ▼'}
</button>

{showExplanation && explanation ? (
  <div className="mt-3 space-y-1 text-xs text-neutral-300">
    {explanation
      .replaceAll('\\n', '\n')
      .split('\n')
      .filter(Boolean)
      .map((line) => (
        <p key={line}>{line}</p>
      ))}
  </div>
) : null}
    
  </div>
) : null}







      </CardContent>

      <CardFooter className="flex flex-col gap-2 border-t border-neutral-800/80 pt-4">

{!isLocked ? (
  <Button
    type="button"
    onClick={handleSave}
    disabled={loading}
    className="h-11 w-full rounded-xl text-sm font-semibold"
  >
    {loading ? 'Guardando...' : 'Guardar predicción'}
  </Button>
) : null}

{success ? (
  <p className="text-center text-xs font-medium text-emerald-300">
    Predicción guardada correctamente.
  </p>
) : null}

{error ? (
  <p className="text-center text-xs text-red-300">{error}</p>
) : null}
</CardFooter>
    </Card>
  )
}
