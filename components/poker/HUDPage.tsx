'use client'

import { useState } from 'react'

const ROOMS = [
  { id: 'winamax',     label: 'Winamax',     color: '#E8341C', flag: '🇫🇷' },
  { id: 'pokerstars',  label: 'PokerStars',  color: '#D4AF37', flag: '♠' },
  { id: 'betclic',     label: 'Betclic',     color: '#00A86B', flag: '🃏' },
  { id: 'pmu',         label: 'PMU Poker',   color: '#003DA5', flag: '🏇' },
]

const TAGS = [
  { id: 'fish',   label: '🐟 Fish',    color: '#FF4560', bg: 'rgba(255,69,96,0.12)' },
  { id: 'reg',    label: '🦁 Reg',     color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
  { id: 'nit',    label: '🐢 Nit',     color: '#7A90B8', bg: 'rgba(122,144,184,0.12)' },
  { id: 'lag',    label: '🔥 LAG',     color: '#FB923C', bg: 'rgba(251,146,60,0.12)' },
  { id: 'tag',    label: '💪 TAG',     color: '#3D9EFF', bg: 'rgba(61,158,255,0.12)' },
  { id: 'danger', label: '⚠️ Danger',  color: '#FFB800', bg: 'rgba(255,184,0,0.12)' },
  { id: 'neutre', label: '➖ Neutre',  color: '#3A4E6A', bg: 'rgba(58,78,106,0.12)' },
]

interface PlayerResult {
  pseudo:     string
  room:       string
  stats:      any
  notes:      any[]
  externalLinks: { sharkscope: string; pokstats: string; winamax: string | null }
  dataSource: string
}

const s: Record<string, any> = {
  card:    { background:'#0B1220', border:'1px solid #0F1E35', borderRadius:12, padding:16 },
  label:   { display:'block', fontSize:9, fontWeight:700, color:'#7A90B8', marginBottom:4, textTransform:'uppercase' as const, letterSpacing:'0.08em' },
  input:   { width:'100%', background:'#101A2E', border:'1px solid #162840', borderRadius:6, color:'#EEF2FF', fontSize:13, padding:'10px 12px', fontFamily:'inherit', outline:'none' },
  btn:     { padding:'10px 16px', borderRadius:6, border:'none', cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:'inherit', transition:'all 0.15s' as const },
  statBox: { background:'#101A2E', border:'1px solid #162840', borderRadius:8, padding:'10px 12px', textAlign:'center' as const },
}

export default function HUDPage({ isPremium = false }: { isPremium?: boolean }) {
  const [pseudo, setPseudo]       = useState('')
  const [room, setRoom]           = useState('winamax')
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState<PlayerResult | null>(null)
  const [error, setError]         = useState('')
  const [note, setNote]           = useState('')
  const [tag, setTag]             = useState('neutre')
  const [noteSaving, setNoteSaving] = useState(false)
  const [noteSaved, setNoteSaved]   = useState(false)

  async function searchPlayer() {
    if (!pseudo.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    setNoteSaved(false)

    try {
      const res = await fetch(`/api/players/search?pseudo=${encodeURIComponent(pseudo)}&room=${room}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
      // Pré-rempli la note si elle existe
      if (data.notes?.length > 0) {
        const myNote = data.notes[0]
        setNote(myNote.note || '')
        setTag(myNote.tag || 'neutre')
      } else {
        setNote('')
        setTag('neutre')
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function saveNote() {
    if (!result || !note.trim()) return
    setNoteSaving(true)
    try {
      const res = await fetch('/api/players/note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pseudo: result.pseudo, room: result.room, note, tag }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setNoteSaved(true)
      setTimeout(() => setNoteSaved(false), 2000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setNoteSaving(false)
    }
  }

  const statColor = (val: number, type: string) => {
    if (type === 'vpip') return val < 25 ? '#34D399' : val < 35 ? '#FFB800' : '#FF4560'
    if (type === 'pfr')  return val < 10 ? '#FF4560' : val < 22 ? '#34D399' : '#FFB800'
    if (type === 'wr')   return val >= 0 ? '#34D399' : '#FF4560'
    return '#7A90B8'
  }

  return (
    <div style={{ minHeight:'100vh', background:'#06090F', padding:'24px 20px', fontFamily:"'Inter',sans-serif", maxWidth:900, margin:'0 auto' }}>

      {/* ── TITRE ── */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:20, fontWeight:700, color:'#EEF2FF', marginBottom:4 }}>
          🎯 Recherche de joueur
        </div>
        <div style={{ fontSize:12, color:'#7A90B8' }}>
          Stats communautaires · Liens externes · Notes privées
        </div>
      </div>

      {/* ── GUIDE ── */}
      <div style={{ background:'linear-gradient(135deg,rgba(0,212,170,0.06),rgba(0,212,170,0.02))', border:'1px solid rgba(0,212,170,0.2)', borderRadius:10, padding:14, marginBottom:20 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#00D4AA', marginBottom:8 }}>
          📖 Comment voir apparaître les données d'un joueur ?
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
          {[
            ['1️⃣', 'Importez vos mains', 'Menu "Import de mains" → collez votre historique Winamax/PokerStars. Plus vous importez, plus la base est riche.'],
            ['2️⃣', 'Recherchez un pseudo', 'Tapez le pseudo exact du joueur ci-dessous et sélectionnez sa room. Les stats apparaissent si ce joueur est dans vos mains importées.'],
            ['3️⃣', 'Base communautaire', 'Quand d\'autres utilisateurs importent leurs mains, leurs données enrichissent automatiquement la base pour tous.'],
          ].map(([num, title, desc]) => (
            <div key={title} style={{ background:'rgba(0,0,0,0.2)', borderRadius:8, padding:10 }}>
              <div style={{ fontSize:16, marginBottom:4 }}>{num}</div>
              <div style={{ fontSize:11, fontWeight:700, color:'#EEF2FF', marginBottom:3 }}>{title}</div>
              <div style={{ fontSize:10, color:'#7A90B8', lineHeight:1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:10, padding:'8px 12px', background:'rgba(255,184,0,0.08)', border:'1px solid rgba(255,184,0,0.2)', borderRadius:6, fontSize:11, color:'#FFB800' }}>
          💡 <strong>Pour exporter vos mains Winamax :</strong> Logiciel Winamax → Compte → Historique des mains → Exporter → Sélectionnez toute la période disponible
        </div>
      </div>

      {/* ── RECHERCHE ── */}
      <div style={{ ...s.card, marginBottom:16 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto 120px', gap:10, alignItems:'flex-end' }}>
          <div>
            <label style={s.label}>Pseudo du joueur</label>
            <input
              style={s.input}
              placeholder="Ex: DxZ_TyZzX, ElkY, ..."
              value={pseudo}
              onChange={e => setPseudo(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchPlayer()}
            />
          </div>
          <div>
            <label style={s.label}>Room</label>
            <select
              value={room}
              onChange={e => setRoom(e.target.value)}
              style={{ ...s.input, width:'auto', minWidth:130 }}
            >
              {ROOMS.map(r => (
                <option key={r.id} value={r.id}>{r.flag} {r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ ...s.label, visibility:'hidden' }}>-</label>
            <button
              onClick={searchPlayer}
              disabled={loading || !pseudo.trim()}
              style={{ ...s.btn, width:'100%', background:loading ? '#162840' : '#00D4AA', color:loading ? '#7A90B8' : '#06090F' }}
            >
              {loading ? '⏳ Recherche…' : '🔍 Rechercher'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background:'rgba(255,69,96,0.1)', border:'1px solid rgba(255,69,96,0.3)', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#FF4560', marginBottom:14 }}>
          {error}
        </div>
      )}

      {/* ── RÉSULTATS ── */}
      {result && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>

          {/* Stats communautaires */}
          <div style={s.card}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div>
                <div style={{ fontSize:16, fontWeight:700, color:'#EEF2FF' }}>{result.pseudo}</div>
                <div style={{ fontSize:10, color:'#3A4E6A', marginTop:2 }}>{ROOMS.find(r => r.id === result.room)?.label} · {result.dataSource}</div>
              </div>
              {result.stats && (
                <div style={{ background:'rgba(0,212,170,0.1)', border:'1px solid rgba(0,212,170,0.2)', borderRadius:20, padding:'3px 10px', fontSize:10, fontWeight:700, color:'#00D4AA' }}>
                  {result.stats.hands} mains
                </div>
              )}
            </div>

            {result.stats ? (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
                {[
                  ['VPIP', result.stats.vpip + '%', statColor(result.stats.vpip, 'vpip'), 'Mains jouées volontairement'],
                  ['PFR',  result.stats.pfr  + '%', statColor(result.stats.pfr, 'pfr'), 'Raise preflop'],
                  ['Win%', result.stats.winPct + '%', statColor(result.stats.winPct, 'wr'), 'Taux de victoire'],
                  ['Saw Flop', result.stats.sawFlop + '%', '#7A90B8', 'Voit le flop'],
                  ['Profit', (result.stats.totalProfit >= 0 ? '+' : '') + result.stats.totalProfit + ' bb', statColor(result.stats.totalProfit, 'wr'), 'Profit total en bb'],
                  ['Winrate', (result.stats.winrate >= 0 ? '+' : '') + result.stats.winrate, statColor(result.stats.winrate, 'wr'), 'bb/100'],
                ].map(([lbl, val, color, desc]) => (
                  <div key={lbl} style={s.statBox} title={desc as string}>
                    <div style={{ fontSize:9, color:'#3A4E6A', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>{lbl}</div>
                    <div style={{ fontSize:18, fontWeight:700, fontFamily:'monospace', color: color as string }}>{val}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background:'#101A2E', borderRadius:8, padding:16, textAlign:'center', marginBottom:12 }}>
                <div style={{ fontSize:24, marginBottom:6 }}>🔍</div>
                <div style={{ fontSize:12, color:'#7A90B8', lineHeight:1.6 }}>
                  Aucune donnée locale pour <strong style={{ color:'#EEF2FF' }}>{result.pseudo}</strong>.<br />
                  Importez vos mains pour enrichir la base.
                </div>
              </div>
            )}

            {/* Liens externes */}
            <div style={{ fontSize:10, color:'#3A4E6A', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.06em' }}>
              🔗 Voir sur les sites externes
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <a href={result.externalLinks.sharkscope} target="_blank" rel="noopener noreferrer"
                style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 12px', background:'rgba(212,175,55,0.1)', border:'1px solid rgba(212,175,55,0.3)', borderRadius:6, color:'#D4AF37', fontSize:11, fontWeight:600, textDecoration:'none' }}>
                🦈 SharkScope
              </a>
              <a href={result.externalLinks.pokstats} target="_blank" rel="noopener noreferrer"
                style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 12px', background:'rgba(61,158,255,0.1)', border:'1px solid rgba(61,158,255,0.3)', borderRadius:6, color:'#3D9EFF', fontSize:11, fontWeight:600, textDecoration:'none' }}>
                📊 Pokstats
              </a>
              {result.externalLinks.winamax && (
                <a href={result.externalLinks.winamax} target="_blank" rel="noopener noreferrer"
                  style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 12px', background:'rgba(232,52,28,0.1)', border:'1px solid rgba(232,52,28,0.3)', borderRadius:6, color:'#E8341C', fontSize:11, fontWeight:600, textDecoration:'none' }}>
                  🃏 Winamax
                </a>
              )}
            </div>
          </div>

          {/* Notes joueur */}
          <div style={s.card}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#EEF2FF' }}>📝 Notes privées</div>
              {!isPremium && (
                <span style={{ background:'rgba(255,184,0,0.12)', color:'#FFB800', border:'1px solid rgba(255,184,0,0.25)', borderRadius:20, padding:'2px 8px', fontSize:9, fontWeight:700 }}>
                  ⭐ PREMIUM
                </span>
              )}
            </div>

            {isPremium ? (
              <>
                {/* Tag */}
                <div style={{ marginBottom:12 }}>
                  <label style={s.label}>Tag joueur</label>
                  <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                    {TAGS.map(t => (
                      <button key={t.id} onClick={() => setTag(t.id)} style={{
                        padding:'4px 10px', borderRadius:20, border:`1px solid ${tag === t.id ? t.color : '#162840'}`,
                        background: tag === t.id ? t.bg : 'transparent',
                        color: tag === t.id ? t.color : '#3A4E6A',
                        fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all 0.12s',
                      }}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Note text */}
                <div style={{ marginBottom:12 }}>
                  <label style={s.label}>Votre note</label>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Ex: Call station river, ne fold jamais flush draw, 3-bet très tight..."
                    style={{ ...s.input, minHeight:90, resize:'vertical', lineHeight:1.6 }}
                  />
                </div>

                <button onClick={saveNote} disabled={noteSaving || !note.trim()} style={{
                  ...s.btn, width:'100%',
                  background: noteSaved ? 'rgba(52,211,153,0.2)' : '#00D4AA',
                  color: noteSaved ? '#34D399' : '#06090F',
                  border: noteSaved ? '1px solid rgba(52,211,153,0.4)' : 'none',
                }}>
                  {noteSaved ? '✅ Note sauvegardée !' : noteSaving ? 'Sauvegarde…' : '💾 Sauvegarder la note'}
                </button>

                {/* Notes communautaires */}
                {result.notes && result.notes.length > 0 && (
                  <div style={{ marginTop:14 }}>
                    <div style={{ fontSize:10, color:'#3A4E6A', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>
                      Notes de la communauté ({result.notes.length})
                    </div>
                    {result.notes.slice(0, 3).map((n: any, i: number) => {
                      const tagInfo = TAGS.find(t => t.id === n.tag)
                      return (
                        <div key={i} style={{ background:'#101A2E', borderRadius:6, padding:'8px 10px', marginBottom:6 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                            {tagInfo && (
                              <span style={{ background:tagInfo.bg, color:tagInfo.color, padding:'1px 7px', borderRadius:20, fontSize:9, fontWeight:700 }}>
                                {tagInfo.label}
                              </span>
                            )}
                            <span style={{ fontSize:10, color:'#3A4E6A' }}>
                              {new Date(n.created_at).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <div style={{ fontSize:11, color:'#7A90B8', lineHeight:1.5 }}>{n.note}</div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            ) : (
              <div style={{ background:'linear-gradient(135deg,rgba(255,184,0,0.06),rgba(255,140,0,0.03))', border:'1px solid rgba(255,184,0,0.2)', borderRadius:8, padding:20, textAlign:'center' }}>
                <div style={{ fontSize:32, marginBottom:10 }}>⭐</div>
                <div style={{ fontSize:13, fontWeight:700, color:'#FFB800', marginBottom:6 }}>Fonctionnalité Premium</div>
                <div style={{ fontSize:11, color:'#7A90B8', lineHeight:1.65, marginBottom:16 }}>
                  Taggez vos adversaires (Fish, Reg, Nit…), prenez des notes privées et accédez aux notes de la communauté.
                </div>
                <a href="/upgrade" style={{ display:'inline-block', background:'linear-gradient(90deg,#FFB800,#FF8C00)', color:'#000', padding:'8px 20px', borderRadius:6, fontSize:12, fontWeight:700, textDecoration:'none' }}>
                  Passer Premium
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
