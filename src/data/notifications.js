export function relativeTime(timestamp, now) {
  const minutes = Math.max(0, Math.floor((now - Date.parse(timestamp)) / 60000))
  if (!minutes) return 'Baru saja'
  if (minutes < 60) return `${minutes} mnt lalu`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`
  return `${Math.floor(hours / 24)} hari lalu`
}
