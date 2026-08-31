import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { CATEGORIES, getCategoryById } from '../data/categories'
import { getStoreById, STORES } from '../data/stores'
import { useOrderCenter } from '../context/OrderCenterContext'
import { useProductCatalog } from '../context/ProductCatalogContext'
import {
  isSupabaseConfigured,
  supabase,
  SUPABASE_STOCK_ALERTS_TABLE,
  SUPABASE_SUPPORT_MESSAGES_TABLE,
} from '../lib/supabase'
import { discountPercent, formatRupees } from '../lib/currency'
import { useStaffSession } from '../hooks/useStaffSession'
import type { CompanyRole, OrderStatus, Product, StockAlertRequest, SupportMessage } from '../types'

const EMPTY_PRODUCT: Product = {
  id: '',
  name: '',
  brand: '',
  categoryId: CATEGORIES[0]?.id ?? '',
  packSize: '',
  price: 0,
  mrp: undefined,
  imageUrl: '',
  offerText: '',
  popular: false,
  inStock: true,
}

type PortalTab = 'products' | 'orders' | 'alerts' | 'support'

interface AdminPanelProps {
  initialTab?: PortalTab
  onBackToStore: () => void
}

function Notice({ message, tone }: { message: string; tone: 'error' | 'success' }) {
  return (
    <p
      className={`rounded-2xl px-4 py-3 text-sm ${
        tone === 'error' ? 'bg-sgs-tomato/10 text-sgs-tomato' : 'bg-sgs-sage/70 text-sgs-green-dark'
      }`}
    >
      {message}
    </p>
  )
}

function SecurityShell({
  title,
  subtitle,
  children,
  onBackToStore,
}: {
  title: string
  subtitle: string
  children: ReactNode
  onBackToStore: () => void
}) {
  return (
    <main className="min-h-screen bg-sgs-ink px-3 py-5 text-sgs-cream sm:px-4 sm:py-10">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur sm:rounded-[28px] sm:p-8">
          <p className="mb-4 inline-flex rounded-full border border-white/15 px-3 py-1 text-xs uppercase tracking-[0.24em] text-sgs-mango">
            Secure Staff Access
          </p>
          <h1 className="mb-4 font-display text-3xl font-bold leading-tight sm:text-4xl">{title}</h1>
          <p className="max-w-xl text-sm text-white/70">{subtitle}</p>
        </section>

        <section className="rounded-[24px] bg-sgs-cream p-5 text-sgs-ink sm:rounded-[28px] sm:p-8">
          <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sgs-green-dark/70">
                Access Control
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold">Staff security</h2>
            </div>
            <button
              onClick={onBackToStore}
              className="rounded-full border border-sgs-line px-4 py-2 text-sm font-medium hover:border-sgs-green"
            >
              Back to store
            </button>
          </div>
          {children}
        </section>
      </div>
    </main>
  )
}

function canManageCatalog(role: CompanyRole | null) {
  return role === 'owner' || role === 'admin'
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function buildProductDraft(product?: Product): Product {
  if (!product) return { ...EMPTY_PRODUCT }
  return { ...product, offerText: product.offerText ?? '' }
}

function orderStatusOptions(currentStatus: OrderStatus) {
  const allStatuses: OrderStatus[] = ['PLACED', 'CONFIRMED', 'READY', 'COMPLETED', 'CANCELLED']
  return allStatuses.filter((status) => status !== currentStatus)
}

function formatStatus(status: OrderStatus) {
  switch (status) {
    case 'PLACED':
      return 'Placed'
    case 'CONFIRMED':
      return 'Confirmed'
    case 'READY':
      return 'Ready for Pickup'
    case 'COMPLETED':
      return 'Completed'
    case 'CANCELLED':
      return 'Cancelled'
    default:
      return status
  }
}

function readLocalList<T>(key: string): T[] {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

export default function AdminPanel({ initialTab = 'products', onBackToStore }: AdminPanelProps) {
  const {
    products,
    isLoading: isProductsLoading,
    error: productError,
    saveProduct,
    deleteProduct,
    uploadImage,
    refreshProducts,
    seedSampleCatalog,
  } = useProductCatalog()
  const {
    orders,
    isLoading: isOrdersLoading,
    error: orderError,
    refreshOrders,
    updateOrderStatus,
    subscribeToOrders,
  } = useOrderCenter()
  const staffSession = useStaffSession()

  const [activeTab, setActiveTab] = useState<PortalTab>(initialTab)
  const [editorMessage, setEditorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const [productSearch, setProductSearch] = useState('')
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all')
  const [selectedProductId, setSelectedProductId] = useState<string | null>(products[0]?.id ?? null)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [draft, setDraft] = useState<Product>(buildProductDraft(products[0]))

  const [orderSearch, setOrderSearch] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [orderStoreFilter, setOrderStoreFilter] = useState<string>('all')
  const [orderNotes, setOrderNotes] = useState<Record<string, string>>({})

  const [stockAlerts, setStockAlerts] = useState<StockAlertRequest[]>([])
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([])
  const [inboxError, setInboxError] = useState('')

  const catalogAllowed = canManageCatalog(staffSession.role)
  const availableTabs = useMemo<PortalTab[]>(
    () => (catalogAllowed ? ['products', 'orders', 'alerts', 'support'] : ['orders', 'alerts', 'support']),
    [catalogAllowed],
  )

  useEffect(() => {
    if (!availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0])
    }
  }, [activeTab, availableTabs])

  useEffect(() => {
    if (!selectedProductId) {
      if (!isCreatingNew && products[0]) {
        setSelectedProductId(products[0].id)
        setDraft(buildProductDraft(products[0]))
      }
      return
    }

    const selectedProduct = products.find((product) => product.id === selectedProductId)
    if (selectedProduct) {
      setIsCreatingNew(false)
      setDraft(buildProductDraft(selectedProduct))
    }
  }, [isCreatingNew, products, selectedProductId])

  useEffect(() => {
    if (staffSession.authStage !== 'ready') return

    void refreshOrders()
    const unsubscribe = subscribeToOrders(() => {
      void refreshOrders()
    })

    return unsubscribe
  }, [refreshOrders, staffSession.authStage, subscribeToOrders])

  useEffect(() => {
    if (staffSession.authStage !== 'ready') return

    async function loadInboxData() {
      if (!isSupabaseConfigured || !supabase) {
        setStockAlerts(readLocalList<StockAlertRequest>('sgs.stockAlerts'))
        setSupportMessages(readLocalList<SupportMessage>('sgs.supportMessages'))
        setInboxError('')
        return
      }

      const [alertsResponse, supportResponse] = await Promise.all([
        supabase
          .from(SUPABASE_STOCK_ALERTS_TABLE)
          .select('id, product_id, product_name, customer_name, email, mobile_number, created_at, notified')
          .order('created_at', { ascending: false }),
        supabase
          .from(SUPABASE_SUPPORT_MESSAGES_TABLE)
          .select('id, full_name, email, mobile_number, subject, message, created_at')
          .order('created_at', { ascending: false }),
      ])

      if (alertsResponse.error || supportResponse.error) {
        setInboxError(alertsResponse.error?.message || supportResponse.error?.message || 'Unable to load staff inbox data.')
        return
      }

      setStockAlerts(
        (alertsResponse.data ?? []).map((row) => ({
          id: row.id,
          productId: row.product_id,
          productName: row.product_name,
          customerName: row.customer_name,
          email: row.email ?? undefined,
          mobileNumber: row.mobile_number ?? undefined,
          createdAt: row.created_at,
          notified: row.notified,
        })),
      )
      setSupportMessages(
        (supportResponse.data ?? []).map((row) => ({
          id: row.id,
          fullName: row.full_name,
          email: row.email ?? undefined,
          mobileNumber: row.mobile_number ?? undefined,
          subject: row.subject,
          message: row.message,
          createdAt: row.created_at,
        })),
      )
      setInboxError('')
    }

    void loadInboxData()
  }, [staffSession.authStage])

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase()
    return [...products]
      .filter((product) => {
        if (productCategoryFilter !== 'all' && product.categoryId !== productCategoryFilter) return false
        if (!query) return true
        return `${product.id} ${product.name} ${product.brand}`.toLowerCase().includes(query)
      })
      .sort((left, right) => left.name.localeCompare(right.name))
  }, [productCategoryFilter, productSearch, products])

  const filteredOrders = useMemo(() => {
    const query = orderSearch.trim().toLowerCase()
    return orders
      .filter((order) => {
        if (staffSession.role === 'worker' && staffSession.storeId && order.storeId !== staffSession.storeId) return false
        if (orderStatusFilter !== 'all' && order.orderStatus !== orderStatusFilter) return false
        if (orderStoreFilter !== 'all' && order.storeId !== orderStoreFilter) return false
        if (!query) return true
        return `${order.orderNumber} ${order.customer.fullName} ${order.customer.mobileNumber}`.toLowerCase().includes(query)
      })
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
  }, [orderSearch, orderStatusFilter, orderStoreFilter, orders, staffSession.role, staffSession.storeId])

  const discount = discountPercent(Number(draft.price), draft.mrp)

  function startNewProduct() {
    setIsCreatingNew(true)
    setSelectedProductId(null)
    setDraft(buildProductDraft())
    setEditorMessage('')
  }

  async function handleProductSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!catalogAllowed) {
      setEditorMessage('Only owners and admins can edit the catalog.')
      return
    }

    const generatedId = draft.id.trim() || slugify(draft.name) || `product-${Date.now()}`
    const existingProduct = products.find((product) => product.id === generatedId)
    if (existingProduct && existingProduct.id !== selectedProductId) {
      setEditorMessage(`Product ID "${generatedId}" is already in use. Choose a different ID.`)
      return
    }

    const normalizedProduct: Product = {
      ...draft,
      id: generatedId,
      name: draft.name.trim(),
      brand: draft.brand.trim(),
      packSize: draft.packSize.trim(),
      imageUrl: draft.imageUrl.trim(),
      offerText: draft.offerText?.trim() || undefined,
      price: Number(draft.price),
      mrp: draft.mrp ? Number(draft.mrp) : undefined,
    }

    setIsSubmitting(true)
    setEditorMessage('')

    try {
      await saveProduct(normalizedProduct)
      setIsCreatingNew(false)
      setSelectedProductId(normalizedProduct.id)
      setDraft(buildProductDraft(normalizedProduct))
      setEditorMessage(`Saved ${normalizedProduct.name}.`)
    } catch {
      setEditorMessage('Unable to save this product right now.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteProduct() {
    if (!draft.id || !catalogAllowed) return
    if (!window.confirm(`Delete ${draft.name || draft.id}?`)) return

    setIsSubmitting(true)
    setEditorMessage('')

    try {
      await deleteProduct(draft.id)
      const nextProduct = filteredProducts.find((product) => product.id !== draft.id)
      setSelectedProductId(nextProduct?.id ?? null)
      setDraft(buildProductDraft(nextProduct))
      setEditorMessage('Product deleted.')
    } catch {
      setEditorMessage('Unable to delete this product right now.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSeedCatalog() {
    setIsSubmitting(true)
    setEditorMessage('')

    try {
      await seedSampleCatalog()
      setEditorMessage('Sample catalog copied into Supabase.')
    } catch {
      setEditorMessage('Unable to seed the sample catalog right now.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setEditorMessage('')

    try {
      const imageUrl = await uploadImage(file)
      setDraft((currentDraft) => ({ ...currentDraft, imageUrl }))
      setEditorMessage('Image uploaded and linked to this product draft.')
    } catch {
      setEditorMessage('Image upload failed.')
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  async function handleOrderStatusChange(orderNumber: string, nextStatus: OrderStatus) {
    try {
      await updateOrderStatus(orderNumber, nextStatus, orderNotes[orderNumber] || undefined)
      setEditorMessage(`Order ${orderNumber} updated to ${formatStatus(nextStatus)}.`)
    } catch {
      setEditorMessage(`Could not update order ${orderNumber}.`)
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <SecurityShell
        title="Configure Supabase before opening staff tools."
        subtitle="This portal is locked until auth, tables, and storage are connected through Supabase."
        onBackToStore={onBackToStore}
      >
        <div className="space-y-4 rounded-2xl border border-sgs-line bg-white p-5 text-sm text-sgs-ink/75">
          <p>Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to `.env`.</p>
          <p>Run the latest `supabase/schema.sql` again so orders, staff roles, support, and stock alerts are created.</p>
        </div>
      </SecurityShell>
    )
  }

  if (staffSession.isCheckingAccess && staffSession.authStage !== 'ready') {
    return (
      <SecurityShell
        title="Checking staff access."
        subtitle="Verifying your session, role, and MFA status before opening the portal."
        onBackToStore={onBackToStore}
      >
        <div className="rounded-2xl border border-sgs-line bg-white p-6 text-sm text-sgs-ink/70">
          Verifying your staff access…
        </div>
      </SecurityShell>
    )
  }

  if (staffSession.authStage === 'sign-in') {
    return (
      <SecurityShell
        title="Sign in before managing products or orders."
        subtitle="Owners, admins, and workers use the same email/password sign-in and then verify with MFA."
        onBackToStore={onBackToStore}
      >
        <form className="space-y-4" onSubmit={staffSession.handleLogin}>
          <input
            type="email"
            value={staffSession.loginEmail}
            onChange={(event) => staffSession.setLoginEmail(event.target.value)}
            className="w-full rounded-2xl border border-sgs-line px-4 py-3"
            placeholder="Staff email"
            required
          />
          <input
            type="password"
            value={staffSession.loginPassword}
            onChange={(event) => staffSession.setLoginPassword(event.target.value)}
            className="w-full rounded-2xl border border-sgs-line px-4 py-3"
            placeholder="Password"
            required
          />
          {staffSession.authError ? <Notice message={staffSession.authError} tone="error" /> : null}
          {!staffSession.authError && staffSession.authMessage ? <Notice message={staffSession.authMessage} tone="success" /> : null}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={staffSession.isSecurityBusy}
              className="rounded-full bg-sgs-green px-5 py-3 font-medium text-sgs-cream hover:bg-sgs-green-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {staffSession.isSecurityBusy ? 'Signing in…' : 'Sign in'}
            </button>
            <button
              type="button"
              onClick={() => void staffSession.handleSendResetEmail()}
              disabled={staffSession.isSecurityBusy}
              className="rounded-full border border-sgs-line px-5 py-3 font-medium hover:border-sgs-green disabled:cursor-not-allowed disabled:opacity-60"
            >
              Send setup/reset email
            </button>
          </div>
        </form>
      </SecurityShell>
    )
  }

  if (staffSession.authStage === 'recovery') {
    return (
      <SecurityShell
        title="Set a new password."
        subtitle="Finish account recovery here, then continue to MFA setup or verification."
        onBackToStore={onBackToStore}
      >
        <form className="space-y-4" onSubmit={staffSession.handleRecoveryPassword}>
          <input
            type="password"
            value={staffSession.recoveryPassword}
            onChange={(event) => staffSession.setRecoveryPassword(event.target.value)}
            className="w-full rounded-2xl border border-sgs-line px-4 py-3"
            placeholder="New password"
            required
          />
          <input
            type="password"
            value={staffSession.recoveryPasswordConfirm}
            onChange={(event) => staffSession.setRecoveryPasswordConfirm(event.target.value)}
            className="w-full rounded-2xl border border-sgs-line px-4 py-3"
            placeholder="Confirm password"
            required
          />
          {staffSession.authError ? <Notice message={staffSession.authError} tone="error" /> : null}
          {!staffSession.authError && staffSession.authMessage ? <Notice message={staffSession.authMessage} tone="success" /> : null}
          <button
            type="submit"
            disabled={staffSession.isSecurityBusy}
            className="rounded-full bg-sgs-green px-5 py-3 font-medium text-sgs-cream hover:bg-sgs-green-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            Save password
          </button>
        </form>
      </SecurityShell>
    )
  }

  if (staffSession.authStage === 'no-access') {
    return (
      <SecurityShell
        title="This account is not linked to the company staff list."
        subtitle="The email signed in, but it is not approved in `staff_members` or `admins`."
        onBackToStore={onBackToStore}
      >
        <div className="space-y-4">
          <p className="rounded-2xl border border-sgs-line bg-white p-5 text-sm text-sgs-ink/75">
            Signed in as <span className="font-semibold text-sgs-ink">{staffSession.sessionEmail}</span>.
          </p>
          {staffSession.authError ? <Notice message={staffSession.authError} tone="error" /> : null}
          <button
            onClick={() => void staffSession.handleLogout()}
            className="rounded-full border border-sgs-line px-5 py-3 font-medium hover:border-sgs-green"
          >
            Sign out
          </button>
        </div>
      </SecurityShell>
    )
  }

  if (staffSession.authStage === 'mfa-setup') {
    return (
      <SecurityShell
        title="Set up authenticator MFA."
        subtitle="Every owner, admin, or worker must enroll a verified TOTP app before this portal unlocks."
        onBackToStore={onBackToStore}
      >
        <div className="space-y-4">
          {!staffSession.hasEnrollmentInProgress ? (
            <form className="space-y-4" onSubmit={staffSession.handleEnrollMfa}>
              <input
                value={staffSession.enrollmentName}
                onChange={(event) => staffSession.setEnrollmentName(event.target.value)}
                className="w-full rounded-2xl border border-sgs-line px-4 py-3"
                placeholder="Authenticator label"
              />
              <button
                type="submit"
                disabled={staffSession.isSecurityBusy}
                className="rounded-full bg-sgs-green px-5 py-3 font-medium text-sgs-cream hover:bg-sgs-green-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                Generate authenticator setup
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <img
                src={staffSession.enrollmentQrCode}
                alt="Authenticator QR code"
                className="h-56 w-56 rounded-2xl border border-sgs-line bg-white p-3"
              />
              <p className="text-xs text-sgs-ink/60">Manual secret: {staffSession.enrollmentSecret}</p>
              <p className="break-all text-xs text-sgs-ink/50">{staffSession.enrollmentUri}</p>
              <form className="space-y-3" onSubmit={staffSession.handleVerifyNewFactor}>
                <input
                  value={staffSession.mfaCode}
                  onChange={(event) => staffSession.setMfaCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  className="w-full rounded-2xl border border-sgs-line px-4 py-3"
                  placeholder="Authenticator code"
                  required
                />
                <button
                  type="submit"
                  disabled={staffSession.isSecurityBusy}
                  className="rounded-full bg-sgs-green px-5 py-3 font-medium text-sgs-cream hover:bg-sgs-green-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Verify MFA
                </button>
              </form>
            </div>
          )}
          {staffSession.authError ? <Notice message={staffSession.authError} tone="error" /> : null}
          {!staffSession.authError && staffSession.authMessage ? <Notice message={staffSession.authMessage} tone="success" /> : null}
        </div>
      </SecurityShell>
    )
  }

  if (staffSession.authStage === 'mfa-challenge') {
    return (
      <SecurityShell
        title="Verify your authenticator code."
        subtitle="Password sign-in succeeded, but a second factor is still required before products or orders can be touched."
        onBackToStore={onBackToStore}
      >
        <form className="space-y-4" onSubmit={staffSession.handleVerifyExistingFactor}>
          {staffSession.verifiedFactors.length > 1 ? (
            <select
              value={staffSession.selectedFactorId}
              onChange={(event) => staffSession.setSelectedFactorId(event.target.value)}
              className="w-full rounded-2xl border border-sgs-line px-4 py-3"
            >
              {staffSession.verifiedFactors.map((factor) => (
                <option key={factor.id} value={factor.id}>
                  {factor.friendlyName || 'Authenticator app'}
                </option>
              ))}
            </select>
          ) : null}
          <input
            value={staffSession.mfaCode}
            onChange={(event) => staffSession.setMfaCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            className="w-full rounded-2xl border border-sgs-line px-4 py-3"
            placeholder="Authenticator code"
            required
          />
          {staffSession.authError ? <Notice message={staffSession.authError} tone="error" /> : null}
          {!staffSession.authError && staffSession.authMessage ? <Notice message={staffSession.authMessage} tone="success" /> : null}
          <button
            type="submit"
            disabled={staffSession.isSecurityBusy || !staffSession.selectedFactorId}
            className="rounded-full bg-sgs-green px-5 py-3 font-medium text-sgs-cream hover:bg-sgs-green-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            Verify MFA
          </button>
        </form>
      </SecurityShell>
    )
  }

  return (
    <main className="min-h-screen bg-[#f4efe5] px-3 py-5 sm:px-4 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sgs-green-dark/70">
              SGS Staff Portal
            </p>
            <h1 className="font-display text-2xl font-bold text-sgs-ink sm:text-3xl">
              {catalogAllowed ? 'Catalog, orders, support, and stock alerts' : 'Orders, support, and stock alerts'}
            </h1>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">
            <span className="rounded-full bg-sgs-green px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sgs-cream">
              {staffSession.role ?? 'staff'} · {staffSession.aal === 'aal2' ? 'AAL2' : 'AAL1'}
            </span>
            <a
              href="/staff"
              className="rounded-full border border-sgs-line bg-white px-4 py-2 text-sm font-medium hover:border-sgs-green"
            >
              Worker view
            </a>
            <button
              onClick={() => void staffSession.handleLogout()}
              className="rounded-full border border-sgs-line bg-white px-4 py-2 text-sm font-medium hover:border-sgs-green"
            >
              Sign out
            </button>
            <button
              onClick={onBackToStore}
              className="rounded-full bg-sgs-green px-4 py-2 text-sm font-medium text-sgs-cream hover:bg-sgs-green-dark"
            >
              View storefront
            </button>
          </div>
        </div>

        {staffSession.authError ? <div className="mb-4"><Notice message={staffSession.authError} tone="error" /></div> : null}
        {!staffSession.authError && (productError || orderError || inboxError) ? (
          <div className="mb-4">
            <Notice message={productError || orderError || inboxError} tone="error" />
          </div>
        ) : null}
        {!staffSession.authError && !productError && !orderError && !inboxError && (staffSession.authMessage || editorMessage) ? (
          <div className="mb-4">
            <Notice message={staffSession.authMessage || editorMessage} tone="success" />
          </div>
        ) : null}

        <div className="mb-6 grid gap-6 xl:grid-cols-3">
          <section className="rounded-[28px] border border-sgs-line bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sgs-green-dark/70">Session</p>
            <h2 className="mt-2 font-display text-xl font-bold text-sgs-ink">Logged in</h2>
            <p className="mt-3 text-sm text-sgs-ink/70">{staffSession.sessionEmail}</p>
            <p className="mt-2 text-sm text-sgs-ink/60">
              Role: <span className="font-medium text-sgs-ink">{staffSession.role ?? 'unknown'}</span>
            </p>
            {staffSession.role === 'worker' && (
              <p className="mt-2 text-sm text-sgs-ink/60">
                Assigned store:{' '}
                <span className="font-medium text-sgs-ink">
                  {staffSession.storeId
                    ? getStoreById(staffSession.storeId)?.area ?? staffSession.storeId
                    : 'No store assigned'}
                </span>
              </p>
            )}
          </section>

          <section className="rounded-[28px] border border-sgs-line bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sgs-green-dark/70">Email</p>
            <h2 className="mt-2 font-display text-xl font-bold text-sgs-ink">Account email</h2>
            <form className="mt-4 space-y-3" onSubmit={staffSession.handleUpdateEmail}>
              <input
                type="email"
                value={staffSession.pendingEmail}
                onChange={(event) => staffSession.setPendingEmail(event.target.value)}
                className="w-full rounded-2xl border border-sgs-line px-4 py-3"
                placeholder="Staff email"
                required
              />
              <button
                type="submit"
                disabled={staffSession.isSecurityBusy}
                className="rounded-full border border-sgs-line px-4 py-2 text-sm font-medium hover:border-sgs-green disabled:cursor-not-allowed disabled:opacity-60"
              >
                Update email
              </button>
            </form>
          </section>

          <section className="rounded-[28px] border border-sgs-line bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sgs-green-dark/70">Password</p>
            <h2 className="mt-2 font-display text-xl font-bold text-sgs-ink">Password settings</h2>
            <form className="mt-4 space-y-3" onSubmit={staffSession.handleUpdatePassword}>
              <input
                type="password"
                value={staffSession.currentPassword}
                onChange={(event) => staffSession.setCurrentPassword(event.target.value)}
                className="w-full rounded-2xl border border-sgs-line px-4 py-3"
                placeholder="Current password"
              />
              <input
                type="password"
                value={staffSession.newPassword}
                onChange={(event) => staffSession.setNewPassword(event.target.value)}
                className="w-full rounded-2xl border border-sgs-line px-4 py-3"
                placeholder="New password"
                required
              />
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={staffSession.isSecurityBusy}
                  className="rounded-full border border-sgs-line px-4 py-2 text-sm font-medium hover:border-sgs-green disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Save password
                </button>
                <button
                  type="button"
                  onClick={() => void staffSession.handleSendResetEmail(staffSession.sessionEmail)}
                  disabled={staffSession.isSecurityBusy}
                  className="rounded-full border border-sgs-line px-4 py-2 text-sm font-medium hover:border-sgs-green disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Send reset email
                </button>
              </div>
            </form>
          </section>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {availableTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                activeTab === tab ? 'bg-sgs-green text-sgs-cream' : 'border border-sgs-line bg-white hover:border-sgs-green'
              }`}
            >
              {tab === 'products' ? 'Products' : tab === 'orders' ? 'Orders' : tab === 'alerts' ? 'Stock Alerts' : 'Support'}
            </button>
          ))}
        </div>

        {activeTab === 'products' && catalogAllowed && (
          <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="rounded-[28px] border border-sgs-line bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-sgs-ink">Catalog</h2>
                <button
                  onClick={startNewProduct}
                  className="rounded-full border border-sgs-line px-3 py-1.5 text-sm font-medium hover:border-sgs-green"
                >
                  New product
                </button>
              </div>
              <div className="space-y-3 mb-4">
                <input
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                  className="w-full rounded-2xl border border-sgs-line px-4 py-3 text-sm"
                  placeholder="Search by name, brand, or ID"
                />
                <select
                  value={productCategoryFilter}
                  onChange={(event) => setProductCategoryFilter(event.target.value)}
                  className="w-full rounded-2xl border border-sgs-line px-4 py-3 text-sm"
                >
                  <option value="all">All categories</option>
                  {CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              {isProductsLoading ? (
                <p className="text-sm text-sgs-ink/60">Loading products…</p>
              ) : (
                <div className="space-y-2">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => setSelectedProductId(product.id)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
                        selectedProductId === product.id ? 'border-sgs-green bg-sgs-sage/60' : 'border-sgs-line hover:border-sgs-green'
                      }`}
                    >
                      <p className="truncate text-sm font-semibold text-sgs-ink">{product.name}</p>
                      <p className="truncate text-xs text-sgs-ink/55">
                        {product.id} · {getCategoryById(product.categoryId)?.name ?? product.categoryId}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </aside>

            <section className="rounded-[32px] border border-sgs-line bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sgs-green-dark/70">Product editor</p>
                  <h2 className="mt-1 font-display text-2xl font-bold text-sgs-ink">
                    {selectedProductId ? 'Edit product' : 'Create product'}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => void refreshProducts()}
                    className="rounded-full border border-sgs-line px-4 py-2 text-sm font-medium hover:border-sgs-green"
                  >
                    Refresh
                  </button>
                  <button
                    onClick={() => void handleSeedCatalog()}
                    disabled={isSubmitting}
                    className="rounded-full border border-sgs-line px-4 py-2 text-sm font-medium hover:border-sgs-green disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Seed sample catalog
                  </button>
                </div>
              </div>

              <form className="grid gap-4 md:grid-cols-2" onSubmit={handleProductSave}>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">Product ID</span>
                  <input
                    value={draft.id}
                    onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, id: event.target.value }))}
                    className="w-full rounded-2xl border border-sgs-line px-4 py-3"
                    placeholder="Leave blank to auto-generate"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">Category</span>
                  <select
                    value={draft.categoryId}
                    onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, categoryId: event.target.value }))}
                    className="w-full rounded-2xl border border-sgs-line px-4 py-3"
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block md:col-span-2">
                  <span className="mb-1 block text-sm font-medium">Product name</span>
                  <input
                    value={draft.name}
                    onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, name: event.target.value }))}
                    className="w-full rounded-2xl border border-sgs-line px-4 py-3"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">Brand</span>
                  <input
                    value={draft.brand}
                    onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, brand: event.target.value }))}
                    className="w-full rounded-2xl border border-sgs-line px-4 py-3"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">Pack size</span>
                  <input
                    value={draft.packSize}
                    onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, packSize: event.target.value }))}
                    className="w-full rounded-2xl border border-sgs-line px-4 py-3"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">Selling price</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={draft.price}
                    onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, price: Number(event.target.value) }))}
                    className="w-full rounded-2xl border border-sgs-line px-4 py-3"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">MRP</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={draft.mrp ?? ''}
                    onChange={(event) =>
                      setDraft((currentDraft) => ({
                        ...currentDraft,
                        mrp: event.target.value ? Number(event.target.value) : undefined,
                      }))
                    }
                    className="w-full rounded-2xl border border-sgs-line px-4 py-3"
                  />
                </label>
                <div className="rounded-2xl border border-sgs-line bg-sgs-sage/30 px-4 py-3 text-sm text-sgs-ink/70 md:col-span-2">
                  Discount badge logic: if <code>MRP {'>'} price</code>, the storefront shows
                  <span className="font-semibold text-sgs-ink"> {discount ?? 0}% OFF</span> using{' '}
                  <code>((MRP - price) / MRP) * 100</code>, rounded to the nearest whole number.
                </div>
                <label className="block md:col-span-2">
                  <span className="mb-1 block text-sm font-medium">Offer label</span>
                  <input
                    value={draft.offerText ?? ''}
                    onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, offerText: event.target.value }))}
                    className="w-full rounded-2xl border border-sgs-line px-4 py-3"
                    placeholder="Weekend deal, Buy 1 Get 1, Fresh arrival…"
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="mb-1 block text-sm font-medium">Image URL</span>
                  <input
                    type="url"
                    value={draft.imageUrl}
                    onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, imageUrl: event.target.value }))}
                    className="w-full rounded-2xl border border-sgs-line px-4 py-3"
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="mb-1 block text-sm font-medium">Upload image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => void handleImageUpload(event)}
                    className="w-full rounded-2xl border border-dashed border-sgs-line bg-sgs-sage/25 px-4 py-3 text-sm"
                    disabled={isUploading}
                  />
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-sgs-line px-4 py-3">
                  <input
                    type="checkbox"
                    checked={draft.inStock}
                    onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, inStock: event.target.checked }))}
                  />
                  <span className="text-sm font-medium">In stock</span>
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-sgs-line px-4 py-3">
                  <input
                    type="checkbox"
                    checked={Boolean(draft.popular)}
                    onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, popular: event.target.checked }))}
                  />
                  <span className="text-sm font-medium">Featured as popular</span>
                </label>
                <div className="md:col-span-2 flex flex-wrap gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || isUploading}
                    className="rounded-full bg-sgs-green px-5 py-3 font-medium text-sgs-cream hover:bg-sgs-green-dark disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Save product
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteProduct}
                    disabled={!draft.id || isSubmitting}
                    className="rounded-full border border-sgs-line px-5 py-3 font-medium text-sgs-ink hover:border-sgs-tomato hover:text-sgs-tomato disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Delete product
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {activeTab === 'orders' && (
          <section className="rounded-[24px] border border-sgs-line bg-white p-4 shadow-sm sm:rounded-[32px] sm:p-6">
            <div className="mb-5 grid gap-3 md:grid-cols-3">
              <input
                value={orderSearch}
                onChange={(event) => setOrderSearch(event.target.value)}
                className="rounded-2xl border border-sgs-line px-4 py-3 text-sm"
                placeholder="Search by order number, customer, or phone"
              />
              <select
                value={orderStatusFilter}
                onChange={(event) => setOrderStatusFilter(event.target.value as OrderStatus | 'all')}
                className="rounded-2xl border border-sgs-line px-4 py-3 text-sm"
              >
                <option value="all">All statuses</option>
                <option value="PLACED">Placed</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="READY">Ready</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <select
                value={orderStoreFilter}
                onChange={(event) => setOrderStoreFilter(event.target.value)}
                className="rounded-2xl border border-sgs-line px-4 py-3 text-sm"
              >
                <option value="all">All stores</option>
                {STORES.filter((store) => store.isActive).map((store) => (
                  <option key={store.storeId} value={store.storeId}>
                    {store.storeName}
                  </option>
                ))}
              </select>
            </div>

            {isOrdersLoading ? (
              <p className="text-sm text-sgs-ink/60">Loading orders…</p>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <article key={order.orderNumber} className="min-w-0 rounded-2xl border border-sgs-line bg-sgs-sage/20 p-4 sm:p-5">
                    <div className="mb-3 flex flex-wrap items-center gap-3">
                      <h3 className="font-display text-xl font-bold text-sgs-ink">#{order.orderNumber}</h3>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-sgs-green-dark">
                        {formatStatus(order.orderStatus)}
                      </span>
                      <span className="text-sm text-sgs-ink/60">{getStoreById(order.storeId)?.area ?? order.storeId}</span>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
                      <div>
                        <p className="break-words text-sm text-sgs-ink/70">
                          {order.customer.fullName} · {order.customer.mobileNumber}
                          {order.customer.email ? ` · ${order.customer.email}` : ''}
                        </p>
                        <p className="mt-1 text-sm text-sgs-ink/60">
                          Pickup: {order.pickupDate} · {order.pickupSlotId}
                        </p>
                        <ul className="mt-3 space-y-2 text-sm text-sgs-ink/75">
                          {order.lines.map((line) => (
                            <li key={`${order.orderNumber}-${line.productId}`} className="flex min-w-0 justify-between gap-3">
                              <span className="min-w-0 break-words">{line.productName} × {line.quantity}</span>
                              <span className="shrink-0">{formatRupees(line.lineTotal)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-3">
                        <div className="rounded-2xl bg-white px-4 py-3 text-sm">
                          <p>Total: <span className="font-semibold">{formatRupees(order.total)}</span></p>
                          <p className="text-sgs-ink/60">Payment: {order.paymentStatus}</p>
                        </div>
                        <textarea
                          value={orderNotes[order.orderNumber] ?? order.statusNote ?? ''}
                          onChange={(event) =>
                            setOrderNotes((current) => ({ ...current, [order.orderNumber]: event.target.value }))
                          }
                          className="min-h-[96px] w-full rounded-2xl border border-sgs-line px-4 py-3 text-sm"
                          placeholder="Add a note for the customer or staff"
                        />
                        <div className="flex flex-wrap gap-2">
                          {orderStatusOptions(order.orderStatus).map((status) => (
                            <button
                              key={status}
                              onClick={() => void handleOrderStatusChange(order.orderNumber, status)}
                              className="rounded-full border border-sgs-line bg-white px-3 py-1.5 text-xs font-medium hover:border-sgs-green"
                            >
                              Mark {formatStatus(status)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
                {filteredOrders.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-sgs-line px-6 py-12 text-center text-sm text-sgs-ink/60">
                    {staffSession.role === 'worker' && staffSession.storeId
                      ? `No orders currently match ${getStoreById(staffSession.storeId)?.area ?? staffSession.storeId}.`
                      : 'No orders match the current filters.'}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {activeTab === 'alerts' && (
          <section className="rounded-[32px] border border-sgs-line bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-display text-2xl font-bold text-sgs-ink">Back in stock requests</h2>
            <div className="space-y-3">
              {stockAlerts.map((alert) => (
                <div key={alert.id} className="rounded-2xl border border-sgs-line bg-sgs-sage/20 p-4">
                  <p className="font-medium text-sgs-ink">{alert.productName}</p>
                  <p className="text-sm text-sgs-ink/70">{alert.customerName}</p>
                  <p className="text-sm text-sgs-ink/60">{alert.email || alert.mobileNumber || 'No contact provided'}</p>
                </div>
              ))}
              {stockAlerts.length === 0 && (
                <div className="rounded-2xl border border-dashed border-sgs-line px-6 py-12 text-center text-sm text-sgs-ink/60">
                  No stock alert requests yet.
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'support' && (
          <section className="rounded-[32px] border border-sgs-line bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-display text-2xl font-bold text-sgs-ink">Customer support inbox</h2>
            <div className="space-y-3">
              {supportMessages.map((message) => (
                <div key={message.id} className="rounded-2xl border border-sgs-line bg-sgs-sage/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium text-sgs-ink">{message.subject}</p>
                    <p className="text-xs text-sgs-ink/50">{message.createdAt ? new Date(message.createdAt).toLocaleString('en-IN') : ''}</p>
                  </div>
                  <p className="mt-2 text-sm text-sgs-ink/70">{message.fullName}</p>
                  <p className="text-sm text-sgs-ink/60">{message.email || message.mobileNumber || 'No contact shared'}</p>
                  <p className="mt-3 text-sm text-sgs-ink/75">{message.message}</p>
                </div>
              ))}
              {supportMessages.length === 0 && (
                <div className="rounded-2xl border border-dashed border-sgs-line px-6 py-12 text-center text-sm text-sgs-ink/60">
                  No customer support messages yet.
                </div>
              )}
            </div>
          </section>
        )}

        <section className="mt-6 rounded-[32px] border border-sgs-line bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sgs-green-dark/70">MFA</p>
              <h2 className="mt-1 font-display text-xl font-bold text-sgs-ink">Authenticator devices</h2>
            </div>
            <button
              onClick={staffSession.startMfaSetup}
              className="rounded-full border border-sgs-line px-4 py-2 text-sm font-medium hover:border-sgs-green"
            >
              Add another factor
            </button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {staffSession.verifiedFactors.map((factor) => (
              <div key={factor.id} className="rounded-2xl border border-sgs-line bg-sgs-sage/20 p-4">
                <p className="font-medium text-sgs-ink">{factor.friendlyName || 'Authenticator app'}</p>
                <button
                  onClick={() => void staffSession.handleRemoveFactor(factor.id)}
                  disabled={staffSession.isSecurityBusy}
                  className="mt-3 rounded-full border border-sgs-line px-3 py-1.5 text-xs font-medium hover:border-sgs-tomato hover:text-sgs-tomato disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Remove factor
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
