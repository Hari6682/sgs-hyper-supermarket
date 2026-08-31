/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RAZORPAY_KEY_ID: string
  readonly VITE_ORDER_API_BASE_URL: string
  readonly VITE_GOOGLE_MAPS_API_KEY?: string
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
  readonly VITE_SUPABASE_PRODUCTS_TABLE?: string
  readonly VITE_SUPABASE_ADMINS_TABLE?: string
  readonly VITE_SUPABASE_PRODUCT_IMAGES_BUCKET?: string
  readonly VITE_SUPABASE_ORDERS_TABLE?: string
  readonly VITE_SUPABASE_STAFF_TABLE?: string
  readonly VITE_SUPABASE_STOCK_ALERTS_TABLE?: string
  readonly VITE_SUPABASE_SUPPORT_MESSAGES_TABLE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
