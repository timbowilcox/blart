-- ============================================================
-- BLART.AI Database Schema
-- Run this in Supabase SQL Editor to set up the database
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ART STYLES - Categories/styles for generation
-- ============================================================
CREATE TABLE art_styles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  prompt_prefix TEXT, -- Added to all generation prompts for this style
  reference_images TEXT[] DEFAULT '{}', -- URLs to reference images
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ARTWORKS - The main gallery pieces
-- ============================================================
CREATE TABLE artworks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  artist_name TEXT DEFAULT 'Blart AI',
  
  -- Image URLs (stored in Supabase Storage)
  image_url TEXT NOT NULL, -- Display image (~1200px)
  image_4k_url TEXT, -- Free downloadable 4K version
  thumbnail_url TEXT, -- Small thumbnail for grid
  
  -- Metadata
  style_id UUID REFERENCES art_styles(id),
  tags TEXT[] DEFAULT '{}',
  colors TEXT[] DEFAULT '{}', -- Dominant colors for filtering
  orientation TEXT CHECK (orientation IN ('portrait', 'landscape', 'square')) DEFAULT 'portrait',
  width_px INTEGER,
  height_px INTEGER,
  
  -- Generation data
  generation_prompt TEXT,
  generation_model TEXT,
  generation_params JSONB DEFAULT '{}',
  
  -- Status
  status TEXT CHECK (status IN ('draft', 'review', 'published', 'archived')) DEFAULT 'draft',
  is_featured BOOLEAN DEFAULT false,
  
  -- Stats
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  order_count INTEGER DEFAULT 0,
  
  -- Timestamps
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRINT PRODUCTS - Prodigi SKU mapping
-- ============================================================
CREATE TABLE print_products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  prodigi_sku TEXT NOT NULL,
  size_label TEXT NOT NULL, -- e.g. "A4", "A3", "A2", "30x40cm"
  size_inches TEXT, -- e.g. "12x16"
  frame_colors TEXT[] DEFAULT '{"black", "white", "natural"}',
  
  -- Pricing (in cents, AUD)
  base_cost_aud INTEGER, -- Prodigi cost (updated via quotes API)
  retail_price_aud INTEGER, -- Our price (cost + 50%)
  
  -- Product info
  has_mount BOOLEAN DEFAULT true,
  mount_colors TEXT[] DEFAULT '{"white"}',
  image_area_width_px INTEGER, -- Required image resolution
  image_area_height_px INTEGER,
  
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ORDERS - Customer orders
-- ============================================================
CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE, -- BLART-XXXXXX
  
  -- Customer info
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  
  -- Shipping address
  shipping_name TEXT NOT NULL,
  shipping_line1 TEXT NOT NULL,
  shipping_line2 TEXT,
  shipping_city TEXT NOT NULL,
  shipping_state TEXT,
  shipping_postal_code TEXT NOT NULL,
  shipping_country_code TEXT NOT NULL DEFAULT 'AU',
  shipping_phone TEXT,
  
  -- Order items
  items JSONB NOT NULL DEFAULT '[]',
  -- Each item: { artwork_id, print_product_id, frame_color, mount_color, quantity, unit_price }
  
  -- Pricing (cents AUD)
  subtotal INTEGER NOT NULL,
  shipping_cost INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  currency TEXT DEFAULT 'AUD',
  
  -- Payment
  stripe_payment_intent_id TEXT,
  stripe_session_id TEXT,
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')) DEFAULT 'pending',
  
  -- Fulfillment
  prodigi_order_id TEXT,
  prodigi_status TEXT,
  fulfillment_status TEXT CHECK (fulfillment_status IN ('pending', 'submitted', 'in_production', 'shipped', 'delivered', 'cancelled')) DEFAULT 'pending',
  
  -- Tracking
  tracking_url TEXT,
  tracking_number TEXT,
  
  -- Timestamps
  paid_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GENERATION QUEUE - For batch and daily generation
-- ============================================================
CREATE TABLE generation_queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Generation params
  style_id UUID REFERENCES art_styles(id),
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  reference_image_url TEXT,
  generation_params JSONB DEFAULT '{}',
  
  -- Status
  status TEXT CHECK (status IN ('queued', 'generating', 'completed', 'failed', 'published')) DEFAULT 'queued',
  error_message TEXT,
  
  -- Result
  result_image_url TEXT,
  result_artwork_id UUID REFERENCES artworks(id),
  
  -- Batch tracking
  batch_id TEXT, -- Group batch jobs together
  
  -- Review
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SITE SETTINGS - Key/value config
-- ============================================================
CREATE TABLE site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_artworks_status ON artworks(status);
CREATE INDEX idx_artworks_style ON artworks(style_id);
CREATE INDEX idx_artworks_slug ON artworks(slug);
CREATE INDEX idx_artworks_published ON artworks(published_at DESC) WHERE status = 'published';
CREATE INDEX idx_artworks_featured ON artworks(is_featured) WHERE status = 'published';
CREATE INDEX idx_artworks_tags ON artworks USING GIN(tags);
CREATE INDEX idx_orders_email ON orders(customer_email);
CREATE INDEX idx_orders_status ON orders(payment_status, fulfillment_status);
CREATE INDEX idx_generation_queue_status ON generation_queue(status);
CREATE INDEX idx_generation_queue_batch ON generation_queue(batch_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER artworks_updated_at BEFORE UPDATE ON artworks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER generation_queue_updated_at BEFORE UPDATE ON generation_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number = 'BLART-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_generate_number BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- Increment artwork stats
CREATE OR REPLACE FUNCTION increment_artwork_stat(artwork_uuid UUID, stat_name TEXT)
RETURNS VOID AS $$
BEGIN
  IF stat_name = 'view' THEN
    UPDATE artworks SET view_count = view_count + 1 WHERE id = artwork_uuid;
  ELSIF stat_name = 'download' THEN
    UPDATE artworks SET download_count = download_count + 1 WHERE id = artwork_uuid;
  ELSIF stat_name = 'order' THEN
    UPDATE artworks SET order_count = order_count + 1 WHERE id = artwork_uuid;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE art_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Public read for published artworks
CREATE POLICY "Public can view published artworks" ON artworks
  FOR SELECT USING (status = 'published');

-- Public read for active styles
CREATE POLICY "Public can view active styles" ON art_styles
  FOR SELECT USING (is_active = true);

-- Public read for active products
CREATE POLICY "Public can view active products" ON print_products
  FOR SELECT USING (is_active = true);

-- Service role has full access (for API routes)
CREATE POLICY "Service role full access artworks" ON artworks
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access styles" ON art_styles
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access products" ON print_products
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access orders" ON orders
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access generation" ON generation_queue
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access settings" ON site_settings
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- SEED DATA - Art Styles
-- ============================================================
INSERT INTO art_styles (name, slug, description, prompt_prefix, sort_order) VALUES
  ('Abstract Expressionism', 'abstract', 'Bold, gestural compositions with vibrant color fields and dynamic energy', 'In the style of abstract expressionism, bold gestural brushstrokes, vibrant color fields,', 1),
  ('Minimal Geometric', 'geometric', 'Clean geometric forms, precise lines, and harmonious compositions', 'Minimalist geometric art, clean precise lines, mathematical harmony,', 2),
  ('Ethereal Landscapes', 'landscapes', 'Dreamlike natural scenes with atmospheric light and soft gradients', 'Ethereal dreamlike landscape, atmospheric light, soft luminous gradients,', 3),
  ('Contemporary Botanical', 'botanical', 'Modern interpretations of plants and flowers with artistic flair', 'Contemporary botanical illustration, modern artistic interpretation,', 4),
  ('Neo-Impressionist', 'impressionist', 'Light-drenched scenes with visible brushwork and luminous color', 'Neo-impressionist style, visible brushwork, luminous dappled light,', 5),
  ('Monochrome Studies', 'monochrome', 'Sophisticated single-palette works exploring tone and texture', 'Monochromatic artwork, sophisticated tonal study, rich texture,', 6),
  ('Ocean & Water', 'ocean', 'Serene and powerful water compositions from gentle shores to deep seas', 'Artistic ocean and water scene, serene yet powerful composition,', 7),
  ('Modern Portrait', 'portrait', 'Stylized figurative work with contemporary artistic sensibility', 'Modern stylized portrait, contemporary artistic sensibility,', 8),
  ('Architectural', 'architectural', 'Striking structural forms and urban compositions', 'Architectural art, striking structural forms, dramatic perspective,', 9),
  ('Celestial & Cosmic', 'celestial', 'Space-inspired works with cosmic scale and wonder', 'Celestial cosmic artwork, vast scale, wonder and mystery,', 10);

-- ============================================================
-- SEED DATA - Print Products (Prodigi Classic Frames with Mount)
-- ============================================================
INSERT INTO print_products (name, description, prodigi_sku, size_label, size_inches, frame_colors, base_cost_aud, retail_price_aud, image_area_width_px, image_area_height_px, sort_order) VALUES
  ('Small Print', 'Classic framed with mount — 8×10"', 'GLOBAL-CFPM-8X10', '8×10"', '8x10', '{"black","white","natural","antique-silver","brown","antique-gold","dark-grey","light-grey"}', 3500, 5250, 1200, 1500, 1),
  ('Medium Print', 'Classic framed with mount — 12×16"', 'GLOBAL-CFPM-12X16', '12×16"', '12x16', '{"black","white","natural","antique-silver","brown","antique-gold","dark-grey","light-grey"}', 4500, 6750, 2400, 3200, 2),
  ('Large Print', 'Classic framed with mount — 16×20"', 'GLOBAL-CFPM-16X20', '16×20"', '16x20', '{"black","white","natural","antique-silver","brown","antique-gold","dark-grey","light-grey"}', 6000, 9000, 3000, 3750, 3),
  ('Extra Large Print', 'Classic framed with mount — 20×28"', 'GLOBAL-CFPM-20X28', '20×28"', '20x28', '{"black","white","natural","antique-silver","brown","antique-gold","dark-grey","light-grey"}', 8500, 12750, 3750, 5250, 4),
  ('Statement Print', 'Classic framed with mount — 24×36"', 'GLOBAL-CFPM-24X36', '24×36"', '24x36', '{"black","white","natural","antique-silver","brown","antique-gold","dark-grey","light-grey"}', 12000, 18000, 4500, 6750, 5);

-- ============================================================
-- SEED DATA - Site Settings
-- ============================================================
INSERT INTO site_settings (key, value) VALUES
  ('daily_generation_count', '10'),
  ('daily_generation_enabled', 'true'),
  ('markup_percentage', '50'),
  ('default_shipping_method', '"Standard"'),
  ('site_title', '"Blart — AI Generated Art"'),
  ('site_description', '"Unique AI-generated art prints. Free 4K downloads. Museum-quality framed prints delivered worldwide."');

-- ============================================================
-- STORAGE BUCKETS (run these separately in Supabase dashboard)
-- ============================================================
-- Create storage bucket 'artworks' with public access
-- CREATE POLICY "Public read artworks bucket" ON storage.objects
--   FOR SELECT USING (bucket_id = 'artworks');
