import { CART_KEY, normalizeCart, cartLines } from './cartSnapshot'

export const SESSION_KEY = 'happybite-shop-v1'
export const emptyCheckout = {
  name: '',
  whatsapp: '',
  email: '',
  address: '',
  city: '',
  postalCode: '',
  notes: '',
}
const emptySession = () => ({
  cartItems: [],
  gift: { enabled: false, message: '' },
  checkout: { ...emptyCheckout },
  order: null,
})

function readStorage(storage, key) {
  try {
    return JSON.parse(storage.getItem(key))
  } catch {
    return null
  }
}

export function readShopSession() {
  try {
    const legacy = readStorage(localStorage, SESSION_KEY)
    const saved =
      readStorage(sessionStorage, SESSION_KEY) || legacy || emptySession()
    const storedCart = readStorage(localStorage, CART_KEY)
    const cartItems = normalizeCart(storedCart ?? saved.cartItems)
    // Remove mock slug IDs from both known legacy storage locations.
    if (legacy?.cartItems) {
      try {
        localStorage.setItem(
          SESSION_KEY,
          JSON.stringify({
            ...legacy,
            cartItems: normalizeCart(legacy.cartItems),
          }),
        )
      } catch {
        /* In-memory cleanup still applies if storage is disabled. */
      }
    }
    const checkout = Object.fromEntries(
      Object.keys(emptyCheckout).map((key) => [
        key,
        typeof saved.checkout?.[key] === 'string' ? saved.checkout[key] : '',
      ]),
    )
    const gift = {
      enabled: saved.gift?.enabled === true,
      message:
        typeof saved.gift?.message === 'string'
          ? saved.gift.message.slice(0, 150)
          : '',
    }
    const order =
      saved.order &&
      typeof saved.order.id === 'string' &&
      Number.isFinite(saved.order.deadline) &&
      typeof saved.order.fingerprint === 'string'
        ? saved.order
        : null
    return { cartItems, checkout, gift, order }
  } catch {
    return emptySession()
  }
}

export function selectedOrderItems(cartItems) {
  return cartLines(cartItems.filter((item) => item.selected))
}

export function orderFingerprint(cartItems, checkout, gift) {
  return JSON.stringify({
    items: selectedOrderItems(cartItems).map(({ product, ...item }) => ({
      ...item,
      price: product.price,
    })),
    checkout,
    gift,
  })
}

// No shipping or gateway charge is configured in this local checkout.
export function orderTotals(cartItems) {
  const subtotal = selectedOrderItems(cartItems).reduce(
    (sum, item) => sum + item.quantity * item.product.price,
    0,
  )
  return { subtotal, shipping: 0, service: 0, total: subtotal }
}
