import { supabase } from '@/lib/supabaseClient'

export function mapNotification(row) {
  return {
    id: row.id,
    userId: row.user_id,
    type: 'status',
    eventType: row.tipe,
    title: row.judul,
    description: row.deskripsi,
    timestamp: row.created_at,
    read: row.sudah_dibaca,
    linkedOrderId: row.order_id,
  }
}

export async function getMyNotifications(userId) {
  if (!userId) return []
  const { data, error } = await supabase
    .from('notifications')
    .select(
      'id, user_id, order_id, tipe, judul, deskripsi, sudah_dibaca, created_at',
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(mapNotification)
}

async function authenticatedId(expectedId) {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!data.user || (expectedId && data.user.id !== expectedId))
    throw new Error('Sesi telah berubah. Silakan masuk kembali.')
  return data.user.id
}

export async function markNotificationAsRead(notificationId, expectedUserId) {
  const userId = await authenticatedId(expectedUserId)
  const { error } = await supabase
    .from('notifications')
    .update({ sudah_dibaca: true })
    .eq('id', notificationId)
    .eq('user_id', userId)
  if (error) throw error
}

export async function markAllNotificationsAsRead(userId) {
  await authenticatedId(userId)
  const { error } = await supabase
    .from('notifications')
    .update({ sudah_dibaca: true })
    .eq('user_id', userId)
    .eq('sudah_dibaca', false)
  if (error) throw error
}
