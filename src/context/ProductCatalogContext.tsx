import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { PRODUCTS as FALLBACK_PRODUCTS } from '../data/products'
import { isSupabaseConfigured, supabase, SUPABASE_PRODUCTS_TABLE, SUPABASE_PRODUCT_IMAGES_BUCKET } from '../lib/supabase'
import type { Product } from '../types'

const LOCAL_STORAGE_KEY = 'sgs.catalog.products'

type CatalogMode = 'supabase' | 'local-preview'

interface ProductCatalogContextValue {
  products: Product[]
  isLoading: boolean
  error: string
  mode: CatalogMode
  refreshProducts: () => Promise<void>
  seedSampleCatalog: () => Promise<void>
  saveProduct: (product: Product) => Promise<void>
  deleteProduct: (productId: string) => Promise<void>
  uploadImage: (file: File) => Promise<string>
}

interface DatabaseProductRow {
  id: string
  name: string
  brand: string
  category_id: string
  pack_size: string
  price: number | string
  mrp: number | string | null
  image_url: string
  offer_text: string | null
  popular: boolean | null
  in_stock: boolean
}

const ProductCatalogContext = createContext<ProductCatalogContextValue | null>(null)

function mapRowToProduct(row: DatabaseProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    categoryId: row.category_id,
    packSize: row.pack_size,
    price: Number(row.price),
    mrp: row.mrp == null ? undefined : Number(row.mrp),
    imageUrl: row.image_url,
    offerText: row.offer_text || undefined,
    popular: Boolean(row.popular),
    inStock: row.in_stock,
  }
}

function mapProductToRow(product: Product): DatabaseProductRow {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    category_id: product.categoryId,
    pack_size: product.packSize,
    price: product.price,
    mrp: product.mrp ?? null,
    image_url: product.imageUrl,
    offer_text: product.offerText?.trim() || null,
    popular: Boolean(product.popular),
    in_stock: product.inStock,
  }
}

function readLocalProducts(): Product[] {
  try {
    const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!stored) return FALLBACK_PRODUCTS
    const parsed = JSON.parse(stored) as Product[]
    return parsed.length > 0 ? parsed : FALLBACK_PRODUCTS
  } catch {
    return FALLBACK_PRODUCTS
  }
}

function writeLocalProducts(products: Product[]) {
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(products))
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Unable to read the selected file.'))
    reader.readAsDataURL(file)
  })
}

function sanitizeFileName(fileName: string) {
  return fileName.toLowerCase().replace(/[^a-z0-9.-]+/g, '-')
}

export function ProductCatalogProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() =>
    isSupabaseConfigured ? FALLBACK_PRODUCTS : readLocalProducts(),
  )
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState('')

  const mode: CatalogMode = isSupabaseConfigured ? 'supabase' : 'local-preview'

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setProducts(readLocalProducts())
      setIsLoading(false)
      setError('')
      return
    }

    const client = supabase

    let isCancelled = false

    async function loadProducts() {
      setIsLoading(true)
      setError('')

      const { data, error: fetchError } = await client
        .from(SUPABASE_PRODUCTS_TABLE)
        .select(
          'id, name, brand, category_id, pack_size, price, mrp, image_url, offer_text, popular, in_stock',
        )
        .order('category_id', { ascending: true })
        .order('name', { ascending: true })

      if (isCancelled) return

      if (fetchError) {
        setProducts(FALLBACK_PRODUCTS)
        setError(fetchError.message)
      } else {
        setProducts((data as DatabaseProductRow[] | null)?.map(mapRowToProduct) ?? [])
      }

      setIsLoading(false)
    }

    void loadProducts()

    return () => {
      isCancelled = true
    }
  }, [])

  async function refreshProducts() {
    if (!isSupabaseConfigured || !supabase) {
      const nextProducts = readLocalProducts()
      setProducts(nextProducts)
      setError('')
      return
    }

    const client = supabase

    setIsLoading(true)
    setError('')

    const { data, error: fetchError } = await client
      .from(SUPABASE_PRODUCTS_TABLE)
      .select(
        'id, name, brand, category_id, pack_size, price, mrp, image_url, offer_text, popular, in_stock',
      )
      .order('category_id', { ascending: true })
      .order('name', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setProducts((data as DatabaseProductRow[] | null)?.map(mapRowToProduct) ?? [])
    }

    setIsLoading(false)
  }

  async function saveProduct(product: Product) {
    if (!isSupabaseConfigured || !supabase) {
      const existingIndex = products.findIndex((item) => item.id === product.id)
      const nextProducts =
        existingIndex >= 0
          ? products.map((item) => (item.id === product.id ? product : item))
          : [...products, product]

      writeLocalProducts(nextProducts)
      setProducts(nextProducts)
      setError('')
      return
    }

    const client = supabase

    const { data, error: saveError } = await client
      .from(SUPABASE_PRODUCTS_TABLE)
      .upsert(mapProductToRow(product))
      .select(
        'id, name, brand, category_id, pack_size, price, mrp, image_url, offer_text, popular, in_stock',
      )
      .single()

    if (saveError) {
      setError(saveError.message)
      throw saveError
    }

    const savedProduct = mapRowToProduct(data as DatabaseProductRow)
    setProducts((currentProducts) => {
      const exists = currentProducts.some((item) => item.id === savedProduct.id)
      return exists
        ? currentProducts.map((item) => (item.id === savedProduct.id ? savedProduct : item))
        : [...currentProducts, savedProduct].sort((left, right) => left.name.localeCompare(right.name))
    })
    setError('')
  }

  async function seedSampleCatalog() {
    if (!isSupabaseConfigured || !supabase) {
      writeLocalProducts(FALLBACK_PRODUCTS)
      setProducts(FALLBACK_PRODUCTS)
      setError('')
      return
    }

    const client = supabase
    const { error: seedError } = await client
      .from(SUPABASE_PRODUCTS_TABLE)
      .upsert(FALLBACK_PRODUCTS.map(mapProductToRow))

    if (seedError) {
      setError(seedError.message)
      throw seedError
    }

    await refreshProducts()
    setError('')
  }

  async function deleteProduct(productId: string) {
    if (!isSupabaseConfigured || !supabase) {
      const nextProducts = products.filter((product) => product.id !== productId)
      writeLocalProducts(nextProducts)
      setProducts(nextProducts)
      setError('')
      return
    }

    const client = supabase

    const { error: deleteError } = await client
      .from(SUPABASE_PRODUCTS_TABLE)
      .delete()
      .eq('id', productId)

    if (deleteError) {
      setError(deleteError.message)
      throw deleteError
    }

    setProducts((currentProducts) => currentProducts.filter((product) => product.id !== productId))
    setError('')
  }

  async function uploadImage(file: File) {
    if (!isSupabaseConfigured || !supabase) {
      return fileToDataUrl(file)
    }

    const client = supabase

    const objectPath = `products/${Date.now()}-${sanitizeFileName(file.name)}`
    const { error: uploadError } = await client.storage
      .from(SUPABASE_PRODUCT_IMAGES_BUCKET)
      .upload(objectPath, file, {
        upsert: true,
        cacheControl: '3600',
      })

    if (uploadError) {
      setError(uploadError.message)
      throw uploadError
    }

    const { data } = client.storage
      .from(SUPABASE_PRODUCT_IMAGES_BUCKET)
      .getPublicUrl(objectPath)

    setError('')
    return data.publicUrl
  }

  const value: ProductCatalogContextValue = {
    products,
    isLoading,
    error,
    mode,
    refreshProducts,
    seedSampleCatalog,
    saveProduct,
    deleteProduct,
    uploadImage,
  }

  return (
    <ProductCatalogContext.Provider value={value}>
      {children}
    </ProductCatalogContext.Provider>
  )
}

export function useProductCatalog() {
  const ctx = useContext(ProductCatalogContext)
  if (!ctx) throw new Error('useProductCatalog must be used within ProductCatalogProvider')
  return ctx
}
