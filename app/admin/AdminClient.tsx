'use client'

import { useState } from 'react'
import type { UserProfile, AdminUser } from '@/types'
import Link from 'next/link'

interface Props {
  adminUser: UserProfile
  users: AdminUser[]
  stats: {
    total: number
    premium: number
    standard: number
    free: number
    monthlyRevenue: number
  }
}

export default function AdminClient({ adminUser, users: initialUsers, stats }: Props) {
  const [users, setUsers]   = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'free' | 'standard' | 'premium'>('all')

  const filtered = users.filter(u => {
    const matchSearch = u.email.toLowerCase().includes(search.toLowerCase()) ||
                        (u.full_name || '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || u.plan === filter
    return matchSearch && matchFilter
  })

  async function updateUserPlan(userId: string, newPlan: string) {
    setUpdating(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: newPlan }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setUsers(prev =>
        prev.map(u => u.id === userId
          ? { ...u, plan: newPlan as any, subscription_status: newPlan === 'free' ? 'inactive' : 'active' }
          : u
        )
      )
    } catch (e: any) {
      alert('Erreur : ' + e.message)
    } finally {
      setUpdating(null)
    }
  }

  function planBadge(plan: string) {
    const styles: Record<string, { bg: string; color: string; label: string }> = {
      premium:  { bg: 'rgba(255,184,0,.15)',  color: '#FFB800', label: '⭐ Premium' },
      standard: { bg: 'rgba(61,158,255,.15)',  color: '#3D9EFF', label: '🔵 Standard' },
      free:     { bg: 'rgba(58,78,106,.3)',    color: '#7A90B8', label: '⚪ Gratuit' },
    }
    const s = styles[plan] || styles.free
    return (
      <span style={{
        background: s.bg, color: s.color,
        padding: '2px 8px', borderRadius: 20,
        fontSize: 10, fontWeight: 700,
      }}>
        {s.label}
      </span>
    )
  }

  return (
    <div className="admin-container">
      {/* Header */}
      <div className="admin-header">
        <div>
          <div className="admin-title">🛡️ Dashboard Admin</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>
            Connecté en tant qu'admin : {adminUser.email}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/dashboard" className="btn btn-ghost btn-sm">← App</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card" style={{ '--accent': 'var(--jade)' } as any}>
          <div className="stat-card-label">Total utilisateurs</div>
          <div className="stat-card-value jade">{stats.total}</div>
        </div>
        <div className="stat-card" style={{ '--accent': '#FFB800' } as any}>
          <div className="stat-card-label">Premium actifs</div>
          <div className="stat-card-value" style={{ color: '#FFB800' }}>{stats.premium}</div>
        </div>
        <div className="stat-card" style={{ '--accent': '#3D9EFF' } as any}>
          <div className="stat-card-label">Standard actifs</div>
          <div className="stat-card-value" style={{ color: '#3D9EFF' }}>{stats.standard}</div>
        </div>
        <div className="stat-card" style={{ '--accent': 'var(--green)' } as any}>
          <div className="stat-card-label">Revenus mensuels</div>
          <div className="stat-card-value" style={{ color: 'var(--green)' }}>
            {stats.monthlyRevenue.toFixed(0)}€
          </div>
        </div>
        <div className="stat-card" style={{ '--accent': 'var(--text3)' } as any}>
          <div className="stat-card-label">Comptes gratuits</div>
          <div className="stat-card-value" style={{ color: 'var(--text3)' }}>{stats.free}</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Rechercher par email ou nom…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            background: 'var(--bg2)', border: '1px solid var(--border2)',
            borderRadius: 'var(--radius-sm)', color: 'var(--text)',
            fontSize: 12, padding: '8px 11px', outline: 'none',
            width: 260, fontFamily: 'var(--font-body)',
          }}
        />
        {(['all', 'premium', 'standard', 'free'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '5px 12px', borderRadius: 20,
              border: '1px solid ' + (filter === f ? 'var(--jade)' : 'var(--border2)'),
              background: filter === f ? 'rgba(0,212,170,.1)' : 'var(--bg3)',
              color: filter === f ? 'var(--jade)' : 'var(--text2)',
              cursor: 'pointer', fontSize: 11, fontWeight: 600,
              fontFamily: 'var(--font-body)',
            }}
          >
            {f === 'all' ? 'Tous' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text3)' }}>
          {filtered.length} utilisateur(s)
        </span>
      </div>

      {/* Table */}
      <div className="admin-table-wrap">
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Plan actuel</th>
                <th>Statut abo.</th>
                <th>Inscrit le</th>
                <th>Stripe Customer</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text3)' }}>
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              )}
              {filtered.map(user => (
                <tr key={user.id}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>
                      {user.full_name || '—'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                      {user.email}
                    </div>
                  </td>
                  <td>{planBadge(user.plan)}</td>
                  <td>
                    <span style={{
                      fontSize: 10,
                      color: user.subscription_status === 'active' ? 'var(--green)'
                           : user.subscription_status === 'past_due' ? 'var(--gold)'
                           : 'var(--text3)',
                    }}>
                      {user.subscription_status || 'inactive'}
                    </span>
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--text2)' }}>
                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                    {user.stripe_customer_id
                      ? user.stripe_customer_id.substring(0, 18) + '…'
                      : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      {(['free', 'standard', 'premium'] as const).map(p => (
                        user.plan !== p && (
                          <button
                            key={p}
                            onClick={() => updateUserPlan(user.id, p)}
                            disabled={updating === user.id}
                            style={{
                              padding: '3px 7px',
                              border: '1px solid var(--border2)',
                              borderRadius: 4,
                              background: 'var(--bg3)',
                              color: p === 'premium' ? 'var(--gold)'
                                   : p === 'standard' ? 'var(--blue)'
                                   : 'var(--text3)',
                              cursor: 'pointer',
                              fontSize: 9,
                              fontWeight: 700,
                              fontFamily: 'var(--font-body)',
                              opacity: updating === user.id ? 0.5 : 1,
                            }}
                          >
                            {updating === user.id ? '…' : `→ ${p.charAt(0).toUpperCase() + p.slice(1)}`}
                          </button>
                        )
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
