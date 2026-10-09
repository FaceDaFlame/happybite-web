import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from './authContext'
import { NotificationsContext } from './notificationsContext'
import { supabase } from '@/lib/supabaseClient'
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/services/notificationService'

export default function NotificationsProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.role === 'pelanggan' ? user.id : null
  // A new identity gets a new instance: no old user's data or pending reads survive.
  return (
    <SessionNotifications key={userId || 'anonymous'} userId={userId}>
      {children}
    </SessionNotifications>
  )
}

function SessionNotifications({ userId, children }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(Boolean(userId))
  const [error, setError] = useState('')
  const [realtimeError, setRealtimeError] = useState('')
  const [optimistic, setOptimistic] = useState(new Set())
  const active = useRef(false)
  const revision = useRef(0)
  const pending = useRef(new Set())
  const invalidate = useCallback(() => {
    revision.current++
  }, [])

  const refreshNotifications = useCallback(async () => {
    if (!userId || !active.current) return
    const request = ++revision.current
    setLoading(true)
    try {
      const next = await getMyNotifications(userId)
      if (!active.current || request !== revision.current) return
      setItems([
        ...new Map(
          next
            .filter((item) => item.userId === userId)
            .map((item) => [item.id, item]),
        ).values(),
      ])
      setError('')
    } catch (error) {
      console.error('getMyNotifications', error)
      if (active.current && request === revision.current)
        setError('Gagal memuat notifikasi.')
    } finally {
      if (active.current && request === revision.current) setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    active.current = true
    try {
      localStorage.removeItem('happybite-notifications-v1')
    } catch {
      /* Storage may be disabled. */
    }
    if (!userId)
      return () => {
        active.current = false
      }
    const initialRequest = setTimeout(refreshNotifications, 0)
    const channel = supabase
      .channel('customer-notifications-' + userId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: 'user_id=eq.' + userId,
        },
        () => {
          void refreshNotifications()
        },
      )
      .subscribe((status, error) => {
        if (!active.current) return
        if (status === 'SUBSCRIBED') {
          setRealtimeError('')
          void refreshNotifications()
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('notifications realtime', error || status)
          setRealtimeError(
            'Update langsung terputus. Muat ulang notifikasi untuk melihat pembaruan.',
          )
        }
      })
    const onFocus = () => {
      void refreshNotifications()
    }
    window.addEventListener('focus', onFocus)
    return () => {
      active.current = false
      clearTimeout(initialRequest)
      invalidate()
      window.removeEventListener('focus', onFocus)
      void supabase.removeChannel(channel)
    }
  }, [userId, refreshNotifications, invalidate])

  async function markAsRead(id) {
    const ids = items
      .filter((item) => !item.read && (id === undefined || item.id === id))
      .map((item) => item.id)
    if (!userId || !ids.length || pending.current.size) return false
    pending.current = new Set(ids)
    setOptimistic(new Set(ids))
    setError('')
    try {
      if (id === undefined) await markAllNotificationsAsRead(userId)
      else await markNotificationAsRead(id, userId)
      if (!active.current) return false
      // Invalidate any older refresh before applying the server-confirmed read.
      revision.current++
      setItems((current) =>
        current.map((item) =>
          ids.includes(item.id) ? { ...item, read: true } : item,
        ),
      )
      // Reconcile notifications inserted during the write, including rows
      // marked by mark-all that were not yet present in the local list.
      await refreshNotifications()
      return active.current
    } catch (error) {
      console.error('mark notifications read', error)
      if (active.current) setError('Gagal menandai notifikasi. Coba lagi.')
      return false
    } finally {
      pending.current.clear()
      if (active.current) {
        setOptimistic(new Set())
        setLoading(false)
      }
    }
  }
  const notifications = items.map((item) =>
    optimistic.has(item.id) ? { ...item, read: true } : item,
  )
  const markAllAsRead = () => markAsRead()
  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount: notifications.filter((item) => item.read === false).length,
        loading,
        error,
        realtimeError,
        busy: optimistic.size > 0,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        markRead: markAsRead,
        markAllRead: markAllAsRead,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}
