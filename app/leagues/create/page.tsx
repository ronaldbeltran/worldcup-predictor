'use client'

import { useState } from 'react'
import Link from 'next/link'

import { createLeague } from './actions'

export default function CreateLeaguePage() {
  const [leagueName, setLeagueName] =
    useState('')

  const [loading, setLoading] =
    useState(false)

  const handleCreateLeague =
    async () => {
      try {
        setLoading(true)

        const result =
          await createLeague(
            leagueName
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
            </div>

            <button
              onClick={
                handleCreateLeague
              }
              disabled={
                loading ||
                !leagueName.trim()
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