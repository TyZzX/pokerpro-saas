import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe, getPlanByPriceId } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

// IMPORTANT : ce endpoint doit recevoir le body RAW (non parsé)
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const body        = await request.text()
  const signature   = headers().get('stripe-signature')!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event

  // Vérification de la signature (sécurité critique)
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error(`❌ Webhook signature invalide: ${err.message}`)
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  const supabase = createAdminClient()

  console.log(`🎣 Webhook Stripe reçu: ${event.type}`)

  try {
    switch (event.type) {

      // ── Abonnement créé ou mis à jour ─────────────────────────────
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId        = subscription.metadata?.supabase_user_id
        const priceId       = subscription.items.data[0]?.price.id
        const plan          = getPlanByPriceId(priceId)
        const status        = subscription.status

        if (!userId) {
          // Essaie de retrouver l'user via le customer Stripe
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', subscription.customer as string)
            .single()
          
          if (!profile) break

          await supabase.from('profiles').update({
            plan: plan?.plan || 'standard',
            stripe_subscription_id: subscription.id,
            subscription_status: status === 'active' ? 'active' : 'inactive',
          }).eq('id', profile.id)
          break
        }

        await supabase.from('profiles').update({
          plan: plan?.plan || 'standard',
          stripe_subscription_id: subscription.id,
          subscription_status: status === 'active' ? 'active' : 'inactive',
          stripe_customer_id: subscription.customer as string,
        }).eq('id', userId)

        console.log(`✅ Plan mis à jour: user=${userId}, plan=${plan?.plan}, status=${status}`)
        break
      }

      // ── Abonnement annulé ou expiré ───────────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.supabase_user_id

        const updateData = {
          plan: 'free',
          subscription_status: 'canceled',
          stripe_subscription_id: null,
        }

        if (userId) {
          await supabase.from('profiles').update(updateData).eq('id', userId)
        } else {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', subscription.customer as string)
            .single()
          
          if (profile) {
            await supabase.from('profiles').update(updateData).eq('id', profile.id)
          }
        }

        console.log(`🚫 Abonnement annulé: user=${userId}`)
        break
      }

      // ── Paiement réussi ────────────────────────────────────────────
      case 'invoice.payment_succeeded': {
        const invoice      = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string
        
        if (subscriptionId) {
          await supabase
            .from('profiles')
            .update({ subscription_status: 'active' })
            .eq('stripe_subscription_id', subscriptionId)
        }
        break
      }

      // ── Paiement échoué ────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice      = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string

        if (subscriptionId) {
          await supabase
            .from('profiles')
            .update({ subscription_status: 'past_due' })
            .eq('stripe_subscription_id', subscriptionId)
        }
        break
      }

      // ── Checkout complété (backup) ─────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId  = session.metadata?.supabase_user_id
        const plan    = session.metadata?.plan

        if (userId && plan && session.subscription) {
          await supabase.from('profiles').update({
            plan,
            stripe_subscription_id: session.subscription as string,
            stripe_customer_id: session.customer as string,
            subscription_status: 'active',
          }).eq('id', userId)
        }
        break
      }

      default:
        console.log(`⚪ Webhook ignoré: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Erreur traitement webhook' }, { status: 500 })
  }
}
