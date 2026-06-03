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
  owner_user_id: string
}

type MemberUser = {
  display_name: string
  email: string
}

type MemberRow = {
  user_id: string
  joined_at: string
  users: MemberUser | MemberUser[] | null
}

function unwrapUser(
  user: MemberUser | MemberUser[] | null
): MemberUser | null {
  if (!user) return null

  return Array.isArray(user)
    ? (user[0] ?? null)
    : user
}

function formatJoinedAt(isoDate: string) {
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Bogota',
  }).format(new Date(isoDate))
}

export default async function LeagueMembersPage({
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

  const { data: members, error } = await supabase
    .from('league_members')
    .select(`
      user_id,
      joined_at,
      users (
        display_name,
        email
      )
    `)
    .eq('league_id', id)
    .order('joined_at', {
      ascending: true,
    })

  if (error) {
    return (
      <div className="p-6 text-red-400">
        Error cargando miembros
      </div>
    )
  }

  const memberList =
    (members as MemberRow[] | null) ?? []

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
              Miembros
            </p>

            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {league.name}
            </h1>

            <p className="text-sm text-neutral-400">
              {memberList.length} miembro
              {memberList.length !== 1 ? 's' : ''} en esta liga
            </p>
          </div>
        </header>

        <Card className="border-neutral-800 bg-neutral-950 text-neutral-50">
          <CardHeader>
            <CardTitle>
              Miembros
            </CardTitle>
          </CardHeader>

          <CardContent>
            {!memberList.length ? (
              <p className="text-sm text-neutral-400">
                No hay miembros registrados.
              </p>
            ) : (
              <div className="space-y-3">

                {memberList.map((member) => {
                  const user = unwrapUser(
                    member.users
                  )

                  const isOwner =
                    member.user_id ===
                    league.owner_user_id

                  return (
                    <div
                      key={member.user_id}
                      className={`flex items-center justify-between rounded-xl border p-4 transition-colors ${
                        isOwner
                          ? 'border-emerald-500/60 bg-emerald-500/10'
                          : 'border-neutral-800 bg-neutral-900/70'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {user?.display_name ??
                            'Usuario'}
                        </p>

                        <p className="text-xs text-neutral-400">
                          {isOwner
                            ? 'Administrador'
                            : 'Miembro'}
                        </p>

                        <p className="text-xs text-neutral-500">
                          Desde{' '}
                          {formatJoinedAt(
                            member.joined_at
                          )}
                        </p>
                      </div>

                      <div className="text-xl">
                        {isOwner
                          ? '👑'
                          : '👤'}
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