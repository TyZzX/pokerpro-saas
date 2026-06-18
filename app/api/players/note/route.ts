import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

// POST — Sauvegarder une note sur un joueur (Premium uniquement)
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  // Vérifie le plan Premium
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, subscription_status')
    .eq('id', user.id)
    .single()

  // Pendant la période bêta, on laisse passer tout le monde
  const isBeta = new Date('2026-07-18T23:59:59') > new Date()
  const isPremium = profile?.plan === 'premium' || isBeta

  if (!isPremium) {
    return NextResponse.json({ error: 'Fonctionnalité Premium requise' }, { status: 403 })
  }

  const { pseudo, room, note, tag } = await request.json()
  if (!pseudo || !note) {
    return NextResponse.json({ error: 'Pseudo et note requis' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Upsert la note (1 note par user par joueur)
  const { data, error } = await admin
    .from('player_notes')
    .upsert({
      user_id:    user.id,
      pseudo:     pseudo.toLowerCase().trim(),
      room:       room || 'winamax',
      note:       note.trim(),
      tag:        tag || 'neutre',
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,pseudo,room',
    })
    .select()
    .single()

  if (error) {
    console.error('Note save error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, note: data })
}

// DELETE — Supprimer une note
export async function DELETE(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  const { pseudo, room } = await request.json()
  const admin = createAdminClient()

  await admin
    .from('player_notes')
    .delete()
    .eq('user_id', user.id)
    .eq('pseudo', pseudo.toLowerCase())
    .eq('room', room || 'winamax')

  return NextResponse.json({ success: true })
}
