# PokerPro Suite — SaaS Poker en ligne
## Guide de déploiement complet — Étape par étape

---

## ARCHITECTURE

```
pokerpro-saas/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Layout racine
│   ├── page.tsx                  # Redirect login/dashboard
│   ├── globals.css               # Styles globaux (design original)
│   ├── dashboard/page.tsx        # 🎯 App poker principale (protégée)
│   ├── upgrade/page.tsx          # 💳 Page d'abonnement
│   ├── admin/page.tsx            # 🛡️ Dashboard admin (email admin only)
│   └── api/
│       ├── stripe/
│       │   ├── checkout/         # POST — Créer session paiement
│       │   ├── portal/           # GET  — Portail client Stripe
│       │   └── webhook/          # POST — Événements Stripe (critique)
│       ├── admin/users/[id]/     # PATCH — Modifier plan utilisateur
│       └── user/plan/            # GET  — Plan actuel (client-side)
│
├── components/
│   └── poker/PokerApp.tsx        # Wrapper de l'app poker (iframe)
│
├── lib/
│   ├── supabase/client.ts        # Client browser Supabase
│   ├── supabase/server.ts        # Client serveur Supabase
│   ├── stripe.ts                 # Config Stripe + plans
│   └── auth.ts                   # Helpers auth server-side
│
├── middleware.ts                  # Protection routes automatique
├── supabase/migrations/           # Schéma SQL à exécuter
└── public/
    ├── poker-app-premium.html     # ← VOTRE app HTML (version Premium)
    └── poker-app-standard.html   # ← VOTRE app HTML (version Standard)
```

---

## ÉTAPE 1 — PRÉREQUIS

Installez ces outils si ce n'est pas déjà fait :
```bash
# Node.js 18+
node --version

# pnpm (recommandé) ou npm
npm install -g pnpm

# Stripe CLI (pour tester les webhooks en local)
# https://stripe.com/docs/stripe-cli
```

---

## ÉTAPE 2 — INSTALLER LES DÉPENDANCES

```bash
cd pokerpro-saas
pnpm install
# ou : npm install
```

---

## ÉTAPE 3 — CONFIGURER SUPABASE

### 3.1 Créer le projet Supabase
1. Allez sur https://supabase.com
2. Créez un nouveau projet (gratuit jusqu'à 500 MB)
3. Notez votre **Project URL** et vos **API Keys**

### 3.2 Créer le schéma de base de données
1. Dans Supabase Dashboard → **SQL Editor**
2. Copiez-collez le contenu de `supabase/migrations/001_initial_schema.sql`
3. Cliquez **Run** — toutes les tables et triggers se créent automatiquement

### 3.3 Activer les emails de confirmation
Supabase → Authentication → Email Templates → Confirmez que les emails sont activés

---

## ÉTAPE 4 — CONFIGURER STRIPE

### 4.1 Créer les produits
1. Stripe Dashboard → **Products** → Add Product
2. **Produit 1 : Standard**
   - Nom : "PokerPro Standard"
   - Prix : 10,00 € / mois récurrent
   - Copiez le **Price ID** (ex: `price_1OaBC...`)

3. **Produit 2 : Premium**
   - Nom : "PokerPro Premium"
   - Prix : 25,00 € / mois récurrent
   - Copiez le **Price ID**

### 4.2 Configurer le portail client
Stripe Dashboard → Settings → **Customer portal**
- Activez : Annuler abonnement, Voir factures

---

## ÉTAPE 5 — VARIABLES D'ENVIRONNEMENT

```bash
# Copiez le template
cp .env.local.example .env.local

# Remplissez toutes les valeurs dans .env.local
```

**.env.local à compléter :**
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase (Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
SUPABASE_SERVICE_ROLE_KEY=eyJhb...

# Stripe (Dashboard → API Keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...    ← Étape 6

# Price IDs créés à l'étape 4
STRIPE_STANDARD_PRICE_ID=price_...
STRIPE_PREMIUM_PRICE_ID=price_...

# Email admin pour le dashboard
ADMIN_EMAIL=votre@email.com
```

---

## ÉTAPE 6 — VOTRE APP HTML EXISTANTE

Copiez vos fichiers HTML dans le dossier `public/` :

```bash
# Version premium (toutes fonctionnalités)
cp /chemin/vers/PokerPro_Complet_v3.html public/poker-app-premium.html

# Version standard (fonctions de base seulement)
# Même fichier mais le plan sera injecté via postMessage
cp /chemin/vers/PokerPro_Complet_v3.html public/poker-app-standard.html
```

**Important** : L'app HTML reçoit le plan via `window.postMessage` :
```javascript
// Dans votre app HTML, ajoutez ce listener :
window.addEventListener('message', function(e) {
  if (e.data?.type === 'POKERPRO_INIT') {
    // e.data.plan = 'standard' | 'premium'
    // e.data.user = { email, name }
    setPlan(e.data.plan);
  }
});

// Pour demander un upgrade depuis l'app HTML :
function requestUpgrade() {
  window.parent.postMessage({ type: 'POKERPRO_UPGRADE' }, '*');
}
```

---

## ÉTAPE 7 — TESTER LES WEBHOOKS EN LOCAL

Dans un **second terminal** :
```bash
# Authentifiez-vous
stripe login

# Écoutez les webhooks et forward vers votre app locale
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copiez le "Webhook signing secret" affiché (whsec_...)
# Collez-le dans .env.local → STRIPE_WEBHOOK_SECRET
```

---

## ÉTAPE 8 — LANCER EN LOCAL

```bash
pnpm dev
# → http://localhost:3000
```

**Test du flow complet :**
1. Allez sur http://localhost:3000
2. Créez un compte → confirmez l'email
3. Connectez-vous → vous voyez l'app en mode Standard
4. Cliquez "Passer Premium" → paiement Stripe (carte test: 4242 4242 4242 4242)
5. Retour sur le dashboard → mode Premium activé

---

## ÉTAPE 9 — DÉPLOIEMENT SUR VERCEL

### 9.1 Créer le repo Git
```bash
git init
git add .
git commit -m "PokerPro SaaS initial"

# Créez un repo sur GitHub et pushez
git remote add origin https://github.com/vous/pokerpro-saas
git push -u origin main
```

### 9.2 Déployer sur Vercel
1. Allez sur https://vercel.com
2. **New Project** → importez votre repo GitHub
3. Framework : **Next.js** (détecté automatiquement)
4. **Environment Variables** → ajoutez TOUTES les variables de `.env.local`
   - Changez `NEXT_PUBLIC_APP_URL` → votre domaine Vercel (ex: `https://pokerpro.vercel.app`)
5. Cliquez **Deploy**

### 9.3 Configurer le Webhook Stripe en production
1. Stripe Dashboard → Developers → **Webhooks** → Add endpoint
2. URL : `https://votre-domaine.vercel.app/api/stripe/webhook`
3. Events à écouter :
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `checkout.session.completed`
4. Copiez le **Signing Secret** → ajoutez dans les env vars Vercel

### 9.4 Mettre à jour l'URL dans Vercel
Dans Vercel → Settings → Environment Variables :
```
NEXT_PUBLIC_APP_URL = https://votre-vrai-domaine.com
```

### 9.5 Domaine personnalisé (optionnel)
Vercel → Settings → Domains → Add your domain

---

## ACCÈS ADMIN

Le dashboard admin est à `/admin`.
Il est accessible uniquement si votre email = `ADMIN_EMAIL` dans les env vars.

**Fonctionnalités admin :**
- Voir tous les utilisateurs et leur plan
- Modifier manuellement le plan d'un utilisateur (→ Free, Standard, Premium)
- Stats : total users, abonnements actifs, revenus du mois

---

## CARTES DE TEST STRIPE

En mode test, utilisez :
- **Paiement réussi** : `4242 4242 4242 4242`
- **Paiement refusé** : `4000 0000 0000 0002`
- **3D Secure** : `4000 0025 0000 3155`
- Date : n'importe quelle date future · CVC : n'importe quels 3 chiffres

---

## FLUX DE DONNÉES

```
Utilisateur s'inscrit
    ↓
Supabase Auth crée l'user
    ↓
Trigger SQL crée le profil (plan='free')
    ↓
Utilisateur va sur /upgrade → choisit un plan
    ↓
/api/stripe/checkout → Stripe Checkout Session
    ↓
Paiement réussi → Stripe envoie webhook
    ↓
/api/stripe/webhook → met à jour profiles (plan, status)
    ↓
Middleware vérifie le plan à chaque page
    ↓
dashboard/page.tsx lit le plan (Server Component)
    ↓
PokerApp reçoit plan → iframe avec le bon mode
```

---

## CHECKLIST MISE EN PRODUCTION

- [ ] Variables d'environnement toutes remplies dans Vercel
- [ ] Schéma SQL exécuté dans Supabase
- [ ] Produits Stripe créés avec les bons Price IDs
- [ ] Webhook Stripe configuré avec l'URL de production
- [ ] Email de confirmation Supabase fonctionne
- [ ] Test paiement avec carte 4242... en mode test
- [ ] Passage en mode Live Stripe (clés live_...)
- [ ] `ADMIN_EMAIL` configuré
- [ ] Fichiers HTML copiés dans `/public/`

---

## SUPPORT

Problèmes fréquents :

**"Webhook signature invalide"**
→ Vérifiez que `STRIPE_WEBHOOK_SECRET` correspond au secret de l'endpoint configuré dans Stripe

**"Plan ne se met pas à jour après paiement"**
→ Vérifiez que les métadonnées Stripe contiennent bien `supabase_user_id`
→ Vérifiez les logs webhook dans Stripe Dashboard → Webhooks → Events

**"Accès admin refusé"**
→ Vérifiez que `ADMIN_EMAIL` dans les env vars correspond exactement à votre email Supabase
