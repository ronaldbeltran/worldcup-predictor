'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface CopyInviteButtonProps {
  inviteCode: string
}

export function CopyInviteButton({
  inviteCode
}: CopyInviteButtonProps) {

  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {

    await navigator.clipboard.writeText(inviteCode)

    setCopied(true)

    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  return (
    <Button
      onClick={handleCopy}
      variant="secondary"
      className="w-full"
    >
      {copied
        ? 'Copied!'
        : 'Copy Invite Code'}
    </Button>
  )
}






