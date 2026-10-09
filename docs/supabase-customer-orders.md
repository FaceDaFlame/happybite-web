# Customer order history and notifications

Riwayat Pesanan fetches `orders` with nested `order_items` and `payments`, filtered by the AuthContext user ID and sorted newest first. Names, quantities and unit prices are purchase snapshots, never read from the current catalog. The database supplies subtotal, ongkir and total. There are no local sample orders on this page.

The existing details dialog shows recipient, full delivery address, courier notes, delivery method, item snapshots and payment information. A private proof is signed for five minutes on request. Item photos are read from the nested `order_items → products(gambar_url)` relation; names and prices still come exclusively from the order snapshot. The cookie icon is used only if a photo is missing, inaccessible or fails to load. The old local-only courier-note editor is removed; no database mutation API for that operation was supplied.

Unpaid orders link to the existing `/pembayaran/:orderId` route. Only `dikirim` orders offer receipt confirmation, calling `konfirmasi_pesanan_selesai({ p_order_id })`, then reloading history. React never updates the order status directly.

Notifications are read from `notifications`, scoped to the customer ID. The provider subscribes to filtered `postgres_changes` events and refetches on INSERT/UPDATE/DELETE, reconnect and window focus. Results are deduplicated by ID; stale requests and previous account data are discarded. Mark-read actions update optimistically and roll back on failure. Writes are explicitly filtered by the authenticated user ID, with RLS as the authority. No frontend code creates notifications.

## Storage migration

- `happybite-notifications-v1` is deleted on provider mount and is never restored or written again.
- Customer Order History no longer reads `happybite-orders-v1`. That key is **not deleted**, because the out-of-scope legacy sales report still uses OrdersProvider. Old local orders are never merged into customer history or used to generate notifications.
- Cart, Auth/Supabase session and other unrelated storage remain unchanged.

## Supabase checks (manual)

No database schema or production data is modified by this frontend change. Verify the existing project has:

1. Foreign keys for nested orders → order_items and orders → payments selects.
2. Customer SELECT RLS on their own orders, associated items and payments. Notifications SELECT/UPDATE policies must enforce `user_id = auth.uid()` (including UPDATE WITH CHECK), with privileges to update `sudah_dibaca`.
3. `public.notifications` enabled in the `supabase_realtime` publication. See [Supabase Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes). Database order-event triggers must create notifications; this frontend intentionally does not insert any.
4. RPC `konfirmasi_pesanan_selesai(p_order_id uuid)` executable by authenticated customers, checking ownership and allowing only `dikirim → selesai` atomically. The supplied request named the RPC but not its parameter; this integration assumes `p_order_id` like the other order RPCs. Adjust the one service parameter if the deployed signature differs.
5. Private `payment-proofs` Storage SELECT policy allowing the customer to read only proofs belonging to their orders. No public URLs or service-role keys are used.

## Verification

Run `npm run build` and `npm run lint`. `.artifacts/supabase-customer-orders-check.cjs` uses the real SDK and an isolated browser with intercepted HTTP and Phoenix WebSocket responses (no production writes). It needs the same temporary Playwright/Edge harness as the earlier integration checks. Live policies, RPC permissions and publication configuration must still be verified against the actual Supabase project.
