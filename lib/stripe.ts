import Stripe from 'stripe'
import type { StripePlan } from '@/types'

// Instance Stripe (côté serveur uniquement)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
})

// Définition des plans
export const PLANS: StripePlan[] = [
  {
    id: 'standard',
    name: 'Standard',
    description: 'Accès aux outils de base',
    price: 10,
    currency: 'eur',
    interval: 'month',
    priceId: process.env.STRIPE_STANDARD_PRICE_ID!,
    plan: 'standard',
    features: [
      'Calculateur d\'équité',
      'Cotes du pot',
      'Analyseur de flop',
      'Ranges Calamusa',
      'Éditeur de ranges',
      'Quiz interactif',
      'Spots GTO',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Analytics complète + IA',
    price: 25,
    currency: 'eur',
    interval: 'month',
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID!,
    plan: 'premium',
    features: [
      'Tout le plan Standard',
      'HUD Joueurs avancé',
      'Import de mains (Winamax, PS)',
      'Analyse de leaks automatique',
      'Rapport IA personnalisé',
      'Statistiques avancées',
      'Dashboard analytics',
    ],
  },
]

export function getPlanByPriceId(priceId: string): StripePlan | undefined {
  return PLANS.find(p => p.priceId === priceId)
}

export function getPlanById(id: string): StripePlan | undefined {
  return PLANS.find(p => p.id === id)
}
