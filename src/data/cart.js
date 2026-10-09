import { cartLineId, isUuid } from './cartSnapshot'
import { isProductSoldOut } from '../services/productMapper'

// Each line stores a product snapshot; variants have separate lineId values.
export function cartReducer(items, action) {
  switch (action.type) {
    case 'buyNow': {
      const { product, quantity, variant = '' } = action
      if (
        !isUuid(product?.id) ||
        isProductSoldOut(product) ||
        !Number.isSafeInteger(quantity) ||
        quantity < 1
      )
        return items
      const lineId = cartLineId(product.id, variant)
      const otherItems = items
        .filter((item) => item.lineId !== lineId)
        .map((item) => ({ ...item, selected: false }))
      return [
        ...otherItems,
        { ...product, lineId, quantity, variant, selected: true },
      ]
    }
    case 'add': {
      const { product, quantity = 1, variant = '' } = action
      if (
        !isUuid(product?.id) ||
        isProductSoldOut(product) ||
        !Number.isSafeInteger(quantity) ||
        quantity < 1
      )
        return items
      const lineId = cartLineId(product.id, variant)
      const existing = items.find((item) => item.lineId === lineId)
      if (existing && !Number.isSafeInteger(existing.quantity + quantity))
        return items
      return existing
        ? items.map((item) =>
            item.lineId === lineId
              ? { ...item, quantity: item.quantity + quantity, selected: true }
              : item,
          )
        : [...items, { ...product, lineId, variant, quantity, selected: true }]
    }
    case 'quantity':
      return Number.isSafeInteger(action.quantity) && action.quantity >= 1
        ? items.map((item) =>
            item.lineId === action.id
              ? { ...item, quantity: action.quantity }
              : item,
          )
        : items
    case 'select':
      return items.map((item) =>
        item.lineId === action.id
          ? { ...item, selected: action.selected }
          : item,
      )
    case 'selectAll':
      return items.map((item) => ({ ...item, selected: action.selected }))
    case 'remove':
      return items.filter((item) => item.lineId !== action.id)
    case 'removeOrdered':
      return items.filter((item) => !action.ids.includes(item.lineId))
    case 'clear':
      return []
    default:
      return items
  }
}
