-- FleetBrain Database Schema
-- Run this in your Supabase SQL editor at https://supabase.com/dashboard

-- ─── Profiles ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  company_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Trucks ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trucks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  vin TEXT,
  mpg DECIMAL(4,2) NOT NULL DEFAULT 7.0,
  maintenance_cost_per_mile DECIMAL(6,4) NOT NULL DEFAULT 0.20,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'on_load', 'maintenance')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE trucks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own trucks" ON trucks
  FOR ALL USING (auth.uid() = user_id);

-- ─── Loads ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  truck_id UUID REFERENCES trucks(id) ON DELETE SET NULL,

  -- Route
  origin TEXT,
  destination TEXT,
  pickup_date DATE,
  delivery_date DATE,
  commodity TEXT,

  -- Financials
  revenue DECIMAL(10,2) NOT NULL,
  loaded_miles DECIMAL(8,2) NOT NULL,
  deadhead_miles DECIMAL(8,2) NOT NULL DEFAULT 0,
  fuel_price DECIMAL(6,4),
  fuel_cost DECIMAL(10,2),
  toll_cost DECIMAL(10,2) DEFAULT 0,
  driver_pay DECIMAL(10,2) DEFAULT 0,
  maintenance_allocation DECIMAL(10,2),
  net_profit DECIMAL(10,2),
  profit_per_mile DECIMAL(8,4),

  -- AI
  ai_rating TEXT CHECK (ai_rating IN ('EXCELLENT', 'GOOD', 'AVERAGE', 'POOR')),
  ai_recommendation TEXT,
  ai_analysis JSONB,
  screenshot_url TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'analyzed' CHECK (status IN ('analyzed', 'accepted', 'rejected', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE loads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own loads" ON loads
  FOR ALL USING (auth.uid() = user_id);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS loads_user_id_idx ON loads(user_id);
CREATE INDEX IF NOT EXISTS loads_created_at_idx ON loads(created_at DESC);
CREATE INDEX IF NOT EXISTS trucks_user_id_idx ON trucks(user_id);
