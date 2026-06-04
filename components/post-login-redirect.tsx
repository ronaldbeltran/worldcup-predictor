'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PostLoginRedirect() {
  const router = useRouter()

  useEffect(() => {
    const redirectTo =
      sessionStorage.getItem('post_login_redirect')

    if (!redirectTo) return

    sessionStorage.removeItem(
      'post_login_redirect'
    )

    router.replace(redirectTo)
  }, [router])

  return null
}