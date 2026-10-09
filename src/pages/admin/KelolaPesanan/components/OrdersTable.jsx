import { orderStatusLabels } from '@/services/adminOrderService'
import { customerName, initials, orderTime } from '@/data/orderFulfillment'
import { formatRupiah } from '@/data/orderHistory'
import { relativeTime } from '@/data/notifications'

export default function OrdersTable({ orders, selectedKey, onSelect, now }) {
  return (
    <div className="overflow-x-auto rounded-t-2xl bg-white">
      <table className="w-full min-w-[530px] table-fixed text-left text-xs">
        <colgroup>
          <col className="w-8" />
          <col className="w-[29%]" />
          <col className="w-[28%]" />
          <col />
          <col className="w-28" />
        </colgroup>
        <thead className="bg-peach text-[10px] font-semibold tracking-wide">
          <tr>
            <th className="py-5">
              <span className="sr-only">Pilih pesanan</span>
            </th>
            {['NO. PESANAN & WAKTU', 'PELANGGAN', 'RINCIAN ITEM', 'TOTAL'].map(
              (label) => (
                <th key={label} className="px-2 py-5">
                  {label}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const selected = selectedKey === order.id
            const name = customerName(order)
            const summary = order.items
              .map((item) => `${item.quantity}× ${item.name}`)
              .join(', ')
            return (
              <tr
                key={order.id}
                onClick={() => onSelect(order.id)}
                className={`cursor-pointer border-b border-peach last:border-0 ${selected ? 'bg-peach/80 ring-1 ring-inset ring-baked/60' : 'hover:bg-canvas'}`}
              >
                <td className="pl-3 py-5">
                  <input
                    type="radio"
                    name="selected-admin-order"
                    aria-label={`Pilih pesanan ${order.number}`}
                    checked={selected}
                    onChange={() => onSelect(order.id)}
                    className="h-3.5 w-3.5 accent-baked"
                  />
                </td>
                <td className="px-2 py-5 align-top">
                  <p
                    className={`break-words font-bold ${selected ? 'text-baked' : ''}`}
                  >
                    {order.number}
                  </p>
                  <p className="mt-1 text-[10px] leading-4 text-muted">
                    <time dateTime={order.timestamp}>
                      {orderTime(order.timestamp)}
                    </time>{' '}
                    • {relativeTime(order.timestamp, now)}
                  </p>
                  <p className="mt-1 text-[10px] text-baked">
                    {orderStatusLabels[order.status] || order.status}
                  </p>
                  {order.source === 'sample' && (
                    <p className="mt-1 text-[10px] text-muted">
                      Demo · Data contoh
                    </p>
                  )}
                </td>
                <td className="px-2 py-5 align-top">
                  <div className="flex items-start gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blush text-[10px] font-bold">
                      {initials(name)}
                    </span>
                    <div className="min-w-0">
                      <p className="break-words font-semibold">{name}</p>
                      <p className="mt-1 break-words text-[10px] leading-4 text-muted">
                        {order.recipient?.whatsapp ||
                          (order.greeting
                            ? 'Kartu ucapan'
                            : 'Nomor belum tersedia')}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-2 py-5 align-top">
                  <p
                    title={summary}
                    className="line-clamp-2 font-semibold leading-5"
                  >
                    {summary}
                  </p>
                </td>
                <td className="whitespace-nowrap px-2 py-5 align-top font-bold">
                  {formatRupiah(order.total)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {!orders.length && (
        <p className="p-10 text-center text-sm text-muted">
          Tidak ada pesanan yang cocok dengan filter ini.
        </p>
      )}
    </div>
  )
}
