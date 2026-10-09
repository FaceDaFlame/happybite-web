import { Navigate, Route, Routes } from 'react-router-dom'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import CatalogMenu from '@/pages/CatalogMenu'
import ProductDetail from '@/pages/ProductDetail'
import Checkout from '@/pages/Checkout'
import Cart from '@/pages/Cart'
import Payment from '@/pages/Payment'
import AccountPlaceholder from '@/pages/AccountPlaceholder'
import OrderHistory from '@/pages/OrderHistory'
import AdminLogin from '@/pages/admin/AdminLogin'
import ManajemenProduk from '@/pages/admin/ManajemenProduk'
import KelolaPesanan from '@/pages/admin/KelolaPesanan'
import LaporanPenjualan from '@/pages/admin/LaporanPenjualan'
import AdminRoute from '@/pages/admin/components/AdminRoute'
import AdminLayout from '@/pages/admin/components/AdminLayout'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function AppRoutes({
  cartCount,
  cartItems,
  dispatchCart,
  gift,
  setGift,
  checkout,
  setCheckout,
  addToCart,
  buyNow,
  completeCheckout,
}) {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="produk" replace />} />
          <Route path="produk" element={<ManajemenProduk />} />
          <Route path="pesanan" element={<KelolaPesanan />} />
          <Route path="laporan" element={<LaporanPenjualan />} />
        </Route>
      </Route>
      <Route path="/" element={<Home cartCount={cartCount} />} />
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route
          path="/profil"
          element={<AccountPlaceholder kind="profile" cartCount={cartCount} />}
        />
        <Route
          path="/riwayat-pesanan"
          element={<OrderHistory cartCount={cartCount} />}
        />
        <Route
          path="/katalog"
          element={
            <CatalogMenu cartCount={cartCount} onAddToCart={addToCart} />
          }
        />
        <Route
          path="/katalog/:slug"
          element={
            <ProductDetail
              cartCount={cartCount}
              onAddToCart={addToCart}
              onBuyNow={buyNow}
            />
          }
        />
        <Route
          path="/produk/:slug"
          element={
            <ProductDetail
              cartCount={cartCount}
              onAddToCart={addToCart}
              onBuyNow={buyNow}
            />
          }
        />
        <Route
          path="/checkout"
          element={
            <Checkout
              cartItems={cartItems}
              cartCount={cartCount}
              gift={gift}
              form={checkout}
              setForm={setCheckout}
              onCreated={completeCheckout}
            />
          }
        />
        <Route
          path="/pembayaran"
          element={<Navigate to="/checkout" replace />}
        />
        <Route
          path="/pembayaran/:orderId"
          element={<Payment cartCount={cartCount} />}
        />
        <Route
          path="/pesanan-berhasil"
          element={<Navigate to="/riwayat-pesanan" replace />}
        />
        <Route
          path="/keranjang"
          element={
            <Cart
              cartItems={cartItems}
              cartCount={cartCount}
              dispatchCart={dispatchCart}
              gift={gift}
              onGiftChange={setGift}
            />
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
