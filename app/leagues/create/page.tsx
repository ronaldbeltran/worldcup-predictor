'use client'

import { useEffect, useState } from 'react'
import {
  createLeague, getTournaments,} from './actions'
import Link from 'next/link'

import {
  DEFAULT_SCORING_BY_STAGE,
  SCORING_STAGES,
} from '@/lib/leagues/default-scoring-rules'

export default function CreateLeaguePage() {
  const [leagueName, setLeagueName] =
    useState('')
    const [description, setDescription] =
    useState('')

  const [loading, setLoading] =
    useState(false)

    const [tournamentId, setTournamentId] =
    useState('')
    useEffect(() => {
      loadTournaments()
    }, [])


    const loadTournaments =
    async () => {
      const data =
        await getTournaments()
  
      setTournaments(data)
  
      if (
        data.length > 0 &&
        !tournamentId
      ) {
        setTournamentId(data[0].id)
      }
    }




  const handleCreateLeague =
    async () => {
      try {
        setLoading(true)

        const result =
          await createLeague({
            name: leagueName,
            description,
            tournamentId,}
          )

        if (result.error) {
          alert(result.error)
          return
        }

        alert(
          'Liga creada correctamente'
        )
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    type Tournament = {
      id: string
      name: string
    }

    const [tournaments, setTournaments] =
  useState<Tournament[]>([])

  const STAGE_LABELS: Record<string, string> = {
    group: 'Grupos',
    round_32: '32avos',
    round_16: '16avos',
    quarterfinal: 'Cuartos',
    semifinal: 'Semifinal',
    third_place: 'Tercer Puesto',
    final: 'Final',
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-950 to-neutral-900 text-neutral-50">
      <div className="container mx-auto space-y-6 py-6">

        <header className="space-y-4">

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400 transition hover:text-neutral-200"
          >
            <span aria-hidden>←</span>
            Volver a mis ligas
          </Link>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400/90">
              Mundial 2026
            </p>

            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Crear liga
            </h1>

            <p className="text-sm text-neutral-400">
              Crea una nueva liga privada y comparte
              el código de invitación con tus amigos.
            </p>
          </div>

        </header>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6">

          <div className="space-y-4">

            <div>
              <label
                htmlFor="league-name"
                className="mb-2 block text-sm font-medium text-neutral-300"
              >
                Nombre de la liga
              </label>

              <input
                id="league-name"
                type="text"
                placeholder="Ej: Amigos Mundialistas"
                value={leagueName}
                onChange={(e) =>
                  setLeagueName(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-neutral-50 placeholder:text-neutral-500 focus:border-emerald-500 focus:outline-none"
              />

<div>
  <label
    htmlFor="description"
    className="mb-2 block text-sm font-medium text-neutral-300"
  >
    Descripción
  </label>

  <textarea
    id="description"
    placeholder="Describe el objetivo de la liga..."
    value={description}
    onChange={(e) =>
      setDescription(
        e.target.value
      )
    }
    rows={3}
    className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-neutral-50 placeholder:text-neutral-500 focus:border-emerald-500 focus:outline-none"
  />
</div>

<div>
  <label
    htmlFor="tournament"
    className="mb-2 block text-sm font-medium text-neutral-300"
  >
    Torneo
  </label>

  <select
    id="tournament"
    value={tournamentId}
    onChange={(e) =>
      setTournamentId(
        e.target.value
      )
    }
    className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-3 text-neutral-50 focus:border-emerald-500 focus:outline-none"
  >
    {tournaments.map(
      (tournament) => (
        <option
          key={tournament.id}
          value={tournament.id}
        >
          {tournament.name}
        </option>
      )
    )}
  </select>
</div>

            </div>


            <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-4">
  <div className="mb-4">
    <h2 className="font-semibold">
      Reglas de puntuación
    </h2>

    <p className="text-sm text-neutral-400">
      Estas reglas se aplicarán automáticamente
      a la liga al momento de crearla.
      Los pronosticos se cierran 5 Minutos antes de iniciar el partido Zona horaria Colombia
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




            <button
              onClick={
                handleCreateLeague
              }
              disabled={
                loading ||
                !leagueName.trim() || !tournamentId
              }
              className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? 'Creando liga...'
                : 'Crear liga'}
            </button>

          </div>

        </div>

      </div>
    </main>
  )
}