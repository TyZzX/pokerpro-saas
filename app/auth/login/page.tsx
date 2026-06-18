'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const PLANS = [
  {
    name: 'Démo',
    price: 'Gratuit',
    period: '1 mois',
    color: '#34D399',
    badge: '🎁 GRATUIT',
    features: ["Calculateur d'équité", 'Cotes du pot', 'Analyseur de flop', 'Ranges Calamusa', 'Quiz interactif'],
    highlight: false,
  },
  {
    name: 'Standard',
    price: '10€',
    period: '/mois · 1er mois offert',
    color: '#3D9EFF',
    badge: '🔵 STANDARD',
    features: ['Tout le plan Démo', 'Éditeur de ranges', 'Spots GTO', 'Historique sessions', 'Support prioritaire'],
    highlight: false,
  },
  {
    name: 'Premium',
    price: '25€',
    period: '/mois · 1er mois à 10€',
    color: '#FFB800',
    badge: '⭐ PREMIUM',
    features: ['Tout Standard', 'HUD Joueurs', 'Import de mains', 'Analyse leaks IA', 'Coach IA', 'Statistiques tracker'],
    highlight: true,
  },
]

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [tab, setTab]           = useState<'login' | 'register'>('login')
  const [sent, setSent]         = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message === 'Invalid login credentials' ? 'Email ou mot de passe incorrect.' : error.message)
      setLoading(false)
      return
    }
    if (data.session) window.location.replace('/dashboard')
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    if (password.length < 8) { setError('Mot de passe trop court (8 caractères minimum).'); setLoading(false); return }
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  if (sent) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div className="auth-card" style={{ textAlign:'center', maxWidth:420 }}>
        <div style={{ fontSize:48, marginBottom:16 }}>✉️</div>
        <div className="auth-title">Vérifiez votre email</div>
        <div className="auth-success" style={{ marginTop:12 }}>
          Email de confirmation envoyé à <strong>{email}</strong>.<br/>Cliquez sur le lien pour activer votre compte.
        </div>
        <button onClick={() => { setSent(false); setTab('login') }}
          style={{ marginTop:20, background:'none', border:'none', color:'var(--jade)', cursor:'pointer', fontSize:13 }}>
          ← Retour à la connexion
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', backgroundImage:'radial-gradient(ellipse at 50% 0%, rgba(0,212,170,0.07) 0%, transparent 60%)', display:'flex', flexDirection:'column', alignItems:'center', padding:'32px 16px' }}>

      {/* Logo */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:28 }}>
        <div style={{ width:44, height:44, borderRadius:11, background:'linear-gradient(135deg,#00D4AA,#006655)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, boxShadow:'0 0 20px rgba(0,212,170,0.3)' }}>♠</div>
        <div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:18, fontWeight:700, color:'var(--jade)' }}>PokerPro Suite</div>
          <div style={{ fontSize:11, color:'var(--text3)' }}>Entraînement Texas Hold'em professionnel</div>
        </div>
      </div>

      {/* Plans */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))', gap:12, width:'100%', maxWidth:820, marginBottom:28 }}>
        {PLANS.map(plan => (
          <div key={plan.name} style={{ background: plan.highlight ? 'linear-gradient(135deg,rgba(255,184,0,0.08),var(--bg2))' : 'var(--bg2)', border:`1px solid ${plan.highlight ? 'rgba(255,184,0,0.35)' : 'var(--border)'}`, borderRadius:12, padding:'16px 14px', position:'relative' }}>
            {plan.highlight && (
              <div style={{ position:'absolute', top:-10, left:'50%', transform:'translateX(-50%)', background:'linear-gradient(90deg,#FFB800,#FF8C00)', color:'#000', fontSize:9, fontWeight:700, padding:'3px 12px', borderRadius:20 }}>RECOMMANDÉ</div>
            )}
            <div style={{ fontSize:9, fontWeight:700, color:plan.color, marginBottom:5, letterSpacing:'0.1em' }}>{plan.badge}</div>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:3 }}>{plan.name}</div>
            <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:10 }}>
              <span style={{ fontSize:22, fontWeight:700, color:plan.color, fontFamily:'var(--font-mono)' }}>{plan.price}</span>
              <span style={{ fontSize:10, color:'var(--text3)' }}>{plan.period}</span>
            </div>
            <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:5 }}>
              {plan.features.map(f => (
                <li key={f} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--text2)' }}>
                  <span style={{ color:plan.color, fontWeight:700 }}>✓</span> {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Form */}
      <div className="auth-card" style={{ width:'100%', maxWidth:420 }}>
        {/* Tabs */}
        <div style={{ display:'flex', background:'var(--bg3)', borderRadius:8, padding:3, marginBottom:20, gap:3 }}>
          {(['login','register'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setError('') }} style={{ flex:1, padding:'8px 0', borderRadius:6, border:'none', background: tab===t ? 'var(--jade)' : 'transparent', color: tab===t ? '#06090F' : 'var(--text2)', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'var(--font-body)', transition:'all 0.15s' }}>
              {t === 'login' ? 'Se connecter' : 'Créer un compte'}
            </button>
          ))}
        </div>

        {error && <div className="auth-error" style={{ marginBottom:14 }}>{error}</div>}

        {tab === 'login' ? (
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="auth-field">
              <label>Email</label>
              <input type="email" placeholder="vous@exemple.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="auth-field">
              <label>Mot de passe</label>
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
            </div>
            <div style={{ textAlign:'right', marginTop:-8, marginBottom:8 }}>
              <Link href="/auth/forgot-password" style={{ fontSize:11, color:'var(--text3)' }}>Mot de passe oublié ?</Link>
            </div>
            <button type="submit" className="auth-btn auth-btn-primary" disabled={loading}>
              {loading ? <><span className="loading-spinner" /> Connexion…</> : '→ Se connecter'}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRegister}>
            <div className="auth-field">
              <label>Prénom (optionnel)</label>
              <input type="text" placeholder="Votre prénom" value={fullName} onChange={e => setFullName(e.target.value)} autoComplete="given-name" />
            </div>
            <div className="auth-field">
              <label>Email</label>
              <input type="email" placeholder="vous@exemple.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="auth-field">
              <label>Mot de passe</label>
              <input type="password" placeholder="Minimum 8 caractères" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" />
            </div>
            <button type="submit" className="auth-btn auth-btn-primary" disabled={loading}>
              {loading ? <><span className="loading-spinner" /> Création…</> : '→ Créer mon compte gratuit'}
            </button>
            <div style={{ fontSize:11, color:'var(--text3)', textAlign:'center', marginTop:4 }}>🎁 1 mois gratuit · Aucune carte bancaire requise</div>
          </form>
        )}
      </div>

      <div style={{ marginTop:16, fontSize:11, color:'var(--text3)', textAlign:'center' }}>
        🔒 Connexion sécurisée · Données chiffrées · support@pokerpro.app
      </div>
    </div>
  )
}
