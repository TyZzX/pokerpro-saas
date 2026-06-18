'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
          <div className="auth-title" style={{ marginBottom: 10 }}>Email envoyé !</div>
          <div className="auth-success" style={{ marginBottom: 20 }}>
            Un lien de réinitialisation a été envoyé à <strong>{email}</strong>.
            Vérifiez vos spams si vous ne le voyez pas.
          </div>
          <Link href="/auth/login" className="auth-link">← Retour à la connexion</Link>
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
            <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>Réinitialisation du mot de passe</div>
          </div>
        </div>

        <div className="auth-title">Mot de passe oublié</div>
        <div className="auth-subtitle">Entrez votre email pour recevoir un lien de réinitialisation</div>

        {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
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
          <button type="submit" className="auth-btn auth-btn-primary" disabled={loading}>
            {loading ? <><span className="loading-spinner" /> Envoi…</> : '→ Envoyer le lien'}
          </button>
        </form>

        <div className="auth-divider" style={{ marginTop: 16 }}>
          <Link href="/auth/login" className="auth-link">← Retour à la connexion</Link>
        </div>
      </div>
    </div>
  )
}
