'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState(false)

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <div className="auth-title">Mot de passe mis à jour !</div>
          <div className="auth-success" style={{ marginTop: 12 }}>
            Redirection vers votre espace…
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
            <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>Nouveau mot de passe</div>
          </div>
        </div>

        <div className="auth-title">Réinitialiser le mot de passe</div>
        <div className="auth-subtitle">Choisissez votre nouveau mot de passe</div>

        {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

        <form className="auth-form" onSubmit={handleReset}>
          <div className="auth-field">
            <label>Nouveau mot de passe</label>
            <input
              type="password"
              placeholder="Minimum 8 caractères"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <div className="auth-field">
            <label>Confirmer le mot de passe</label>
            <input
              type="password"
              placeholder="Répétez le mot de passe"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="auth-btn auth-btn-primary" disabled={loading}>
            {loading ? <><span className="loading-spinner" /> Mise à jour…</> : '→ Mettre à jour'}
          </button>
        </form>
      </div>
    </div>
  )
}
