
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export default function JoinLeagueButton({
  leagueId,
  alreadyJoined,
  isAuthed,
  inviteCode,
}: {
  leagueId: string
  alreadyJoined: boolean
  isAuthed: boolean
  inviteCode: string
}) {

  const router = useRouter()

  const supabase = createClient()

  const [loading, setLoading] = useState(false)

  const [error, setError] = useState('')

  const handleJoinLeague = async () => {

    try {

      setLoading(true)

      setError('')

      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {

        setError('Usuario no autenticado')

        return
      }

      const { data: dbUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (!dbUser) {

        setError('Perfil no encontrado')

        return
      }

      const { data: existingMember } = await supabase
        .from('league_members')
        .select('id')
        .eq('league_id', leagueId)
        .eq('user_id', dbUser.id)
        .maybeSingle()

      if (existingMember) {

        setError('Ya perteneces a esta liga')

        return
      }

      const { error: insertError } = await supabase
        .from('league_members')
        .insert({
          league_id: leagueId,
          user_id: dbUser.id
        })

      if (insertError) {

        setError('Error al unirse a la liga')

        return
      }

      router.push('/dashboard')

      router.refresh()

    } catch (err) {

      console.error(err)

      setError('Ocurrió un error inesperado')

    } finally {

      setLoading(false)
    }
  }
  console.log('JOIN BUTTON inviteCode:', inviteCode)
  
  if (!isAuthed) {

    return (
      <div className="space-y-3">

        <Button asChild className="w-full rounded-xl">
        <Link href={`/login?next=/join/${inviteCode}`}>
            Iniciar sesión para unirme
          </Link>
        </Button>

        <p className="text-center text-xs text-neutral-400">
          Debes iniciar sesión para unirte a esta liga.
        </p>

      </div>
    )
  }

  if (alreadyJoined) {

    return (
      <div className="space-y-3">

        <Button disabled className="w-full rounded-xl">
          Ya estás dentro
        </Button>

        <p className="text-center text-xs text-emerald-300/90">
          Ya eres miembro de esta liga.
        </p>
        <Button
        asChild
        variant="secondary"
        className="w-full rounded-xl"
      >
        <Link href="/dashboard">
          Ir al dashboard
        </Link>
      </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">

      <Button
        onClick={handleJoinLeague}
        disabled={loading}
        className="w-full rounded-xl"
      >
        {loading
          ? 'Uniéndote...'
          : 'Unirme al torneo'}
      </Button>

      {error ? (
        <p className="text-center text-xs text-red-300">
          {error}
        </p>
      ) : null}

    </div>
  )
}

