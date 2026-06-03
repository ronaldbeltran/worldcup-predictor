import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import JoinLeagueButton from './JoinLeagueButton'

type League = {
  id: string
  name: string
  invite_code: string
  owner_user_id: string
  created_at: string
}

type UserRow = {
  id: string
  display_name: string | null
}

function formatCreatedAt(isoDate: string) {
  return new Intl.DateTimeFormat('es', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(isoDate))
}

type JoinPageProps = {
  params: Promise<{
    inviteCode: string
  }>
}

export default async function JoinLeaguePage({ params }: JoinPageProps) {
  const { inviteCode } = await params
  const supabase = await createClient()

  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('id, name, invite_code, owner_user_id, created_at')
    .eq('invite_code', inviteCode)
    .single<League>()

  if (leagueError || !league) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-950 to-neutral-900 text-neutral-50">
        <div className="mx-auto flex w-full max-w-lg flex-col px-4 pb-12 pt-10 sm:px-6">
          <Card className="bg-neutral-950/70 text-neutral-50 ring-neutral-800">
            <CardHeader>
              <CardTitle className="text-base">Liga no encontrada</CardTitle>
              <CardDescription className="text-xs">
                El código de invitación no existe o ya no es válido.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl bg-neutral-900/70 p-4 text-xs text-neutral-300 ring-1 ring-neutral-800">
                Código: <span className="font-mono">{inviteCode}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  const [{ count: membersCount }, { data: owner }] = await Promise.all([
    supabase
      .from('league_members')
      .select('*', { count: 'exact', head: true })
      .eq('league_id', league.id),
    supabase
      .from('users')
      .select('id, display_name')
      .eq('id', league.owner_user_id)
      .single<UserRow>(),
  ])

  const ownerName =
    owner?.display_name && owner.display_name.trim().length > 0
      ? owner.display_name
      : 'Anónimo'

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  let isAuthed = Boolean(authUser)
  let alreadyJoined = false

  if (authUser) {
    const { data: dbUser } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', authUser.id)
      .single<{ id: string }>()

    if (dbUser?.id) {
      const { data: membership } = await supabase
        .from('league_members')
        .select('league_id')
        .eq('league_id', league.id)
        .eq('user_id', dbUser.id)
        .maybeSingle<{ league_id: string }>()

      alreadyJoined = Boolean(membership)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-950 to-neutral-900 text-neutral-50">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400/90">
            Unirse a liga
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {league.name}
          </h1>
          <p className="text-sm text-neutral-300">
            Estás a un paso de entrar al torneo. Revisa los detalles y confirma.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <Card className="bg-gradient-to-b from-neutral-900/80 to-neutral-950/90 text-neutral-50 ring-neutral-800">
            <CardHeader className="border-b border-neutral-800/80 pb-4">
              <CardTitle className="text-base">Información de la liga</CardTitle>
              <CardDescription className="text-xs text-neutral-400">
                Datos principales para confirmar el ingreso.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 py-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-neutral-900/80 p-4 ring-1 ring-neutral-800/80">
                  <p className="text-[11px] font-medium text-neutral-400">
                    Código de invitación
                  </p>
                  <p className="mt-1 font-mono text-base font-semibold tracking-widest text-emerald-400">
                    {league.invite_code}
                  </p>
                </div>

                <div className="rounded-xl bg-neutral-900/80 p-4 ring-1 ring-neutral-800/80">
                  <p className="text-[11px] font-medium text-neutral-400">
                    Creador
                  </p>
                  <p className="mt-1 text-sm font-semibold text-neutral-50">
                    {ownerName}
                  </p>
                </div>

                <div className="rounded-xl bg-neutral-900/80 p-4 ring-1 ring-neutral-800/80">
                  <p className="text-[11px] font-medium text-neutral-400">
                    Miembros
                  </p>
                  <p className="mt-1 text-xl font-semibold">
                    {typeof membersCount === 'number' ? membersCount : '—'}
                  </p>
                  <p className="mt-1 text-[11px] text-neutral-500">
                    Participantes actuales
                  </p>
                </div>

                <div className="rounded-xl bg-neutral-900/80 p-4 ring-1 ring-neutral-800/80">
                  <p className="text-[11px] font-medium text-neutral-400">
                    Creada
                  </p>
                  <p className="mt-1 text-sm font-semibold text-neutral-50">
                    {formatCreatedAt(league.created_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-950/70 text-neutral-50 ring-neutral-800 lg:sticky lg:top-6">
            <CardHeader>
              <CardTitle className="text-base">Confirmar ingreso</CardTitle>
              <CardDescription className="text-xs text-neutral-400">
                Al unirte, verás esta liga en tu dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <JoinLeagueButton
                leagueId={league.id}
                alreadyJoined={alreadyJoined}
                isAuthed={isAuthed}
              />

              <div className="rounded-xl bg-neutral-900/60 p-4 text-xs text-neutral-300 ring-1 ring-neutral-800">
                <p className="font-medium text-neutral-200">Tip</p>
                <p className="mt-1 text-neutral-400">
                  Si el botón falla, revisa que estés logueado y que el código de
                  invitación sea correcto.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

