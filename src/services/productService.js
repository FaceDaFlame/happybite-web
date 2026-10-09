import { supabase } from '@/lib/supabaseClient'
import { mapProduct } from './productMapper'

const selection = '*, categories(id, nama, slug)'

export async function getCatalogProducts() {
  const { data, error } = await supabase
    .from('products')
    .select(selection)
    .eq('is_live', true)
    .eq('is_catalog_visible', true)
    .order('sku')
  if (error) throw error
  return (data || []).map(mapProduct)
}

export async function getProductBySlug(slug) {
  const { data, error } = await supabase
    .from('products')
    .select(selection)
    .eq('slug', slug)
    .eq('is_live', true)
    .maybeSingle()
  if (error) throw error
  return data ? mapProduct(data) : null
}

export async function getRelatedProducts(product) {
  let related = []
  if (product.categoryId) {
    const { data, error } = await supabase
      .from('products')
      .select(selection)
      .eq('is_live', true)
      .eq('category_id', product.categoryId)
      .neq('id', product.id)
      .order('sku')
      .limit(3)
    if (error) throw error
    related = data || []
  }
  if (related.length < 3) {
    const excluded = [product.id, ...related.map((item) => item.id)]
    const { data, error } = await supabase
      .from('products')
      .select(selection)
      .eq('is_live', true)
      .not('id', 'in', `(${excluded.join(',')})`)
      .order('sku')
      .limit(3 - related.length)
    if (error) throw error
    related.push(...(data || []))
  }
  return related.map(mapProduct)
}

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('id, nama, slug')
    .order('nama')
  if (error) throw error
  return data || []
}
