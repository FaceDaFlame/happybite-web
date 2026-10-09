import { useCallback, useEffect, useRef } from 'react'
import { useAuth } from './authContext'
import { ProductsContext } from './productsContext'
import useProductRequest from '@/hooks/useProductRequest'
import { getCategories } from '@/services/productService'
import {
  getAdminProducts,
  createProduct,
  updateProduct,
  removeProduct,
} from '@/services/adminProductService'

export default function ProductsProvider({ children }) {
  const { user } = useAuth()
  const adminId = user?.role === 'admin' ? user.id : null
  const load = useCallback(async () => {
    if (!adminId) return { products: [], categories: [] }
    const [products, categories] = await Promise.all([
      getAdminProducts(),
      getCategories(),
    ])
    return { products, categories }
  }, [adminId])
  const { data, loading, error, retry } = useProductRequest(load)
  const busy = useRef(false)
  useEffect(() => {
    // One-time cleanup only: never restore or persist the legacy fixture list.
    try {
      localStorage.removeItem('happybite-products-v1')
    } catch {
      /* Storage may be disabled. */
    }
  }, [])
  async function mutate(callback) {
    if (!adminId) throw new Error('Hanya admin yang dapat mengubah produk.')
    if (busy.current)
      throw new Error('Perubahan masih diproses. Tunggu sebentar.')
    busy.current = true
    try {
      const result = await callback()
      retry()
      return result
    } catch (error) {
      if (error.code === '42501')
        throw new Error(
          'Akses ditolak. Pastikan akun admin memiliki izin mengubah produk.',
          { cause: error },
        )
      throw new Error(error.message || 'Produk gagal disimpan. Coba lagi.', {
        cause: error,
      })
    } finally {
      busy.current = false
    }
  }
  const products = adminId ? data?.products || [] : []
  const categories = adminId ? data?.categories || [] : []
  function saveProduct(values, id) {
    return mutate(() =>
      id
        ? updateProduct(id, values, categories)
        : createProduct(values, categories),
    )
  }
  function duplicateProduct(id) {
    const product = products.find((p) => p.id === id)
    if (!product)
      return Promise.reject(
        new Error('Produk tidak ditemukan. Muat ulang daftar.'),
      )
    return mutate(() =>
      createProduct(
        {
          ...product,
          sku: '',
          name: product.name + ' (Salinan)',
          image: product.gambarUrl,
          isLiveOnWebsite: false,
        },
        categories,
      ),
    )
  }
  function deleteProduct(id) {
    return mutate(() => removeProduct(id))
  }
  function withOrderInventory(order, saveOrder) {
    if (!user || order.ownerEmail !== user.email.trim().toLowerCase())
      throw new Error('Silakan masuk untuk menyimpan pesanan.')
    // Orders are still local. Atomic DB stock deduction belongs to the later
    // backend checkout integration; never fall back to mock inventory.
    saveOrder()
  }
  return (
    <ProductsContext.Provider
      value={{
        products,
        categories,
        loading: !!adminId && loading,
        error: !!adminId && error,
        reload: retry,
        saveProduct,
        duplicateProduct,
        deleteProduct,
        withOrderInventory,
      }}
    >
      {children}
    </ProductsContext.Provider>
  )
}
