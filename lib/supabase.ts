import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Client for browser (public operations)
// Will work properly once env vars are set
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

// Client for server-side operations (has full access with service role key)
export const supabaseServer = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : supabaseClient
