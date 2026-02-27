import { createClient } from '@supabase/supabase-js';

// Public client (browser-safe, respects RLS)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Admin client (server-only, bypasses RLS)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Types
export interface Artwork {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  artist_name: string;
  image_url: string;
  image_4k_url: string | null;
  thumbnail_url: string | null;
  style_id: string | null;
  tags: string[];
  colors: string[];
  orientation: 'portrait' | 'landscape' | 'square';
  width_px: number | null;
  height_px: number | null;
  status: 'draft' | 'review' | 'published' | 'archived';
  is_featured: boolean;
  view_count: number;
  download_count: number;
  order_count: number;
  published_at: string | null;
  created_at: string;
  art_styles?: ArtStyle;
}

export interface ArtStyle {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  prompt_prefix: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface PrintProduct {
  id: string;
  name: string;
  description: string | null;
  prodigi_sku: string;
  size_label: string;
  size_inches: string | null;
  frame_colors: string[];
  base_cost_aud: number;
  retail_price_aud: number;
  is_active: boolean;
  sort_order: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_email: string;
  customer_name: string | null;
  shipping_name: string;
  shipping_line1: string;
  shipping_line2: string | null;
  shipping_city: string;
  shipping_state: string | null;
  shipping_postal_code: string;
  shipping_country_code: string;
  items: OrderItem[];
  subtotal: number;
  shipping_cost: number;
  total: number;
  currency: string;
  stripe_payment_intent_id: string | null;
  stripe_session_id: string | null;
  payment_status: string;
  prodigi_order_id: string | null;
  fulfillment_status: string;
  tracking_url: string | null;
  created_at: string;
}

export interface OrderItem {
  artwork_id: string;
  artwork_title: string;
  artwork_image: string;
  print_product_id: string;
  size_label: string;
  prodigi_sku: string;
  frame_color: string;
  mount_color: string;
  quantity: number;
  unit_price: number;
}
