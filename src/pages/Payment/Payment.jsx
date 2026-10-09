import { useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getOrderById } from '@/services/orderService'
import useProductRequest from '@/hooks/useProductRequest'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PaymentContent from './components/PaymentContent'

export default function Payment({ cartCount }) {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const load = useCallback(() => getOrderById(orderId), [orderId])
  const { data: order, loading, error, retry } = useProductRequest(load)
  if (order)
    return <PaymentContent key={order.id} order={order} cartCount={cartCount} />
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <Navbar
        cartCount={cartCount}
        onAccount={() => navigate('/login')}
        onSearch={() => navigate('/katalog#catalog-search')}
      />
      <main className="flex-1">
        <section className="mx-auto max-w-xl px-5 py-16 text-center">
          {loading ? (
            <p role="status">Memuat pesanan...</p>
          ) : error ? (
            <>
              <p role="alert">Gagal memuat pesanan. Coba lagi.</p>
              <button
                type="button"
                onClick={retry}
                className="mt-6 inline-flex rounded-full bg-baked px-6 py-3 text-sm font-bold text-white"
              >
                Coba lagi
              </button>
            </>
          ) : (
            <>
              <h1 className="mt-5 text-2xl font-bold">
                Pesanan tidak ditemukan
              </h1>
              <Link
                to="/katalog"
                className="mt-6 inline-flex rounded-full bg-baked px-6 py-3 text-sm font-bold text-white"
              >
                Kembali ke Katalog
              </Link>
            </>
          )}
        </section>
      </main>
      <Footer
        onAccount={() => navigate('/login')}
        onInfo={() => navigate('/#kontak')}
      />
    </div>
  )
}
