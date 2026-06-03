
import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'
import { notFound } from 'next/navigation'

type LeaderboardRow = {
  league_id: string
  user_id: string
  display_name: string
  total_points: number
  exact_hits: number
  predictions_count: number
}

export default async function LeagueLeaderboardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: leaderboard, error } = await supabase
    .from('league_leaderboard')
    .select('*')
    .eq('league_id', id)
    .order('total_points', { ascending: false })
    .order('exact_hits', { ascending: false })


  if (error) {
    return (
      <div className="p-6 text-red-400">
        Error cargando leaderboard
      </div>
    )
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
              Ranking
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {id}
            </h1>
            <p className="text-sm text-neutral-400">
              Posiciones de la liga
            </p>
          </div>


        </header>
      <Card className="border-neutral-800 bg-neutral-950 text-neutral-50">
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
        </CardHeader>

        <CardContent>
          {!leaderboard?.length ? (
            <p className="text-sm text-neutral-400">
              No hay datos todavía.
            </p>
          ) : (
            <div className="space-y-3">
              {leaderboard.map(
                (row: LeaderboardRow, index: number) => {
                  const rankLabel =
                    index === 0
                      ? '🥇'
                      : index === 1
                        ? '🥈'
                        : index === 2
                          ? '🥉'
                          : `#${index + 1}`

                  const isCurrentUser =
                    user?.id === row.user_id

                  return (
                    <div
                      key={row.user_id}
                      className={`flex items-center justify-between rounded-xl border p-4 transition-colors ${
                        isCurrentUser
                          ? 'border-emerald-500/60 bg-emerald-500/10'
                          : 'border-neutral-800 bg-neutral-900/70'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 text-lg font-bold text-neutral-400">
                          {rankLabel}
                        </div>

                        <div>
                          <p className="font-semibold">
                            {row.display_name}

                            {isCurrentUser ? (
                              <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                                Tú
                              </span>
                            ) : null}
                          </p>

                          <p className="text-xs text-neutral-400">
                            Exactos: {row.exact_hits} ·
                            Pronósticos:{' '}
                            {row.predictions_count}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-3xl font-bold tracking-tight">
                          {row.total_points}

                          <span className="ml-1 text-sm font-medium text-neutral-400">
                            pts
                          </span>
                        </p>
                      </div>
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
