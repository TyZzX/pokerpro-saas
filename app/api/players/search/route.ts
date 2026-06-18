import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const pseudo = searchParams.get('pseudo')?.trim()
  const room   = searchParams.get('room') || 'winamax'

  if (!pseudo) {
    return NextResponse.json({ error: 'Pseudo requis' }, { status: 400 })
  }

  // Vérifie que l'user est connecté
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  const admin = createAdminClient()

  // Cherche les stats du joueur dans les mains communautaires
  const { data: handStats } = await admin
    .from('hands')
    .select('pf_action, result, position, streets')
    .eq('source', room)
    .ilike('raw', `%${pseudo}%`)
    .limit(500)

  // Récupère les notes sur ce joueur (toutes les notes des users)
  const { data: notes } = await admin
    .from('player_notes')
    .select('note, tag, created_at, user_id')
    .eq('pseudo', pseudo.toLowerCase())
    .eq('room', room)
    .order('created_at', { ascending: false })
    .limit(10)

  // Calcule les stats si on a des mains
  let stats = null
  if (handStats && handStats.length > 0) {
    const total  = handStats.length
    const vpip   = handStats.filter(h => ['raise','call','limp'].includes(h.pf_action || '')).length
    const pfr    = handStats.filter(h => h.pf_action === 'raise').length
    const sawFlop = handStats.filter(h => h.streets?.flop).length
    const wins   = handStats.filter(h => (h.result || 0) > 0).length
    const totalResult = handStats.reduce((s, h) => s + (h.result || 0), 0)

    stats = {
      hands:      total,
      vpip:       parseFloat((vpip / total * 100).toFixed(1)),
      pfr:        parseFloat((pfr / total * 100).toFixed(1)),
      winrate:    parseFloat((totalResult / total * 100).toFixed(1)),
      sawFlop:    parseFloat((sawFlop / total * 100).toFixed(1)),
      winPct:     parseFloat((wins / total * 100).toFixed(1)),
      totalProfit: parseFloat(totalResult.toFixed(2)),
    }
  }

  // Liens externes
  const externalLinks = {
    sharkscope: `https://fr.sharkscope.com/#Player-Statistics//networks/${room === 'winamax' ? 'Winamax' : 'PokerStars'}/players/${encodeURIComponent(pseudo)}`,
    pokstats:   `https://www.pokstats.com/player?name=${encodeURIComponent(pseudo)}&site=${room}`,
    winamax:    room === 'winamax' ? `https://www.winamax.fr/guns-and-glory/${encodeURIComponent(pseudo)}` : null,
  }

  return NextResponse.json({
    pseudo,
    room,
    stats,
    notes: notes || [],
    externalLinks,
    dataSource: stats ? `${stats.hands} mains communautaires` : 'Aucune donnée locale',
  })
}
