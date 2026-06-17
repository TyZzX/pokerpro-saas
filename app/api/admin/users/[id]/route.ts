import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// PATCH /api/admin/users/:id — Modifier le plan d'un utilisateur
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifie que l'appelant est admin
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { plan } = await request.json()
    const validPlans = ['free', 'standard', 'premium']

    if (!validPlans.includes(plan)) {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })
    }

    // Mise à jour avec le client admin (bypass RLS)
    const adminSupabase = createAdminClient()
    const { error } = await adminSupabase
      .from('profiles')
      .update({
        plan,
        subscription_status: plan === 'free' ? 'inactive' : 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ success: true, plan })
  } catch (error: any) {
    console.error('Admin update error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET /api/admin/users/:id — Détails d'un utilisateur
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const adminSupabase = createAdminClient()
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', params.id)
      .single()

    return NextResponse.json({ user: profile })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
