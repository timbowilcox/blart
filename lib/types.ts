export interface Artwork {
  id: string
  title: string
  description: string | null
  slug: string
  style: string
  tags: string[]
  image_original_url: string
  image_1080p_url: string | null
  image_4k_url: string | null
  image_8k_url: string | null
  image_thumbnail_url: string | null
  image_blur_hash: string | null
  width: number | null
  height: number | null
  aspect_ratio: string | null
  status: 'draft' | 'published' | 'rejected'
  generation_prompt: string | null
  generation_model: string | null
  generation_metadata: Record<string, any> | null
  published_at: string | null
  instagram_post_id: string | null
  download_count_free: number
  download_count_paid: number
  revenue_cents: number
  is_featured: boolean
  print_available: boolean
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  display_name: string | null
  email: string
  avatar_url: string | null
  role: 'user' | 'admin'
  stripe_customer_id: string | null
  total_purchases: number
  created_at: string
}

export interface Purchase {
  id: string
  user_id: string
  artwork_id: string
  product_type: 'digital_1080p' | 'digital_4k' | 'digital_8k' | 'print_unframed' | 'print_framed'
  amount_cents: number
  currency: string
  stripe_session_id: string | null
  stripe_payment_intent: string | null
  status: 'pending' | 'completed' | 'refunded' | 'failed'
  prodigi_order_id: string | null
  prodigi_status: string | null
  shipping_address: Record<string, any> | null
  download_url: string | null
  download_expires_at: string | null
  created_at: string
  updated_at: string
}

export interface Download {
  id: string
  user_id: string | null
  artwork_id: string
  resolution: '1080p' | '4k' | '8k'
  is_paid: boolean
  ip_address: string | null
  user_agent: string | null
  created_at: string
}
