import { NavLink } from 'react-router-dom'
import { useAuth } from '@/context/authContext'
import Icon from '@/components/Icon'
import { useState } from 'react'

const menuItems = [
  ['Manajemen Produk', '/admin/produk'],
  ['Kelola Pesanan', '/admin/pesanan'],
  ['Laporan Penjualan', '/admin/laporan'],
]

export default function AdminSidebar() {
  const { logout } = useAuth()
  const [leaving, setLeaving] = useState(false)
  const [error, setError] = useState('')
  return (
    <aside className="flex shrink-0 flex-col gap-7 border-b border-primary/15 bg-peach p-5 md:sticky md:top-0 md:h-dvh md:w-56 md:border-b-0 md:border-r 2xl:w-64">
      <p className="py-2 text-center text-xl font-bold tracking-tight">
        HappyBite
      </p>
      <div className="flex items-center gap-2 rounded-full bg-blush/50 px-3 py-3">
        <Icon name="home" className="h-4 w-4 text-baked" />
        <div>
          <p className="text-[11px] font-bold text-baked">
            DAPUR PUSAT SENOPATI
          </p>
          <p className="mt-0.5 text-xs text-muted">Admin Owner</p>
        </div>
      </div>
      <nav aria-label="Navigasi admin" className="space-y-2">
        {menuItems.map(([label, to], index) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-full px-3 py-3 text-sm ${isActive ? 'bg-primary font-semibold text-chocolate shadow-soft' : 'hover:bg-cream'}`
            }
          >
            <Icon
              name={['cookie', 'receipt', 'money'][index]}
              className="h-4 w-4"
            />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto space-y-2 border-t border-primary/25 pt-4">
        <a
          href="#pengaturan-dapur"
          aria-disabled="true"
          onClick={(event) => event.preventDefault()}
          title="Pengaturan Dapur belum tersedia"
          className="block cursor-default rounded-xl px-3 py-2 text-sm text-muted"
        >
          Pengaturan Dapur
        </a>
        <button
          type="button"
          disabled={leaving}
          onClick={async () => {
            setLeaving(true)
            setError('')
            try {
              await logout()
            } catch {
              setError('Gagal keluar. Silakan coba lagi.')
              setLeaving(false)
            }
          }}
          className="w-full rounded-xl px-3 py-2 text-left text-sm text-terracotta hover:bg-cream"
        >
          {leaving ? 'Memproses...' : 'Keluar'}
        </button>
        {error && (
          <p role="alert" className="px-3 text-xs text-red-700">
            {error}
          </p>
        )}
      </div>
    </aside>
  )
}
