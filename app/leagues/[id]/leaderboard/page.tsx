
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type LeaderboardRow = {
    league_id: string
    user_id: string
    display_name: string
    total_points: number
    exact_hits: number
    predictions_count: number
}

export default async function LeagueLeaderboardPage(
    { params, }: { params: Promise<{ id: string }> }) {
    const { id } = await params



    const supabase = await createClient()

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
        <div className="container mx-auto space-y-6 py-6">
            <Card className="bg-neutral-950 text-neutral-50 border-neutral-800">
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
                            {leaderboard.map((row: LeaderboardRow, index: number) => (
                                <div
                                    key={row.user_id}
                                    className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/70 p-4"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 text-lg font-bold text-neutral-400">
                                            #{index + 1}
                                        </div>

                                        <div>
                                            <p className="font-semibold">
                                                {row.display_name}
                                            </p>

                                            <p className="text-xs text-neutral-400">
                                                Exactos: {row.exact_hits} · Pronósticos:{' '}
                                                {row.predictions_count}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-2xl font-bold">
                                            {row.total_points}
                                        </p>

                                        <p className="text-xs text-neutral-400">
                                            pts
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
