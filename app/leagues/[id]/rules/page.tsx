

import Link from 'next/link'

import {
  DEFAULT_SCORING_BY_STAGE,
  SCORING_STAGES,
} from '@/lib/leagues/default-scoring-rules'


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
  owner_user_id: string
}


const STAGE_LABELS: Record<string, string> = {
    group: 'Grupos',
    round_32: '32avos',
    round_16: '16avos',
    quarterfinal: 'Cuartos',
    semifinal: 'Semifinal',
    third_place: 'Tercer Puesto',
    final: 'Final',
  }

export default async function LeagueRulesPage({
    params,
  }: {
    params: Promise<{ id: string }>
  }) {
    const { id } = await params
  
    const supabase = await createClient()
  
    const { data: league, error: leagueError } =
      await supabase
        .from('leagues')
        .select(`
          id,
          name,
          owner_user_id
        `)
        .eq('id', id)
        .single<League>()
  
    if (leagueError || !league) {
      notFound()
    }
  
  
    return (
      <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-950 to-neutral-900 text-neutral-50">
        <div className="container mx-auto space-y-6 py-6">
  
          <header className="space-y-4">
            <Link
              href={`/leagues/${id}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400 transition hover:text-neutral-200"
            >
              <span aria-hidden>←</span>
              Volver a la liga
            </Link>
  
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400/90">
                Reglamento
              </p>
  
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {league.name}
              </h1>
  
            </div>
          </header>
  
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-4">
  <div className="mb-4">
    <h2 className="font-semibold">
      Reglas de puntuación
    </h2>

    <p className="text-sm text-neutral-400">
      Estas reglas se aplicarán automáticamente cuando el partido es finaliado 
    </p>
    <p className="text-sm text-neutral-400">
      Recuerda que los pronosticos se cierran 5 Minutos antes de iniciar el partido Zona horaria Colombia
    </p>
      <p className="text-sm text-neutral-400">
      Los pronosticos toma el resultado de los 90 minutos mas minutos de adicion, NO incluye tiempos suplementarios o penales
    </p>
  </div>

  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-neutral-800 text-neutral-400">
          <th className="py-2 text-left">
            Fase
          </th>

          <th className="px-2 py-2 text-center">
            Exacto
          </th>

          <th className="px-2 py-2 text-center">
            Ganador
          </th>

          <th className="px-2 py-2 text-center">
            Empate
          </th>

          <th className="px-2 py-2 text-center">
            Dif.
          </th>

          <th className="px-2 py-2 text-center">
            Local
          </th>

          <th className="px-2 py-2 text-center">
            Visita
          </th>
        </tr>
      </thead>

      <tbody>
        {SCORING_STAGES.map((stage) => {
          const rule =
            DEFAULT_SCORING_BY_STAGE[stage]

          return (
            <tr
              key={stage}
              className="border-b border-neutral-900"
            >
              <td className="py-2 font-medium">
                {STAGE_LABELS[stage]}
              </td>

              <td className="text-center">
                {rule.exact_score_points}
              </td>

              <td className="text-center">
                {rule.winner_points}
              </td>

              <td className="text-center">
                {rule.draw_points}
              </td>

              <td className="text-center">
                {
                  rule.goal_difference_points
                }
              </td>

              <td className="text-center">
                {rule.home_goals_points}
              </td>

              <td className="text-center">
                {rule.away_goals_points}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  </div>
</div>






        </div>
      </main>
    )
  }