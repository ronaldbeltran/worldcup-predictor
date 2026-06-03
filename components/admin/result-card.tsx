'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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

export type ResultCardProps = {
  matchId: string
  homeTeam: string
  awayTeam: string
  kickoffAt: string
  stage: string
  status: string
  initialHomeScore?: number | null
  initialAwayScore?: number | null
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

function formatStage(stage: string) {
  return stage
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
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

export function ResultCard({
  matchId,
  homeTeam,
  awayTeam,
  kickoffAt,
  stage,
  status,
  initialHomeScore,
  initialAwayScore,
}: ResultCardProps) {
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

  const handleSave = async () => {
    const home = parseScore(homeScore)
    const away = parseScore(awayScore)

    if (home === null || away === null) {
      setError('Ingresa un marcador válido para ambos equipos.')
      setSuccess(false)
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess(false)

      const { error: upsertError } = await supabase.from('match_results').upsert(
        {
          match_id: matchId,
          home_score: home,
          away_score: away,
          loaded_at: new Date().toISOString(),
        },
        { onConflict: 'match_id' }
      )

      if (upsertError) {
        console.error(upsertError)
        setError('No se pudo guardar el resultado. Intenta de nuevo.')
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

  return (
    <Card className="rounded-2xl bg-gradient-to-b from-neutral-900/80 to-neutral-950/90 text-neutral-50 ring-neutral-800">
      <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-neutral-800/80 pb-4">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-sm font-semibold text-neutral-50">
            {formatStage(stage)}
          </CardTitle>
          <CardDescription className="text-xs text-neutral-400">
            <time dateTime={kickoffAt}>{formatKickoff(kickoffAt)}</time>
          </CardDescription>
        </div>
        <Badge variant="outline" className="shrink-0 uppercase">
          {status}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-5 py-5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3 sm:gap-4">
          <div className="space-y-2 text-center">
            <p className="truncate text-xs font-medium uppercase tracking-wide text-neutral-500">
              {homeTeam}
            </p>
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
              aria-label={`Marcador local ${homeTeam}`}
              className={cn(
                'h-16 rounded-xl border-neutral-700 bg-neutral-900/80 text-center text-2xl font-bold tabular-nums text-neutral-50',
                'focus-visible:border-emerald-500/60 focus-visible:ring-emerald-500/30',
                'disabled:opacity-60'
              )}
            />
          </div>

          <span className="pb-5 text-sm font-bold text-neutral-500">—</span>

          <div className="space-y-2 text-center">
            <p className="truncate text-xs font-medium uppercase tracking-wide text-neutral-500">
              {awayTeam}
            </p>
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
              aria-label={`Marcador visitante ${awayTeam}`}
              className={cn(
                'h-16 rounded-xl border-neutral-700 bg-neutral-900/80 text-center text-2xl font-bold tabular-nums text-neutral-50',
                'focus-visible:border-emerald-500/60 focus-visible:ring-emerald-500/30',
                'disabled:opacity-60'
              )}
            />
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 border-t border-neutral-800/80 pt-4">
        <Button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="h-11 w-full rounded-xl text-sm font-semibold"
        >
          {loading ? 'Guardando...' : 'Guardar resultado'}
        </Button>

        {success ? (
          <p className="text-center text-xs font-medium text-emerald-300">
            Resultado guardado correctamente.
          </p>
        ) : null}

        {error ? (
          <p className="text-center text-xs text-red-300">{error}</p>
        ) : null}
      </CardFooter>
    </Card>
  )
}
