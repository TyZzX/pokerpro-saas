'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import PokerApp from '@/components/poker/PokerApp'
import type { UserProfile } from '@/types'

export default function DashboardClient() {
  const [user, setUser]     = useState<UserProfile | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        window.location.replace('/auth/login')
        return
      }

      let { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (!profile) {
        const { data: created } = await supabase
          .from('profiles')
          .upsert({ id: session.user.id, email: session.user.email!, plan: 'free', subscription_status: 'inactive' })
          .select()
          .single()
        profile = created
      }

      if (!profile) { setStatus('error'); return }

      // ✅ PERIODE GRATUITE 2 MOIS
      // Tous les utilisateurs ont accès Premium gratuitement
      // Pour activer les abonnements payants dans 2 mois :
      // supprimez les 3 lignes ci-dessous
      const profileWithFreePremium = {
        ...profile,
        plan: 'premium' as const,
        subscription_status: 'active' as const,
      }

      setUser(profileWithFreePremium as UserProfile)
      setStatus('ready')
    }

    init()
  }, [])

  if (status === 'loading') return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#06090F', flexDirection:'column', gap:16 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:36, height:36, borderRadius:'50%', border:'3px solid #162238', borderTopColor:'#00D4AA', animation:'spin .7s linear infinite' }} />
      <div style={{ color:'#3A4E6A', fontSize:13 }}>Chargement…</div>
    </div>
  )

  if (status === 'error' || !user) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#06090F', flexDirection:'column', gap:12 }}>
      <div style={{ color:'#FF4560', fontSize:14 }}>Erreur de chargement</div>
      <button onClick={() => window.location.replace('/auth/login')} style={{ background:'#00D4AA', color:'#06090F', border:'none', padding:'10px 20px', borderRadius:6, cursor:'pointer', fontWeight:700 }}>
        Retour à la connexion
      </button>
    </div>
  )

  return <PokerApp user={user} />
}
