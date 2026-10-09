// Presentation-only stock classification; products are stored in Supabase.
export function stockStatus(product) {
  if (product.stokDisplayEtalase === 0) return 'empty'
  return product.stokDisplayEtalase <= 5 ? 'low' : 'available'
}
