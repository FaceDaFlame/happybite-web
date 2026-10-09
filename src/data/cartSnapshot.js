export const CART_KEY = 'happybite-cart-v1'
export const isUuid = (id) =>
  typeof id === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
export const cartLineId = (id, variant = '') => JSON.stringify([id, variant])

export function normalizeCart(items) {
  if (!Array.isArray(items)) return []
  return items
    .filter(
      (item) =>
        item &&
        isUuid(item.id) &&
        typeof item.slug === 'string' &&
        typeof item.name === 'string' &&
        typeof item.image === 'string' &&
        Number.isFinite(item.price) &&
        item.price >= 0 &&
        Number.isSafeInteger(item.quantity) &&
        item.quantity > 0 &&
        typeof item.variant === 'string' &&
        typeof item.selected === 'boolean',
    )
    .map((item) => ({ ...item, lineId: cartLineId(item.id, item.variant) }))
}

// Preserve the existing view/order interfaces while the persisted id remains
// the product UUID. lineId uniquely identifies each product/variant pair.
export const cartLines = (items) =>
  items.map((item) => ({
    ...item,
    id: item.lineId,
    product: item,
  }))
