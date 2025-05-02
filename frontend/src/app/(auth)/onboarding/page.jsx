'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export default function OnboardingRouterPage() {
  const router = useRouter()

  const handleRedirect = useCallback(() => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')

    if (!token || !role) {
      router.replace('/login')
      return
    }

    switch (role) {
      case 'GroupOwner':
        router.replace('/onboarding/groupowner')
        break
      case 'GroupSubscriber':
        router.replace('/onboarding/subscriber')
        break
      default:
        router.replace('/login') // fallback for unknown roles
    }
  }, [router])

  useEffect(() => {
    handleRedirect()
  }, [handleRedirect])

  return (
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <p>Redirecting...</p>
    </div>
  )
}
