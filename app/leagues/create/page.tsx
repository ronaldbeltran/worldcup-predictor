'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { generateInviteCode } from '@/lib/utils/generateInviteCode'

export default function CreateLeaguePage() {

  const supabase = createClient()

  const [leagueName, setLeagueName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreateLeague = async () => {

    try {

      setLoading(true)

      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        alert('User not authenticated')
        return
      }

      const inviteCode = generateInviteCode()

      const { data: dbUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (!dbUser) {
        alert('User profile not found')
        return
      }

      const { data: league, error } = await supabase
        .from('leagues')
        .insert({
          name: leagueName,
          owner_user_id: dbUser.id,
          invite_code: inviteCode
        })
        .select()
        .single()

      if (error) {
        console.error(error)
        alert('Error creating league')
        return
      }

      await supabase
        .from('league_members')
        .insert({
          league_id: league.id,
          user_id: dbUser.id
        })

      alert('League created successfully')

    } catch (error) {

      console.error(error)

    } finally {

      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-xl p-10">

      <h1 className="mb-6 text-3xl font-bold">
        Create League
      </h1>

      <div className="flex flex-col gap-4">

        <input
          type="text"
          placeholder="League name"
          value={leagueName}
          onChange={(e) => setLeagueName(e.target.value)}
          className="rounded border p-3"
        />

        <button
          onClick={handleCreateLeague}
          disabled={loading}
          className="rounded bg-black px-4 py-3 text-white"
        >
          {loading
            ? 'Creating...'
            : 'Create League'
          }
        </button>

      </div>

    </main>
  )
}