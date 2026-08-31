import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  isSupabaseConfigured,
  supabase,
  SUPABASE_ORDERS_TABLE,
  SUPABASE_STOCK_ALERTS_TABLE,
  SUPABASE_SUPPORT_MESSAGES_TABLE,
} from '../lib/supabase'
import type { Order, OrderStatus, StockAlertRequest, SupportMessage } from '../types'

const LOCAL_ORDERS_KEY = 'sgs.orders'
const LOCAL_LAST_ORDER_KEY = 'sgs.lastOrderNumber'
const LOCAL_LAST_ORDER_PHONE_KEY = 'sgs.lastOrderPhone'
const LOCAL_STOCK_ALERTS_KEY = 'sgs.stockAlerts'
const LOCAL_SUPPORT_MESSAGES_KEY = 'sgs.supportMessages'

interface OrderCenterContextValue {
  orders: Order[]
  isLoading: boolean
  error: string
  lastPlacedOrderNumber: string | null
  lastPlacedOrderPhone: string | null
  placeOrder: (order: Order) => Promise<Order>
  refreshOrders: () => Promise<void>
  trackOrder: (orderNumber: string, mobileNumber: string) => Promise<Order | null>
  updateOrderStatus: (orderNumber: string, status: OrderStatus, statusNote?: string) => Promise<void>
  subscribeToOrders: (onChange: () => void) => () => void
  requestBackInStockNotification: (request: StockAlertRequest) => Promise<void>
  submitSupportMessage: (message: SupportMessage) => Promise<void>
}

interface DatabaseOrderRow {
  id?: string
  order_number: string
  customer_name: string
  customer_email: string | null
  customer_mobile: string
  store_id: string
  order_type: string
  items: Order['lines']
  pickup_date: string
  pickup_slot_id: string
  subtotal: number | string
  charges: number | string
  total: number | string
  payment_status: Order['paymentStatus']
  order_status: Order['orderStatus']
  status_note: string | null
  created_at: string
  updated_at: string
}

const OrderCenterContext = createContext<OrderCenterContextValue | null>(null)

function readStored<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

function writeStored<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

function mapRowToOrder(row: DatabaseOrderRow): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customer: {
      fullName: row.customer_name,
      email: row.customer_email ?? undefined,
      mobileNumber: row.customer_mobile,
    },
    storeId: row.store_id,
    orderType: row.order_type as Order['orderType'],
    lines: row.items,
    pickupDate: row.pickup_date,
    pickupSlotId: row.pickup_slot_id,
    subtotal: Number(row.subtotal),
    charges: Number(row.charges),
    total: Number(row.total),
    paymentStatus: row.payment_status,
    orderStatus: row.order_status,
    statusNote: row.status_note ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapOrderToRow(order: Order) {
  return {
    order_number: order.orderNumber,
    customer_name: order.customer.fullName,
    customer_email: order.customer.email ?? null,
    customer_mobile: order.customer.mobileNumber,
    store_id: order.storeId,
    order_type: order.orderType,
    items: order.lines,
    pickup_date: order.pickupDate,
    pickup_slot_id: order.pickupSlotId,
    subtotal: order.subtotal,
    charges: order.charges,
    total: order.total,
    payment_status: order.paymentStatus,
    order_status: order.orderStatus,
    status_note: order.statusNote ?? null,
  }
}

export function OrderCenterProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(() =>
    isSupabaseConfigured ? [] : readStored<Order[]>(LOCAL_ORDERS_KEY, []),
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastPlacedOrderNumber, setLastPlacedOrderNumber] = useState<string | null>(() =>
    readStored<string | null>(LOCAL_LAST_ORDER_KEY, null),
  )
  const [lastPlacedOrderPhone, setLastPlacedOrderPhone] = useState<string | null>(() =>
    readStored<string | null>(LOCAL_LAST_ORDER_PHONE_KEY, null),
  )

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setOrders(readStored<Order[]>(LOCAL_ORDERS_KEY, []))
      setIsLoading(false)
      setError('')
      return
    }
    setError('')
  }, [])

  const refreshOrders = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setOrders(readStored<Order[]>(LOCAL_ORDERS_KEY, []))
      return
    }

    setIsLoading(true)
    const { data, error: fetchError } = await supabase
      .from(SUPABASE_ORDERS_TABLE)
      .select(
        'id, order_number, customer_name, customer_email, customer_mobile, store_id, order_type, items, pickup_date, pickup_slot_id, subtotal, charges, total, payment_status, order_status, status_note, created_at, updated_at',
      )
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setOrders((data as DatabaseOrderRow[] | null)?.map(mapRowToOrder) ?? [])
      setError('')
    }
    setIsLoading(false)
  }, [])

  async function placeOrder(order: Order) {
    writeStored(LOCAL_LAST_ORDER_KEY, order.orderNumber)
    writeStored(LOCAL_LAST_ORDER_PHONE_KEY, order.customer.mobileNumber)
    setLastPlacedOrderNumber(order.orderNumber)
    setLastPlacedOrderPhone(order.customer.mobileNumber)

    if (!isSupabaseConfigured || !supabase) {
      const nextOrders = [order, ...readStored<Order[]>(LOCAL_ORDERS_KEY, [])]
      writeStored(LOCAL_ORDERS_KEY, nextOrders)
      setOrders(nextOrders)
      return order
    }

    const { data, error: insertError } = await supabase
      .from(SUPABASE_ORDERS_TABLE)
      .insert(mapOrderToRow(order))
      .select(
        'id, order_number, customer_name, customer_email, customer_mobile, store_id, order_type, items, pickup_date, pickup_slot_id, subtotal, charges, total, payment_status, order_status, status_note, created_at, updated_at',
      )
      .single()

    if (insertError) {
      setError(insertError.message)
      throw insertError
    }

    const savedOrder = mapRowToOrder(data as DatabaseOrderRow)
    setOrders((current) => [savedOrder, ...current])
    setError('')
    return savedOrder
  }

  async function trackOrder(orderNumber: string, mobileNumber: string) {
    if (!isSupabaseConfigured || !supabase) {
      const localMatch = readStored<Order[]>(LOCAL_ORDERS_KEY, []).find(
        (order) => order.orderNumber === orderNumber && order.customer.mobileNumber === mobileNumber,
      )
      return localMatch ?? null
    }

    const { data, error: rpcError } = await supabase.rpc('track_order', {
      p_order_number: orderNumber.trim(),
      p_mobile_number: mobileNumber.trim(),
    })

    if (rpcError) {
      setError(rpcError.message)
      return null
    }

    const row = Array.isArray(data) ? (data[0] as DatabaseOrderRow | undefined) : (data as DatabaseOrderRow | null)
    return row ? mapRowToOrder(row) : null
  }

  async function updateOrderStatus(orderNumber: string, status: OrderStatus, statusNote?: string) {
    if (!isSupabaseConfigured || !supabase) {
      const nextOrders = readStored<Order[]>(LOCAL_ORDERS_KEY, []).map((order) =>
        order.orderNumber === orderNumber
          ? { ...order, orderStatus: status, statusNote, updatedAt: new Date().toISOString() }
          : order,
      )
      writeStored(LOCAL_ORDERS_KEY, nextOrders)
      setOrders(nextOrders)
      return
    }

    const { error: updateError } = await supabase
      .from(SUPABASE_ORDERS_TABLE)
      .update({
        order_status: status,
        status_note: statusNote ?? null,
      })
      .eq('order_number', orderNumber)

    if (updateError) {
      setError(updateError.message)
      throw updateError
    }

    await refreshOrders()
  }

  const subscribeToOrders = useCallback((onChange: () => void) => {
    if (!isSupabaseConfigured || !supabase) {
      const intervalId = window.setInterval(onChange, 15000)
      return () => window.clearInterval(intervalId)
    }

    const client = supabase
    const channel = client
      .channel('orders-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: SUPABASE_ORDERS_TABLE },
        () => onChange(),
      )
      .subscribe()

    return () => {
      void client.removeChannel(channel)
    }
  }, [])

  async function requestBackInStockNotification(request: StockAlertRequest) {
    if (!isSupabaseConfigured || !supabase) {
      const nextItems = [
        {
          ...request,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          notified: false,
        },
        ...readStored<StockAlertRequest[]>(LOCAL_STOCK_ALERTS_KEY, []),
      ]
      writeStored(LOCAL_STOCK_ALERTS_KEY, nextItems)
      return
    }

    const { error: insertError } = await supabase.from(SUPABASE_STOCK_ALERTS_TABLE).insert({
      product_id: request.productId,
      product_name: request.productName,
      customer_name: request.customerName,
      email: request.email ?? null,
      mobile_number: request.mobileNumber ?? null,
      notified: false,
    })

    if (insertError) {
      setError(insertError.message)
      throw insertError
    }
  }

  async function submitSupportMessage(message: SupportMessage) {
    if (!isSupabaseConfigured || !supabase) {
      const nextItems = [
        {
          ...message,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        },
        ...readStored<SupportMessage[]>(LOCAL_SUPPORT_MESSAGES_KEY, []),
      ]
      writeStored(LOCAL_SUPPORT_MESSAGES_KEY, nextItems)
      return
    }

    const { error: insertError } = await supabase.from(SUPABASE_SUPPORT_MESSAGES_TABLE).insert({
      full_name: message.fullName,
      email: message.email ?? null,
      mobile_number: message.mobileNumber ?? null,
      subject: message.subject,
      message: message.message,
    })

    if (insertError) {
      setError(insertError.message)
      throw insertError
    }
  }

  const value: OrderCenterContextValue = {
    orders,
    isLoading,
    error,
    lastPlacedOrderNumber,
    lastPlacedOrderPhone,
    placeOrder,
    refreshOrders,
    trackOrder,
    updateOrderStatus,
    subscribeToOrders,
    requestBackInStockNotification,
    submitSupportMessage,
  }

  return <OrderCenterContext.Provider value={value}>{children}</OrderCenterContext.Provider>
}

export function useOrderCenter() {
  const ctx = useContext(OrderCenterContext)
  if (!ctx) throw new Error('useOrderCenter must be used within OrderCenterProvider')
  return ctx
}
