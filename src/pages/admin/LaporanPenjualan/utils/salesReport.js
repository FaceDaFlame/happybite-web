const dayMs = 86400000
const jakartaDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Jakarta',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function dateKey(timestamp) {
  const parts = Object.fromEntries(
    jakartaDate
      .formatToParts(new Date(timestamp))
      .map((part) => [part.type, part.value]),
  )
  return `${parts.year}-${parts.month}-${parts.day}`
}

export function validDate(value) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(`${value}T00:00:00Z`)) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value
  )
}

export function defaultRange(orders, today) {
  const dates = orders.map((order) => dateKey(order.timestamp)).sort()
  return { start: dates[0] || today, end: dates.at(-1) || today }
}

export function ordersInRange(orders, start, end) {
  if (!validDate(start) || !validDate(end) || start > end) return []
  return orders.filter(
    (order) =>
      dateKey(order.timestamp) >= start && dateKey(order.timestamp) <= end,
  )
}

export function reportStats(orders) {
  const total = orders.reduce((sum, order) => sum + order.total, 0)
  const products = new Map()
  for (const order of orders)
    for (const item of order.items) {
      const key = item.productId || item.name
      const product = products.get(key) || { name: item.name, quantity: 0 }
      product.quantity += item.quantity
      products.set(key, product)
    }
  const top =
    [...products.values()].sort(
      (a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name, 'id'),
    )[0] || null
  return {
    total,
    count: orders.length,
    aov: orders.length ? total / orders.length : 0,
    top,
  }
}

function groupDate(day, grouping) {
  if (grouping === 'monthly') return `${day.slice(0, 7)}-01`
  if (grouping === 'weekly') {
    const date = new Date(`${day}T00:00:00Z`)
    date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7))
    return date.toISOString().slice(0, 10)
  }
  return day
}

export function salesTrend(orders, start, end, grouping) {
  if (!orders.length || !validDate(start) || !validDate(end) || start > end)
    return { buckets: [], sparse: false }
  const groups = new Map()
  const days =
    (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) /
      dayMs +
    1
  // Keep extreme user-selected date ranges bounded without dropping any sales.
  // Normal ranges include zero-sale days; long ranges show only occupied periods.
  const sparse = days > 366
  if (!sparse)
    for (
      let time = Date.parse(`${start}T00:00:00Z`);
      time <= Date.parse(`${end}T00:00:00Z`);
      time += dayMs
    ) {
      groups.set(
        groupDate(new Date(time).toISOString().slice(0, 10), grouping),
        [],
      )
    }
  for (const order of orders) {
    const key = groupDate(dateKey(order.timestamp), grouping)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(order)
  }
  const buckets = [...groups]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, items]) => {
      const last = new Date(`${key}T00:00:00Z`)
      if (grouping === 'weekly') last.setUTCDate(last.getUTCDate() + 6)
      if (grouping === 'monthly') last.setUTCMonth(last.getUTCMonth() + 1, 0)
      const finalDay = last.toISOString().slice(0, 10)
      return {
        key,
        start: key < start ? start : key,
        end: finalDay > end ? end : finalDay,
        ...reportStats(items),
      }
    })
  return { buckets, sparse }
}

export function paymentStatus(order) {
  if (order.paymentStatus?.toLowerCase() === 'lunas') return 'lunas'
  if (order.paymentStatus?.toLowerCase() === 'ditolak') return 'ditolak'
  if (order.paymentStatus?.toLowerCase() === 'menunggu verifikasi')
    return 'menunggu_verifikasi'
  return 'belum_dibayar'
}

export function paymentStatusLabel(order) {
  return {
    lunas: 'Lunas',
    menunggu_verifikasi: 'Menunggu Verifikasi',
    belum_dibayar: 'Belum Dibayar',
    ditolak: 'Ditolak',
  }[paymentStatus(order)]
}

export function isQualifyingSale(order) {
  return order.status !== 'dibatalkan' && paymentStatus(order) === 'lunas'
}

export const reportDate = (date) =>
  new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
export const periodLabel = (start, end) =>
  start === end
    ? reportDate(start)
    : `${reportDate(start)} – ${reportDate(end)}`
