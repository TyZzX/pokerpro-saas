'use client'

/**
 * PokerApp — Composant principal de l'application poker
 * 
 * Ce composant encapsule l'application poker existante.
 * Il reçoit le profil utilisateur du serveur (vérifié côté serveur)
 * et contrôle l'accès aux fonctionnalités Standard/Premium.
 * 
 * Le design et la logique restent IDENTIQUES à l'app originale.
 * Seul le plan vient maintenant du backend (Supabase) et non d'un toggle local.
 */

import { useEffect, useRef } from 'react'
import type { UserProfile } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  user: UserProfile
}

export default function PokerApp({ user }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const router = useRouter()
  const isPremium = user.plan === 'premium' && user.subscription_status === 'active'

  // Communique le plan à l'iframe de l'app originale via postMessage
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

    iframe.addEventListener('load', handleLoad)

    // Listen for messages FROM the poker app (e.g., upgrade request)
    function handleMessage(e: MessageEvent) {
      if (e.data?.type === 'POKERPRO_UPGRADE') {
        router.push('/upgrade')
      }
      if (e.data?.type === 'POKERPRO_LOGOUT') {
        handleLogout()
      }
    }

    window.addEventListener('message', handleMessage)
    return () => {
      iframe.removeEventListener('load', handleLoad)
      window.removeEventListener('message', handleMessage)
    }
  }, [isPremium, user, router])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Topbar de session — en dehors de l'iframe pour sécurité */}
      <div style={{
        background: 'var(--bg2)',
        borderBottom: '1px solid var(--border)',
        padding: '0 16px',
        height: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        fontSize: 11,
        zIndex: 1000,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--text3)' }}>
            Connecté : <span style={{ color: 'var(--text2)' }}>{user.email}</span>
          </span>
          <span
            className={`badge ${isPremium ? 'badge-gold' : 'badge-blue'}`}
            style={{ fontSize: 9 }}
          >
            {isPremium ? '⭐ Premium' : '🔵 Standard'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!isPremium && (
            <a
              href="/upgrade"
              style={{
                background: 'linear-gradient(90deg,#FFB800,#FF8C00)',
                color: '#000',
                padding: '3px 10px',
                borderRadius: 20,
                fontSize: 10,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              ⭐ Passer Premium
            </a>
          )}
          {isPremium && (
            <a
              href="/api/stripe/portal"
              style={{ color: 'var(--text3)', fontSize: 10 }}
            >
              Gérer l'abonnement
            </a>
          )}
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text3)',
              cursor: 'pointer',
              fontSize: 11,
              padding: '3px 6px',
            }}
          >
            Déconnexion
          </button>
        </div>
      </div>

      {/* L'app poker dans une iframe — design 100% préservé */}
      <iframe
        ref={iframeRef}
        src={isPremium ? '/poker-app-premium.html' : '/poker-app-standard.html'}
        style={{
          flex: 1,
          border: 'none',
          width: '100%',
        }}
        title="PokerPro Suite"
        allow="clipboard-write"
      />
    </div>
  )
}
