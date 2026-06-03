'use client'

import { useState } from 'react'
import { createLeague } from './actions'

export default function CreateLeaguePage() {
  const [leagueName, setLeagueName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreateLeague = async () => {
    try {
      setLoading(true)

      const result = await createLeague(leagueName)

      if (result.error) {
        alert(result.error)
        return
      }

      alert('League created successfully')
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-xl p-10">
      <h1 className="mb-6 text-3xl font-bold">Create League</h1>

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
          {loading ? 'Creating...' : 'Create League'}
        </button>
      </div>
    </main>
  )
}
