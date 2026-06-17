-- ============================================================
-- POKERPRO SAAS — SCHÉMA BASE DE DONNÉES SUPABASE
-- Exécutez ce fichier dans : Supabase Dashboard → SQL Editor
-- ============================================================

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE PROFILES
-- Créée automatiquement lors de l'inscription via trigger
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id                      UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email                   TEXT NOT NULL,
  full_name               TEXT,
  plan                    TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'standard', 'premium')),
  stripe_customer_id      TEXT UNIQUE,
  stripe_subscription_id  TEXT UNIQUE,
  subscription_status     TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'trialing', 'past_due', 'canceled', 'unpaid')),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS profiles_stripe_customer_id_idx ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS profiles_plan_idx ON profiles(plan);

-- ============================================================
-- TABLE HANDS (historique de mains importées)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hands (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  source      TEXT NOT NULL DEFAULT 'unknown',
  position    TEXT,
  cards       TEXT[],
  board       TEXT[],
  result      DECIMAL(10,2) DEFAULT 0,
  pf_action   TEXT,
  streets     JSONB DEFAULT '{}',
  raw         TEXT,
  played_at   TIMESTAMPTZ DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS hands_user_id_idx ON hands(user_id);
CREATE INDEX IF NOT EXISTS hands_played_at_idx ON hands(played_at DESC);

-- ============================================================
-- TRIGGER : Créer un profil automatiquement à l'inscription
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger déclenché à chaque nouvel utilisateur Supabase Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TRIGGER : Mise à jour de updated_at automatique
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hands ENABLE ROW LEVEL SECURITY;

-- Policies profiles : chaque user ne voit que son profil
CREATE POLICY "users_own_profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Policies hands : chaque user ne voit que ses mains
CREATE POLICY "users_own_hands" ON hands
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- VUE ADMIN (stats dashboard)
-- ============================================================
CREATE OR REPLACE VIEW public.admin_stats AS
SELECT
  COUNT(*) FILTER (WHERE plan = 'free')       AS free_users,
  COUNT(*) FILTER (WHERE plan = 'standard')   AS standard_users,
  COUNT(*) FILTER (WHERE plan = 'premium')    AS premium_users,
  COUNT(*)                                     AS total_users
FROM profiles;

-- ============================================================
-- GRANTS
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.hands TO anon, authenticated;
GRANT SELECT ON public.admin_stats TO authenticated;
