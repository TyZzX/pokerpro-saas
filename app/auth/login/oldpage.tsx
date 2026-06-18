'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'Email ou mot de passe incorrect.'
          : error.message
      )
      setLoading(false)
      return
    }

    // Session bien créée → redirect dashboard
    if (data.session) {
      window.location.replace('/dashboard')
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">♠</div>
          <div>
            <div className="auth-logo-text">PokerPro Suite</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>
              Entraînement Texas Hold'em
            </div>
          </div>
        </div>

        <div className="auth-title">Connexion</div>
        <div className="auth-subtitle">Accédez à votre espace d'entraînement</div>

        {error && (
          <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>
        )}

        <form className="auth-form" onSubmit={handleLogin}>
          <div className="auth-field">
            <label>Adresse email</label>
            <input
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="auth-field">
            <label>Mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="auth-btn auth-btn-primary" disabled={loading}>
            {loading ? <><span className="loading-spinner" /> Connexion…</> : '→ Se connecter'}
          </button>
        </form>

        <div className="auth-divider" style={{ marginTop: 20 }}>
          Pas encore de compte ?{' '}
          <Link href="/auth/register" className="auth-link">Créer un compte</Link>
        </div>
      </div>
    </div>
  )
}
