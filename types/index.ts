// ============================================================
// TYPES GLOBAUX — PokerPro SaaS
// ============================================================

export type Plan = 'standard' | 'premium' | 'free'

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  plan: Plan
  stripe_customer_id?: string
  stripe_subscription_id?: string
  subscription_status?: SubscriptionStatus
  created_at: string
  updated_at: string
}

export type SubscriptionStatus =
  | 'active'
  | 'inactive'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'

export interface StripePlan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval: 'month' | 'year'
  features: string[]
  priceId: string
  plan: Plan
}

export interface AdminUser extends UserProfile {
  last_sign_in_at?: string
}

export interface DashboardStats {
  total_users: number
  standard_users: number
  premium_users: number
  monthly_revenue: number
  active_subscriptions: number
}
