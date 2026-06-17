'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/types'

export function useUser() {
  const [user, setUser]       = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function getUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { setLoading(false); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      setUser(profile as UserProfile || null)
      setLoading(false)
    }

    getUser()

    // Écoute les changements d'auth en temps réel
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
      } else {
        getUser()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const isPremium = user?.plan === 'premium' && user?.subscription_status === 'active'
  const isStandard = user?.plan === 'standard' && user?.subscription_status === 'active'

  return { user, loading, isPremium, isStandard }
}
