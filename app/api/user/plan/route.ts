import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Endpoint pour récupérer le plan actuel côté client
export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, subscription_status, updated_at')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      plan: profile?.plan || 'free',
      status: profile?.subscription_status || 'inactive',
      isPremium: profile?.plan === 'premium' && profile?.subscription_status === 'active',
      isStandard: profile?.plan === 'standard' && profile?.subscription_status === 'active',
    })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
