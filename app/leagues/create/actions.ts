'use server'

import { createClient } from '@/lib/supabase/server'
import { buildDefaultScoringRules } from '@/lib/leagues/default-scoring-rules'
import { generateInviteCode } from '@/lib/utils/generateInviteCode'
import { redirect } from 'next/navigation'


export type CreateLeagueResult = {
  error?: string
  success?: boolean
}

type CreateLeagueInput = {
  name: string
  description: string
  tournamentId: string
}

export async function getTournaments() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tournaments')
    .select(`
      id,
      name
    `)
    .eq('is_active', true)
    .order('start_date')

  if (error) {
    console.error(error)
    return []
  }

  return data ?? []
}


export async function createLeague(input: CreateLeagueInput): Promise<CreateLeagueResult> {
  const leagueName = input.name.trim()
  const description = input.description.trim()

  if (!leagueName) {
    return { error: 'El nombre del torneo es obligatorio.' }
  }

  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'User not authenticated' }
  }

  const { data: dbUser, error: dbUserError } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', user.id)
    .single<{ id: string }>()

  if (dbUserError || !dbUser) {
    return { error: 'User profile not found' }
  }

  const inviteCode = generateInviteCode()

  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .insert({
      name: leagueName,
      description:description || null,
      owner_user_id: dbUser.id,
      invite_code: inviteCode,
      tournament_id: input.tournamentId
    })
    .select('id')
    .single<{ id: string }>()

  if (leagueError || !league) {
    console.error(leagueError)
    return { error: 'Error creating league' }
  }

  const { error: memberError } = await supabase.from('league_members').insert({
    league_id: league.id,
    user_id: dbUser.id,
  })

  if (memberError) {
    console.error(memberError)
    return { error: 'Error creating league' }
  }

  const defaultRules = buildDefaultScoringRules(league.id)

  const { error: scoringError } = await supabase
    .from('league_scoring_rules')
    .upsert(defaultRules, {
      onConflict: 'league_id,stage',
      ignoreDuplicates: true,
    })

  if (scoringError) {
    console.error(scoringError)
    return { error: 'Error creating league scoring rules' }
  }

 // return { success: true }
    redirect('/dashboard')

}
