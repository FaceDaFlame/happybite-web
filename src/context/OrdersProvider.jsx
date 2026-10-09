import { useEffect, useRef, useState } from 'react'
import { useAuth } from './authContext'
import { useProducts } from './productsContext'
import { OrdersContext } from './ordersContext'
import { ORDERS_KEY, createSampleOrders, readStoredOrders } from '@/data/orders'
import {
  fulfillmentOf,
  nextFulfillment,
  orderKey,
} from '@/data/orderFulfillment'

function initialOrders() {
  try {
    return readStoredOrders() ?? createSampleOrders()
  } catch {
    return createSampleOrders()
  }
}

export default function OrdersProvider({ children }) {
  const { withOrderInventory } = useProducts()
  const { user } = useAuth()
  const ownerEmail = user?.email.trim().toLowerCase()
  const [allOrders, setAllOrders] = useState(initialOrders)
  const current = useRef(allOrders)
  useEffect(() => {
    function sync(event) {
      if (event.key !== ORDERS_KEY && event.key !== null) return
      const next = initialOrders()
      current.current = next
      setAllOrders(next)
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  function commit(update) {
    // Write before clearing the cart; a storage failure leaves checkout intact.
    let stored
    try {
      stored = readStoredOrders()
    } catch {
      stored = null
    }
    const next = update(stored ?? current.current)
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(next))
      current.current = next
      setAllOrders(next)
    } catch {
      throw new Error(
        'Pesanan belum tersimpan. Izinkan penyimpanan browser atau kosongkan ruang, lalu coba lagi. Keranjang tetap tersimpan.',
      )
    }
  }

  function addOrder(order) {
    if (!ownerEmail) throw new Error('Silakan masuk untuk menyimpan pesanan.')
    const orders = readStoredOrders() ?? current.current
    // An already saved confirmation must neither create another order nor
    // deduct inventory again, including after restoring a payment session.
    if (
      orders.some(
        (item) => item.id === order.id && item.ownerEmail === ownerEmail,
      )
    )
      return
    const placed = { ...order, ownerEmail }
    withOrderInventory(placed, () => {
      commit((latest) => [placed, ...latest])
    })
  }

  function advanceOrder(key, expectedStatus) {
    if (user?.role !== 'admin')
      throw new Error('Hanya admin yang dapat mengubah status pesanan.')
    commit((orders) =>
      orders.map((order) => {
        if (orderKey(order) !== key) return order
        const currentStatus = fulfillmentOf(order)
        // Ignore a repeated click or stale panel; never skip a kitchen stage.
        if (currentStatus !== expectedStatus || !nextFulfillment[currentStatus])
          return order
        const fulfillmentStatus = nextFulfillment[currentStatus].status
        const timestamp = new Date().toISOString()
        const changed = {
          ...order,
          fulfillmentStatus,
          updatedAt: timestamp,
          status: ['shipping', 'completed'].includes(fulfillmentStatus)
            ? fulfillmentStatus
            : 'processing',
          // Manual kitchen updates do not imply payment verification or live GPS.
          ...(fulfillmentStatus === 'shipping' && {
            trackingTimes: order.trackingTimes || [],
          }),
          ...(fulfillmentStatus === 'completed' && {
            deliveredAt: timestamp,
            deliveryNote: 'Pesanan ditandai selesai diterima oleh admin.',
          }),
        }
        return changed
      }),
    )
  }

  function updateCourierNote(id, note) {
    commit((orders) =>
      orders.map((order) =>
        order.id === id &&
        (order.source === 'sample' || order.ownerEmail === ownerEmail)
          ? {
              ...order,
              courierNote: note,
              ...(order.recipient && {
                recipient: { ...order.recipient, notes: note },
              }),
            }
          : order,
      ),
    )
  }

  const orders = allOrders
    .filter(
      (order) => order.source === 'sample' || order.ownerEmail === ownerEmail,
    )
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))

  return (
    <OrdersContext.Provider
      value={{
        orders,
        addOrder,
        updateCourierNote,
        advanceOrder,
        adminOrders:
          user?.role === 'admin'
            ? [...allOrders].sort(
                (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp),
              )
            : [],
      }}
    >
      {children}
    </OrdersContext.Provider>
  )
}
