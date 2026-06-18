'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

// ============================================================
// DATE DE FIN BÊTA — À modifier dans 1 mois
// Cherchez "BETA_END" dans ce fichier pour la retrouver
// ============================================================
const BETA_END = new Date('2026-07-18T23:59:59')

const PLANS = [
  {
    name: 'Démo', price: 'Gratuit', period: '1 mois sans engagement',
    color: '#34D399', badge: '🎁 DÉMO',
    features: ["Calculateur d'équité", 'Cotes du pot', 'Analyseur de flop', 'Ranges Calamusa', 'Quiz interactif'],
    highlight: false,
  },
  {
    name: 'Standard', price: '10€', period: '/mois · 1er mois offert',
    color: '#3D9EFF', badge: '🔵 STANDARD',
    features: ['Tout Démo', 'Éditeur de ranges', 'Spots GTO', 'Historique', 'Support prioritaire'],
    highlight: false,
  },
  {
    name: 'Premium', price: '25€', period: '/mois · 1er mois à 10€',
    color: '#FFB800', badge: '⭐ PREMIUM',
    features: ['Tout Standard', 'HUD Joueurs', 'Import de mains', 'Analyse leaks IA', 'Coach IA', 'Stats tracker'],
    highlight: true,
  },
]

function Countdown() {
  const [time, setTime] = useState({ d: '00', h: '00', m: '00' })

  useEffect(() => {
    function tick() {
      const diff = BETA_END.getTime() - Date.now()
      if (diff <= 0) return
      setTime({
        d: String(Math.floor(diff / 86400000)).padStart(2, '0'),
        h: String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0'),
        m: String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0'),
      })
    }
    tick()
    const id = setInterval(tick, 60000)
    return () => clearInterval(id)
  }, [])

  const isBetaActive = BETA_END.getTime() > Date.now()
  if (!isBetaActive) return null

  return (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
      {[['d','j'], ['h','h'], ['m','m']].map(([key, lbl], i) => (
        <div key={key} style={{ display:'flex', alignItems:'center', gap:6 }}>
          {i > 0 && <span style={{ color:'#162840', fontSize:14 }}>:</span>}
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:'monospace', fontSize:14, fontWeight:700, color:'#00D4AA', lineHeight:1 }}>
              {time[key as 'd'|'h'|'m']}
            </div>
            <div style={{ fontSize:8, color:'#3A4E6A', textTransform:'uppercase' }}>{lbl}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

const Logo = () => (
  <svg width="48" height="48" viewBox="0 0 52 52" fill="none">
    <rect width="52" height="52" rx="13" fill="#0B1220"/>
    <rect x="1" y="1" width="50" height="50" rx="12" stroke="#00D4AA" strokeWidth="0.75" strokeOpacity="0.4"/>
    <path d="M26 10C26 10 18 17 18 23C18 27.4 21.6 31 26 31C30.4 31 34 27.4 34 23C34 17 26 10 26 10Z" fill="#00D4AA" opacity="0.9"/>
    <path d="M22 28C18 29 14 32 14 37H38C38 32 34 29 30 28" stroke="#00D4AA" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6"/>
    <text x="26" y="25" textAnchor="middle" dominantBaseline="middle" fontFamily="monospace" fontSize="13" fontWeight="700" fill="#06090F">♠</text>
    <circle cx="26" cy="39" r="2.5" fill="#00D4AA" opacity="0.5"/>
  </svg>
)

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [tab, setTab]           = useState<'login' | 'register'>('login')
  const [sent, setSent]         = useState(false)
  const isBetaActive = BETA_END.getTime() > Date.now()

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
    <div style={{ minHeight:'100vh', background:'#06090F', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#0B1220', border:'1px solid #0F1E35', borderRadius:14, padding:32, maxWidth:400, width:'100%', textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>✉️</div>
        <div style={{ fontSize:20, fontWeight:700, color:'#EEF2FF', marginBottom:12 }}>Vérifiez votre email</div>
        <div style={{ background:'rgba(0,212,170,0.1)', border:'1px solid rgba(0,212,170,0.25)', borderRadius:6, padding:'10px 12px', fontSize:12, color:'#00D4AA', lineHeight:1.7 }}>
          Email envoyé à <strong>{email}</strong>.<br/>Cliquez sur le lien pour activer votre compte.
        </div>
        <button onClick={() => { setSent(false); setTab('login') }}
          style={{ marginTop:20, background:'none', border:'none', color:'#00D4AA', cursor:'pointer', fontSize:13 }}>
          ← Retour à la connexion
        </button>
      </div>
    </div>
  )

  const inputStyle: React.CSSProperties = {
    width:'100%', background:'#101A2E', border:'1px solid #162840',
    borderRadius:6, color:'#EEF2FF', fontSize:13, padding:'10px 12px',
    fontFamily:'inherit', outline:'none',
  }
  const labelStyle: React.CSSProperties = {
    display:'block', fontSize:9, fontWeight:700, color:'#7A90B8',
    marginBottom:4, textTransform:'uppercase', letterSpacing:'0.08em',
  }

  return (
    <div style={{ background:'#06090F', minHeight:'100vh', fontFamily:"'Inter',sans-serif" }}>

      {/* ── Bandeau bêta ── */}
      {isBetaActive && (
        <div style={{ background:'#001F18', borderBottom:'1px solid rgba(0,212,170,0.15)', padding:'8px 20px', display:'flex', alignItems:'center', justifyContent:'center', gap:10, flexWrap:'wrap' }}>
          <div style={{ width:6, height:6, background:'#00D4AA', borderRadius:'50%', animation:'pulse 2s infinite' }} />
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
          <span style={{ fontSize:12, color:'#7A90B8' }}>
            <strong style={{ color:'#00D4AA' }}>Bêta ouverte</strong> — Accès Premium gratuit pour les premiers inscrits
          </span>
          <span style={{ fontSize:10, color:'#3A4E6A', background:'#101A2E', padding:'2px 8px', borderRadius:20, border:'1px solid #162840' }}>
            Jusqu'au 18 juillet 2026
          </span>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'56px 16px 40px', backgroundImage:'radial-gradient(ellipse at 50% 0%, rgba(0,212,170,0.06) 0%, transparent 55%)' }}>

        {/* ── Logo ── */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
          <Logo />
          <div>
            <div style={{ fontFamily:'monospace', fontSize:19, fontWeight:700, color:'#00D4AA', lineHeight:1.1 }}>PokerPro Suite</div>
            <div style={{ fontSize:10, color:'#3A4E6A', marginTop:2 }}>Entraînement Texas Hold'em professionnel</div>
          </div>
        </div>

        {/* ── Barre bêta compacte ── */}
        {isBetaActive && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, background:'#060D08', border:'1px solid rgba(0,212,170,0.18)', borderRadius:8, padding:'10px 14px', width:'100%', maxWidth:400, marginBottom:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ background:'rgba(0,212,170,0.12)', color:'#00D4AA', fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:20, border:'1px solid rgba(0,212,170,0.2)', whiteSpace:'nowrap' }}>
                🎁 BÊTA
              </span>
              <span style={{ fontSize:11, color:'#7A90B8' }}>
                Fonctionnalités <strong style={{ color:'#EEF2FF' }}>Premium offertes</strong>
              </span>
            </div>
            <Countdown />
          </div>
        )}

        {/* ── Formulaire ── */}
        <div style={{ background:'#0B1220', border:'1px solid #0F1E35', borderRadius:12, padding:22, width:'100%', maxWidth:400, marginBottom:32 }}>
          <div style={{ display:'flex', background:'#101A2E', borderRadius:7, padding:3, marginBottom:18, gap:3 }}>
            {(['login','register'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setError('') }} style={{
                flex:1, padding:'8px 0', borderRadius:5, border:'none',
                background: tab===t ? '#00D4AA' : 'transparent',
                color: tab===t ? '#06090F' : '#7A90B8',
                fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
              }}>
                {t === 'login' ? 'Se connecter' : 'Créer un compte'}
              </button>
            ))}
          </div>

          {error && (
            <div style={{ background:'rgba(255,69,96,0.1)', border:'1px solid rgba(255,69,96,0.3)', borderRadius:6, padding:'10px 12px', fontSize:12, color:'#FF4560', marginBottom:14 }}>
              {error}
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:13 }}>
              <div><label style={labelStyle}>Email</label>
                <input type="email" placeholder="vous@exemple.com" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} /></div>
              <div><label style={labelStyle}>Mot de passe</label>
                <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} />
                <div style={{ textAlign:'right', marginTop:5 }}>
                  <Link href="/auth/forgot-password" style={{ fontSize:10, color:'#3A4E6A' }}>Mot de passe oublié ?</Link>
                </div>
              </div>
              <button type="submit" disabled={loading} style={{ width:'100%', padding:11, borderRadius:6, border:'none', background:'#00D4AA', color:'#06090F', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                {loading ? 'Connexion…' : '→ Se connecter'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} style={{ display:'flex', flexDirection:'column', gap:13 }}>
              <div><label style={labelStyle}>Prénom (optionnel)</label>
                <input type="text" placeholder="Votre prénom" value={fullName} onChange={e => setFullName(e.target.value)} style={inputStyle} /></div>
              <div><label style={labelStyle}>Email</label>
                <input type="email" placeholder="vous@exemple.com" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} /></div>
              <div><label style={labelStyle}>Mot de passe</label>
                <input type="password" placeholder="Minimum 8 caractères" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} /></div>
              <button type="submit" disabled={loading} style={{ width:'100%', padding:11, borderRadius:6, border:'none', background:'#00D4AA', color:'#06090F', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                {loading ? 'Création…' : '→ Créer mon compte gratuit'}
              </button>
              <div style={{ fontSize:11, color:'#3A4E6A', textAlign:'center' }}>🎁 Bêta gratuite · Aucune carte bancaire requise</div>
            </form>
          )}
        </div>

        {/* ── Plans ── */}
        <div style={{ fontSize:10, color:'#3A4E6A', textTransform:'uppercase', letterSpacing:'0.08em', textAlign:'center', marginBottom:12 }}>
          {isBetaActive ? 'Nos formules — Tout gratuit en bêta' : 'Nos formules d\'abonnement'}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:10, width:'100%', maxWidth:700 }}>
          {PLANS.map(plan => (
            <div key={plan.name} style={{ background: plan.highlight ? 'linear-gradient(135deg,rgba(255,184,0,0.05),#0B1220)' : '#0B1220', border:`1px solid ${plan.highlight ? 'rgba(255,184,0,0.28)' : '#0F1E35'}`, borderRadius:10, padding:'13px 12px', position:'relative' }}>
              {plan.highlight && <div style={{ position:'absolute', top:-8, left:'50%', transform:'translateX(-50%)', background:'linear-gradient(90deg,#FFB800,#FF8C00)', color:'#000', fontSize:8, fontWeight:700, padding:'2px 8px', borderRadius:20, whiteSpace:'nowrap' }}>RECOMMANDÉ</div>}
              <div style={{ fontSize:8, fontWeight:700, color:plan.color, marginBottom:4, letterSpacing:'0.08em' }}>{plan.badge}</div>
              <div style={{ fontSize:13, fontWeight:700, color:'#EEF2FF', marginBottom:2 }}>{plan.name}</div>
              <div style={{ fontFamily:'monospace', fontSize:18, fontWeight:700, color:plan.color, lineHeight:1 }}>{plan.price}</div>
              <div style={{ fontSize:9, color:'#3A4E6A', marginBottom:8, marginTop:2 }}>{plan.period}</div>
              <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:4 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display:'flex', alignItems:'center', gap:5, fontSize:10, color:'#7A90B8' }}>
                    <span style={{ color:plan.color, fontWeight:700 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Footer ── */}
        <div style={{ marginTop:20, fontSize:11, color:'#7A90B8', textAlign:'center', background:'rgba(255,255,255,0.02)', border:'1px solid #0F1E35', borderRadius:8, padding:'10px 16px', maxWidth:500, width:'100%' }}>
          🔒 Connexion sécurisée · Données chiffrées · supportpokerpro@gmail.com
        </div>
      </div>
    </div>
  )
}
