import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import AdminClient from './AdminClient'

export const metadata = { title: 'Admin — PokerPro Suite' }
export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  // Vérifie que l'utilisateur est admin (email = ADMIN_EMAIL)
  const adminUser = await requireAdmin()

  const supabase = createAdminClient()

  // Récupère tous les utilisateurs
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  // Stats agrégées
  const total    = users?.length || 0
  const premium  = users?.filter(u => u.plan === 'premium').length || 0
  const standard = users?.filter(u => u.plan === 'standard').length || 0
  const free     = users?.filter(u => u.plan === 'free').length || 0

  // Revenus Stripe du mois en cours
  let monthlyRevenue = 0
  try {
    const now        = Math.floor(Date.now() / 1000)
    const monthStart = now - (30 * 24 * 3600)
    
    const invoices = await stripe.invoices.list({
      status: 'paid',
      created: { gte: monthStart },
      limit: 100,
    })
    monthlyRevenue = invoices.data.reduce((sum, inv) => sum + (inv.amount_paid / 100), 0)
  } catch (e) {
    // Stripe non configuré en dev
    monthlyRevenue = (premium * 25) + (standard * 10)
  }

  const stats = { total, premium, standard, free, monthlyRevenue }

  return <AdminClient adminUser={adminUser} users={users || []} stats={stats} />
}
