'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PLANS } from '@/lib/stripe'
import type { UserProfile } from '@/types'
import Link from 'next/link'

export default function UpgradeClient() {
  const [user, setUser]       = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError]     = useState('')

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.replace('/auth/login'); return }
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setUser(profile as UserProfile)
    }
    load()
  }, [])

  const isPremium  = user?.plan === 'premium' && user?.subscription_status === 'active'
  const isStandard = user?.plan === 'standard' && user?.subscription_status === 'active'

  async function handleCheckout(planId: string) {
    setLoading(planId)
    setError('')
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
      const { url, error: e } = await res.json()
      if (e) throw new Error(e)
      window.location.href = url
    } catch (e: any) {
      setError(e.message)
      setLoading(null)
    }
  }

  if (!user) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#06090F' }}>
      <div style={{ width:32, height:32, border:'3px solid #162238', borderTopColor:'#00D4AA', borderRadius:'50%', animation:'spin .7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div className="upgrade-page">
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <Link href="/dashboard" style={{ color: 'var(--text3)', fontSize: 12 }}>← Retour à l'application</Link>
        </div>
        <div className="upgrade-header">
          <div style={{ fontSize: 40, marginBottom: 12 }}>♠</div>
          <div className="upgrade-title">Choisissez votre plan</div>
          <div className="upgrade-sub">Connecté : <strong>{user.email}</strong></div>
        </div>
        {error && <div className="auth-error" style={{ maxWidth:600, margin:'0 auto 24px' }}>{error}</div>}
        <div className="plans-grid">
          {PLANS.map(plan => {
            const isCurrent = (plan.plan === 'standard' && isStandard) || (plan.plan === 'premium' && isPremium)
            return (
              <div key={plan.id} className={`plan-card ${plan.plan === 'premium' ? 'popular' : ''}`}>
                {plan.plan === 'premium' && <div className="plan-badge">⭐ RECOMMANDÉ</div>}
                <div className="plan-name">{plan.name}</div>
                <div className="plan-price">{plan.price}€ <span>/ mois</span></div>
                <div className="plan-desc">{plan.description}</div>
                <ul className="plan-features">{plan.features.map(f => <li key={f}>{f}</li>)}</ul>
                {isCurrent
                  ? <div style={{ textAlign:'center', padding:10, background:'rgba(0,212,170,.1)', border:'1px solid rgba(0,212,170,.25)', borderRadius:'var(--radius-sm)', color:'var(--jade)', fontSize:12, fontWeight:600 }}>✓ Votre plan actuel</div>
                  : <button className={`plan-btn ${plan.plan==='premium'?'plan-btn-pro':'plan-btn-std'}`} onClick={() => handleCheckout(plan.id)} disabled={!!loading}>
                      {loading === plan.id ? 'Redirection…' : `S'abonner ${plan.name}`}
                    </button>
                }
              </div>
            )
          })}
        </div>
        {(isStandard || isPremium) && (
          <div style={{ textAlign:'center', marginTop:28 }}>
            <a href="/api/stripe/portal" className="btn btn-ghost btn-sm">⚙️ Gérer mon abonnement</a>
          </div>
        )}
      </div>
    </div>
  )
}
