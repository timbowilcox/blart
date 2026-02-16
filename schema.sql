-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  stripe_customer_id TEXT UNIQUE,
  total_purchases INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Artworks table
CREATE TABLE IF NOT EXISTS artworks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  style TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  image_original_url TEXT NOT NULL,
  image_1080p_url TEXT,
  image_4k_url TEXT,
  image_8k_url TEXT,
  image_thumbnail_url TEXT,
  image_blur_hash TEXT,
  width INTEGER,
  height INTEGER,
  aspect_ratio TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'rejected')),
  generation_prompt TEXT,
  generation_model TEXT,
  generation_metadata JSONB,
  published_at TIMESTAMPTZ,
  instagram_post_id TEXT,
  download_count_free INTEGER DEFAULT 0,
  download_count_paid INTEGER DEFAULT 0,
  revenue_cents INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  print_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  artwork_id UUID NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  product_type TEXT NOT NULL CHECK (product_type IN ('digital_1080p', 'digital_4k', 'digital_8k', 'print_unframed', 'print_framed')),
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
  prodigi_order_id TEXT,
  prodigi_status TEXT,
  shipping_address JSONB,
  download_url TEXT,
  download_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Downloads table (for tracking)
CREATE TABLE IF NOT EXISTS downloads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  artwork_id UUID NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  resolution TEXT NOT NULL CHECK (resolution IN ('1080p', '4k', '8k')),
  is_paid BOOLEAN DEFAULT false,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Generations table (for tracking generated artworks)
CREATE TABLE IF NOT EXISTS generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id TEXT,
  prompt TEXT NOT NULL,
  style TEXT,
  model TEXT,
  parameters JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  artwork_id UUID REFERENCES artworks(id) ON DELETE SET NULL,
  error_message TEXT,
  cost_cents INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_artworks_status ON artworks(status);
CREATE INDEX idx_artworks_slug ON artworks(slug);
CREATE INDEX idx_artworks_published_at ON artworks(published_at);
CREATE INDEX idx_purchases_user_id ON purchases(user_id);
CREATE INDEX idx_purchases_artwork_id ON purchases(artwork_id);
CREATE INDEX idx_purchases_stripe_session_id ON purchases(stripe_session_id);
CREATE INDEX idx_downloads_artwork_id ON downloads(artwork_id);
CREATE INDEX idx_downloads_user_id ON downloads(user_id);
CREATE INDEX idx_downloads_created_at ON downloads(created_at);
CREATE INDEX idx_generations_batch_id ON generations(batch_id);
CREATE INDEX idx_generations_status ON generations(status);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read/update own record
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Artworks: Everyone can read published, only admins can read draft/rejected
CREATE POLICY "Anyone can read published artworks" ON artworks
  FOR SELECT USING (status = 'published');

CREATE POLICY "Admins can read all artworks" ON artworks
  FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Only admins can insert artworks" ON artworks
  FOR INSERT WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Only admins can update artworks" ON artworks
  FOR UPDATE USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Purchases: Users can read own, service role can insert
CREATE POLICY "Users can read own purchases" ON purchases
  FOR SELECT USING (auth.uid() = user_id);

-- Downloads: Anyone can insert (anonymous downloads), users can read own
CREATE POLICY "Anyone can insert downloads" ON downloads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can read own downloads" ON downloads
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Generations: Only admins can read
CREATE POLICY "Only admins can read generations" ON generations
  FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );
