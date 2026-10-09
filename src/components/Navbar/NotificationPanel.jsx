import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '@/context/notificationsContext'
import { relativeTime } from '@/data/notifications'
import Icon from '@/components/Icon'

const filters = [
  ['all', 'Semua'],
  ['status', 'Status Pesanan'],
]

export default function NotificationPanel({ onClose }) {
  const {
    notifications,
    unreadCount,
    markAllRead,
    markRead,
    loading,
    error,
    realtimeError,
    busy,
    refreshNotifications,
  } = useNotifications()
  const navigate = useNavigate()
  async function openNotification(item) {
    if (busy) return
    const success = item.read || (await markRead(item.id))
    if (success && item.linkedOrderId) {
      onClose()
      navigate('/riwayat-pesanan')
    }
  }
  const [filter, setFilter] = useState('all')
  const [now, setNow] = useState(Date.now)
  const dialog = useRef(null)
  useEffect(() => {
    const element = dialog.current
    const previousFocus = document.activeElement
    const wasLocked = document.body.classList.contains('overflow-hidden')
    element.showModal()
    document.body.classList.add('overflow-hidden')
    function trapFocus(event) {
      if (event.key !== 'Tab') return
      const controls = [
        ...element.querySelectorAll('button:not(:disabled), a[href]'),
      ]
      const first = controls[0]
      const last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    element.addEventListener('keydown', trapFocus)
    const interval = setInterval(() => setNow(Date.now()), 60000)
    return () => {
      clearInterval(interval)
      element.removeEventListener('keydown', trapFocus)
      element.close()
      if (!wasLocked) document.body.classList.remove('overflow-hidden')
      previousFocus?.focus()
    }
  }, [])
  const visible = notifications.filter(
    (item) => filter === 'all' || item.type === filter,
  )
  return createPortal(
    <dialog
      ref={dialog}
      id="notifications-panel"
      aria-labelledby="notifications-title"
      aria-describedby="notifications-description"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-[672px] overflow-hidden rounded-[30px] bg-white p-0 text-chocolate shadow-warm backdrop:bg-chocolate/30 sm:rounded-[44px]"
    >
      <div className="flex max-h-[85dvh] flex-col">
        <header className="shrink-0 border-b border-primary/15 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="rounded-full bg-peach p-2.5 text-baked">
              <Icon name="bell" className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="notifications-title"
                  className="text-lg font-bold tracking-[-.5px] sm:text-[22px]"
                >
                  Notifikasi & Update Pesanan
                </h2>
                <span className="rounded-full bg-baked px-2 py-1 text-[10px] font-bold text-white">
                  {unreadCount} Baru
                </span>
              </div>
              <p
                id="notifications-description"
                className="mt-1 text-xs leading-5 text-muted"
              >
                Update langsung dari oven dapur HappyBite & kurir pengantaran
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup notifikasi"
              className="rounded-full bg-peach p-2 hover:bg-blush"
            >
              <Icon name="close" className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div
              role="group"
              aria-label="Filter notifikasi"
              className="flex flex-wrap gap-1 rounded-2xl bg-peach p-1 sm:rounded-full"
            >
              {filters.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={filter === id}
                  onClick={() => setFilter(id)}
                  className={`rounded-full px-3 py-2 text-[10px] sm:text-[11px] ${filter === id ? 'bg-white font-bold shadow-soft' : 'hover:bg-white/60'}`}
                >
                  {label} (
                  {
                    notifications.filter(
                      (item) => id === 'all' || item.type === id,
                    ).length
                  }
                  )
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={markAllRead}
              disabled={!unreadCount || busy || loading}
              className="rounded text-[11px] font-semibold text-baked hover:underline disabled:cursor-default disabled:text-muted disabled:no-underline"
            >
              ✓ Tandai Semua Dibaca
            </button>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {(error || realtimeError) && (
            <div role="alert" className="p-5 text-center text-xs text-baked">
              <p>{error || realtimeError}</p>
              <button
                type="button"
                disabled={loading}
                onClick={refreshNotifications}
                className="mt-2 underline"
              >
                Muat Ulang Notifikasi
              </button>
            </div>
          )}
          {loading ? (
            <p role="status" className="p-10 text-center text-sm text-muted">
              Memuat notifikasi...
            </p>
          ) : visible.length ? (
            <ul className="divide-y divide-primary/15">
              {visible.map((item) => (
                <li
                  key={item.id}
                  className={`flex items-start gap-3 p-5 sm:gap-4 sm:p-6 ${item.read ? 'bg-white' : 'bg-canvas'}`}
                >
                  <button
                    type="button"
                    onClick={() => openNotification(item)}
                    disabled={busy}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                      <h3 className="min-w-0 flex-1 break-words text-sm font-bold leading-6 sm:text-lg">
                        {item.title}
                        {!item.read && (
                          <span className="ml-2 inline-block h-2 w-2 rounded-full bg-baked">
                            <span className="sr-only">Belum dibaca</span>
                          </span>
                        )}
                      </h3>
                      <time
                        dateTime={item.timestamp}
                        className="pt-1 text-[10px] text-muted"
                      >
                        {relativeTime(item.timestamp, now)}
                      </time>
                    </div>
                    <p className="mt-1 break-words text-xs leading-6 text-muted sm:text-sm">
                      {item.description}
                    </p>
                    {item.linkedOrderId && (
                      <span className="mt-3 flex items-center justify-end gap-1 rounded-full border border-primary/15 bg-white px-4 py-3 text-[11px] font-bold text-baked hover:bg-peach">
                        <Icon name="receipt" className="h-3.5 w-3.5" />
                        Lihat Rincian Pesanan →
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            !error && (
              <div className="px-6 py-16 text-center">
                <Icon name="bell" className="mx-auto h-8 w-8 text-primary" />
                <p className="mt-3 text-sm font-semibold">
                  {filter === 'all'
                    ? 'Belum ada notifikasi.'
                    : 'Belum ada notifikasi di kategori ini.'}
                </p>
                <p className="mt-2 text-xs leading-5 text-muted">
                  Update pesananmu akan muncul di sini.
                </p>
              </div>
            )
          )}
        </div>
        <div
          aria-hidden="true"
          className="h-8 shrink-0 border-t border-primary/10 bg-peach sm:h-12"
        />
      </div>
    </dialog>,
    document.body,
  )
}
