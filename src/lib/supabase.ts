import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey)

export const SUPABASE_PRODUCTS_TABLE =
  import.meta.env.VITE_SUPABASE_PRODUCTS_TABLE?.trim() || 'products'

export const SUPABASE_ADMINS_TABLE =
  import.meta.env.VITE_SUPABASE_ADMINS_TABLE?.trim() || 'admins'

export const SUPABASE_PRODUCT_IMAGES_BUCKET =
  import.meta.env.VITE_SUPABASE_PRODUCT_IMAGES_BUCKET?.trim() || 'product-images'

export const SUPABASE_ORDERS_TABLE =
  import.meta.env.VITE_SUPABASE_ORDERS_TABLE?.trim() || 'orders'

export const SUPABASE_STAFF_TABLE =
  import.meta.env.VITE_SUPABASE_STAFF_TABLE?.trim() || 'staff_members'

export const SUPABASE_STOCK_ALERTS_TABLE =
  import.meta.env.VITE_SUPABASE_STOCK_ALERTS_TABLE?.trim() || 'stock_alerts'

export const SUPABASE_SUPPORT_MESSAGES_TABLE =
  import.meta.env.VITE_SUPABASE_SUPPORT_MESSAGES_TABLE?.trim() || 'support_messages'

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabasePublishableKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null
