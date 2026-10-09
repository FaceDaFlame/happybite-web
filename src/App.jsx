import AppRoutes from '@/routes/AppRoutes'
import { useEffect, useReducer, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { SESSION_KEY, readShopSession } from '@/data/shopSession'
import { cartReducer } from '@/data/cart'
import { CART_KEY } from '@/data/cartSnapshot'

export default function App() {
  const { pathname, hash, key } = useLocation()
  const [saved] = useState(() => readShopSession())
  const [cartItems, dispatchCart] = useReducer(cartReducer, saved.cartItems)
  const [gift, setGift] = useState(saved.gift)
  const [checkout, setCheckout] = useState(saved.checkout)
  useEffect(() => {
    try {
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ cartItems, gift, checkout }),
      )
    } catch {
      /* Browsers can disable session storage; the in-memory flow still works. */
    }
  }, [cartItems, gift, checkout])
  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cartItems))
    } catch {
      /* Keep the in-memory cart when storage is unavailable. */
    }
  }, [cartItems])
  function completeCheckout() {
    dispatchCart({ type: 'clear' })
    setGift({ enabled: false, message: '' })
  }
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0)
  const addToCart = (product, quantity = 1, variant = '') =>
    dispatchCart({ type: 'add', product, quantity, variant })
  const buyNow = (product, quantity, variant) =>
    dispatchCart({ type: 'buyNow', product, quantity, variant })

  useEffect(() => {
    if (pathname.startsWith('/katalog/') || pathname.startsWith('/produk/'))
      return
    document.title =
      pathname === '/login'
        ? 'Masuk Akun — HappyBite'
        : pathname === '/katalog'
          ? 'Katalog Menu — HappyBite'
          : 'HappyBite — Kebahagiaan di Setiap Gigitan'
    if (pathname === '/checkout') document.title = 'Checkout — HappyBite'
    else if (pathname === '/keranjang')
      document.title = 'Keranjang Belanja — HappyBite'
    else if (pathname === '/pembayaran' || pathname.startsWith('/pembayaran/'))
      document.title = 'Pembayaran — HappyBite'
    else if (pathname === '/pesanan-berhasil')
      document.title = 'Konfirmasi Pesanan — HappyBite'
    else if (pathname === '/profil') document.title = 'Profil Akun — HappyBite'
    else if (pathname === '/riwayat-pesanan')
      document.title = 'Riwayat Pesanan — HappyBite'
  }, [pathname])

  useEffect(() => {
    const target = hash && document.getElementById(hash.slice(1))
    if (target) target.scrollIntoView({ behavior: 'instant' })
    else window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, hash, key])

  return (
    <AppRoutes
      cartCount={cartCount}
      cartItems={cartItems}
      dispatchCart={dispatchCart}
      gift={gift}
      setGift={setGift}
      checkout={checkout}
      setCheckout={setCheckout}
      addToCart={addToCart}
      buyNow={buyNow}
      completeCheckout={completeCheckout}
    />
  )
}
