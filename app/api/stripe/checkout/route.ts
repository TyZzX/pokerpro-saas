import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, getPlanById } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
    }

    const { planId } = await request.json()
    const plan = getPlanById(planId)

    if (!plan) {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })
    }

    // Récupère le profil pour l'ID Stripe customer existant
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    // Crée le customer Stripe s'il n'existe pas
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id

      // Sauvegarde l'ID customer dans Supabase
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL!

    // Crée la session de checkout Stripe
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: plan.priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?success=true`,
      cancel_url: `${origin}/upgrade?canceled=true`,
      metadata: {
        supabase_user_id: user.id,
        plan: plan.plan,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          plan: plan.plan,
        },
      },
      locale: 'fr',
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
