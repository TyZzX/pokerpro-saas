'use client'

import { useEffect, useRef } from 'react'
import type { UserProfile } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  user: UserProfile
}

export default function PokerApp({ user }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const router    = useRouter()
  const isPremium = user.plan === 'premium' && user.subscription_status === 'active'

  // Envoie le plan à l'app HTML via postMessage dès que l'iframe est chargée
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    function handleLoad() {
      iframe?.contentWindow?.postMessage(
        {
          type: 'POKERPRO_INIT',
          plan: isPremium ? 'premium' : 'standard',
          user: {
            email: user.email,
            name: user.full_name || user.email.split('@')[0],
          },
        },
        '*'
      )
    }

    // Écoute les messages de l'app poker (demande upgrade, logout)
    function handleMessage(e: MessageEvent) {
      if (e.data?.type === 'POKERPRO_UPGRADE') router.push('/upgrade')
      if (e.data?.type === 'POKERPRO_LOGOUT')  handleLogout()
    }

    iframe.addEventListener('load', handleLoad)
    window.addEventListener('message', handleMessage)

    return () => {
      iframe.removeEventListener('load', handleLoad)
      window.removeEventListener('message', handleMessage)
    }
  }, [isPremium, user, router])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#06090F' }}>

      {/* ── Barre de session (hors iframe pour sécurité) ── */}
      <div style={{
        background: '#0B1220',
        borderBottom: '1px solid #0F1E35',
        padding: '0 16px',
        height: 38,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        fontSize: 11,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#7A90B8' }}>
            {user.full_name || user.email}
          </span>
          <span style={{
            background: isPremium ? 'rgba(255,184,0,.15)' : 'rgba(61,158,255,.12)',
            color: isPremium ? '#FFB800' : '#3D9EFF',
            border: `1px solid ${isPremium ? 'rgba(255,184,0,.3)' : 'rgba(61,158,255,.25)'}`,
            padding: '1px 8px',
            borderRadius: 20,
            fontSize: 9,
            fontWeight: 700,
          }}>
            {isPremium ? '⭐ Premium' : '🔵 Standard'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {!isPremium && (
            <a href="/upgrade" style={{
              background: 'linear-gradient(90deg,#FFB800,#FF8C00)',
              color: '#000', padding: '3px 10px', borderRadius: 20,
              fontSize: 10, fontWeight: 700, textDecoration: 'none',
            }}>
              ⭐ Passer Premium
            </a>
          )}
          {isPremium && (
            <a href="/api/stripe/portal" style={{ color: '#3A4E6A', fontSize: 10 }}>
              Gérer l'abonnement
            </a>
          )}
          <button onClick={handleLogout} style={{
            background: 'none', border: 'none', color: '#3A4E6A',
            cursor: 'pointer', fontSize: 11,
          }}>
            Déconnexion
          </button>
        </div>
      </div>

      {/* ── App poker HTML dans l'iframe ── */}
      {/* ⚠️  IMPORTANT : mets ton fichier PokerPro_Complet_v3.html dans public/
           sous le nom poker-app.html */}
      <iframe
        ref={iframeRef}
        src="/poker-app.html"
        style={{ flex: 1, border: 'none', width: '100%' }}
        title="PokerPro Suite"
        allow="clipboard-write"
      />
    </div>
  )
}
