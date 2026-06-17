'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [fullName, setFullName]   = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
          <div className="auth-title" style={{ marginBottom: 12 }}>Vérifiez votre email</div>
          <div className="auth-success">
            Un email de confirmation a été envoyé à <strong>{email}</strong>.
            Cliquez sur le lien pour activer votre compte.
          </div>
          <div className="auth-divider" style={{ marginTop: 20 }}>
            <Link href="/auth/login" className="auth-link">← Retour à la connexion</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">♠</div>
          <div>
            <div className="auth-logo-text">PokerPro Suite</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>Créez votre compte</div>
          </div>
        </div>

        <div className="auth-title">Créer un compte</div>
        <div className="auth-subtitle">Commencez gratuitement, passez Premium quand vous voulez</div>

        {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

        <form className="auth-form" onSubmit={handleRegister}>
          <div className="auth-field">
            <label>Prénom (optionnel)</label>
            <input
              type="text"
              placeholder="Votre prénom"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              autoComplete="given-name"
            />
          </div>

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
              placeholder="Minimum 8 caractères"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="auth-btn auth-btn-primary" disabled={loading}>
            {loading ? <><span className="loading-spinner" />Création…</> : '→ Créer mon compte'}
          </button>
        </form>

        {/* Plans preview */}
        <div style={{
          marginTop: 20,
          padding: '12px 14px',
          background: 'var(--bg3)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border2)',
          fontSize: 11,
          color: 'var(--text2)',
          lineHeight: 1.7,
        }}>
          🆓 Compte gratuit créé. Abonnez-vous ensuite :<br />
          🔵 <strong style={{ color: 'var(--blue)' }}>Standard 10€/mois</strong> — Outils de base<br />
          ⭐ <strong style={{ color: 'var(--gold)' }}>Premium 25€/mois</strong> — Analytics complète + IA
        </div>

        <div className="auth-divider" style={{ marginTop: 16 }}>
          Déjà un compte ?{' '}
          <Link href="/auth/login" className="auth-link">Se connecter</Link>
        </div>
      </div>
    </div>
  )
}
