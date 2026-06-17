import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { UserProfile } from '@/types'

/**
 * Récupère l'utilisateur connecté côté serveur.
 * Redirige vers /auth/login si la session est absente.
 */
export async function requireAuth(): Promise<UserProfile> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Profil absent → le trigger SQL n'a pas encore tourné, on le crée
  if (!profile) {
    const { data: created } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email!,
        plan: 'free',
        subscription_status: 'inactive',
      })
      .select()
      .single()

    if (!created) redirect('/auth/login')
    return created as UserProfile
  }

  return profile as UserProfile
}

/** Vérifie que l'utilisateur est admin (email = ADMIN_EMAIL) */
export async function requireAdmin(): Promise<UserProfile> {
  const profile = await requireAuth()
  if (profile.email !== process.env.ADMIN_EMAIL) {
    redirect('/dashboard')
  }
  return profile
}

/** Accès premium actif */
export function isPremium(profile: UserProfile): boolean {
  return profile.plan === 'premium' && profile.subscription_status === 'active'
}

/** Utilisateur optionnel — ne redirige pas */
export async function getOptionalUser(): Promise<UserProfile | null> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return (profile as UserProfile) ?? null
  } catch {
    return null
  }
}
