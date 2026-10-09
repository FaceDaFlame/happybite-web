import { useCallback, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getProductBySlug, getRelatedProducts } from '@/services/productService'
import useProductRequest from '@/hooks/useProductRequest'
import ProductDetailContent from './components/ProductDetailContent'

// A keyed content component resets selections when following a related-product link.
export default function ProductDetail(props) {
  const { slug } = useParams()
  const load = useCallback(async () => {
    const product = await getProductBySlug(slug)
    if (!product) return { product: null, related: [] }
    try {
      return { product, related: await getRelatedProducts(product) }
    } catch {
      return { product, related: [], relatedError: true }
    }
  }, [slug])
  const { data, loading, error, retry } = useProductRequest(load)
  useEffect(() => {
    document.title = `${data?.product?.name || (loading ? 'Memuat produk...' : error ? 'Produk' : 'Produk tidak ditemukan')} — HappyBite`
  }, [data, loading, error])
  return (
    <ProductDetailContent
      key={`${slug}-${data?.product?.id || 'loading'}`}
      product={data?.product}
      related={data?.related || []}
      relatedError={data?.relatedError}
      loading={loading}
      error={error}
      onRetry={retry}
      {...props}
    />
  )
}
