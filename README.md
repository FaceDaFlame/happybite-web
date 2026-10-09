# HappyBite Home

Responsive Indonesian bakery homepage built with React, Vite, and Tailwind CSS v3, based on the supplied HappyBite mockup with the updated, simplified Hero, About, testimonial heading, and footer.

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. To check a production build:

```sh
npm run lint
npm run build
npm run preview
```

## Project structure

Each page directory contains its page component and an index.js re-export. Components used only by that page live in its components/ directory. Cross-folder imports use @/, configured in both vite.config.js and jsconfig.json.

```text
src/
  pages/
    Home/                Home.jsx, index.js, components/
    Login/               Login.jsx, index.js, components/
    CatalogMenu/         CatalogMenu.jsx, index.js, components/
    ProductDetail/       ProductDetail.jsx, index.js, components/
    Cart/                Cart.jsx, index.js, components/
    Checkout/            Checkout.jsx, index.js, components/
    Payment/             Payment.jsx, index.js, components/
    OrderHistory/        OrderHistory.jsx, index.js, components/, utils/orderPdf.js
    AccountPlaceholder/  AccountPlaceholder.jsx, index.js
  components/
    Navbar/              Navbar, NavigationLink, ProfileDropdown, NotificationButton, NotificationPanel
    Footer/              Footer
    StepProgress/        CheckoutSteps
    Animation/           Reveal, shared animation presets
    Brand.jsx
    Icon.jsx
    SiteDialog.jsx
  context/               Auth, Orders, Notifications providers and hooks
  data/                  Catalog, cart reducer, session helpers, orders, notifications
  assets/                Custom assets
  routes/AppRoutes.jsx
  App.jsx
  main.jsx
  index.css
```

Page ownership is based on actual imports, including nested components:

| Page | Local components |
| --- | --- |
| Home | Hero, AboutSection, GalleryShowcase, ProductCard, CatalogGateBanner, HowItWorksSteps, StepCard, Testimonials, TestimonialCard, Button, SectionHeading, Stagger, MotionItem |
| Login | LoginForm, RegisterForm |
| CatalogMenu | CatalogProductCard, CatalogVariantDialog |
| ProductDetail | ProductDetailContent, ProductGallery, ImageZoom, RelatedProductCard |
| Cart | CartItemCard, CartGiftMessage |
| Checkout | CheckoutField |
| Payment | PaymentProof, PaymentSummary |
| OrderHistory | OrderHistoryCard, OrderHistoryDialog, OrderTracking |

The catalog, Home gallery, and pairing cards are distinct components with distinct markup; no shared ProductCard was introduced. Reveal is shared through Home and Footer, while Stagger and MotionItem are Home-only. Navbar's subcomponents are shared through Navbar itself. Components previously removed from the design remain absent.

src/routes/AppRoutes.jsx contains every existing Route and redirect. App.jsx retains the cart, greeting, checkout, and payment-session state, handlers, page titles, and scroll behavior. Existing auth/checkout guards remain inside their page components. No new cart context, guard, or reset button was added.

Auth and notifications persist per the existing providers; cart/session logic remains in src/data/cart.js and src/data/shopSession.js. Product and order fixtures remain in src/data/. The unused Vite template react.svg and vite.svg were removed; custom assets and public image URLs remain unchanged.

All moved tracked files used git mv. Each React component has its own file; JSX, styling, and component logic were preserved during extraction.

## Replace the photos

All photos are local placeholders in `public/images/`. See [the image guide](public/images/README.md) for filenames and recommended sizes. The generic cookie photos intentionally do not represent the named flavors yet.

Plus Jakarta Sans loads from Google Fonts with a system sans-serif fallback. The cookie brand mark is a local SVG placeholder in `public/favicon.svg`.

## Interactions and integration points

The mobile menu, gallery search, shopping cart, FAQ accordions, and keyboard-accessible dialogs work locally. The navbar cart link opens `/keranjang`. Dialogs support Escape, focus trapping, focus restoration, and background scroll locking. The layout respects reduced-motion preferences.

The Home, Login, and Catalog pages run without an authentication or commerce backend:

- Home account and ordering CTAs navigate to `/login`. The shared navbar's Katalog Menu link opens `/katalog`, with active route styling for Home and Catalog. The Login page's Kembali link returns to `/katalog`.
- Catalog search and category filters combine, and Load More reveals the remaining Supabase catalog products (eight initially). Adding from the catalog, detail page, and pairing cards updates shared product/variant lines; matching combinations merge quantities. Each package counts as one item. Cart snapshots and selection persist in `localStorage` under `happybite-cart-v1`; greeting preferences, checkout fields, and payment-session metadata persist through refresh in `sessionStorage` under `happybite-shop-v1`; wishlist selections are local to each page. Product reads and new checkout orders use Supabase.
- Cart quantities and the navbar badge count all items. The summary counts only selected quantities; unchecked items remain in the cart. Select All supports a mixed state, quantity has a minimum of one, delete removes a line, and Hapus Semua clears the entire cart. Checkout is disabled with no selected items.
- The cart and checkout totals equal the selected product subtotal, with no discounts or invented delivery fees. The optional gift message is limited to 150 characters and shares app-level state with checkout. Checkout reads current selected lines and product prices directly from shared state, so editing the cart cannot leave a stale order snapshot. Empty selection shows a return-to-cart state.
- Checkout retains its recipient, WhatsApp, optional email, address, region and postcode validation. The final submit calls `buat_pesanan` with product UUIDs/quantities, delivery details, greeting and existing zero shipping fee. Prices/totals are never sent. The RPC validates/decrements stock and calculates prices. Only a successful response clears the cart and opens `/pembayaran/:orderId`; errors preserve the cart.
- Payment fetches the RLS-protected order by URL UUID; refresh needs neither cart nor router state. Totals and delivery details come from `orders`; countdown uses `batas_bayar`. Expired or non-pending orders hide the proof form. Legacy `/pembayaran` redirects to checkout.
- `public/images/qris-demo.svg` remains the existing non-payable QR illustration. JPG/PNG/WEBP proof images (maximum 2 MiB) preview locally using revocable object URLs, then upload to the private `payment-proofs` bucket under the signed-in user/order UUIDs. `kirim_bukti_bayar` records the path/sender and transitions to `menunggu_konfirmasi`; this is not automatic payment approval.
- Checkout/payment no longer create orders in localStorage OrdersContext or generate local checkout notifications. Those history/admin/notification screens remain unchanged pending a separate database integration. Upload retries reuse a successfully uploaded path when its recording RPC fails; pending buttons prevent repeated submission.
- Storefront pages use a `flex min-h-dvh flex-col` root with a `flex-1` main and the shared footer directly afterward. Checkout uses 40px bottom padding instead of a fixed-height spacer. Login already uses the same flex layout pattern with its existing compact header/footer.
- Catalog photos, ratings, stock, prices, descriptions, and bundle variants come from Supabase. Promotional sections remain omitted throughout the app.
- Product details use Supabase gallery images, unit notes, and descriptions. Related products prefer the same category, filling up to three with other live products. Live products excluded from the catalog can still appear as related items.
- Detail quantity starts at one and updates the subtotal and shared cart by the selected quantity. Quantity and bundle choices are controlled locally and reset on product navigation. Buy Now puts that product/variant and chosen quantity into the shared cart, selects it alone, and opens checkout; other cart lines remain available but unselected. The WhatsApp button uses the existing contact-availability dialog until a verified contact URL is configured.
- Login validates email format and a nonempty password, supports password visibility and a checked-by-default remember-me option, and preserves input values when switching tabs.
- Registration validates a nonblank full name, a valid email, and a password of at least 8 characters. Its input values, password visibility, checkbox, and feedback are independent of Login and persist when switching tabs. Both forms use email and password only; registration does not include social login, password recovery, or discount offers.
- AuthProvider uses the existing `src/lib/supabaseClient.js` client. Login calls `signInWithPassword`; registration calls `signUp` with `options.data.nama_lengkap`, and the database trigger creates the profile. Supabase manages session persistence; the legacy `happybite-auth-v1` key is removed. After authentication, `profiles.nama_lengkap` and `profiles.role` populate the user (`pelanggan` or `admin`). A registration without a session prompts email confirmation. Successful customer login/registration returns home; admin login returns to `/admin`.
- The Navbar waits for session/profile restoration before rendering guest or member navigation. Logout awaits Supabase signOut, then returns home. Katalog, product details, cart, checkout, payment, profile and order history use ProtectedRoute; guests redirect to `/login`. Profile failures show a retry message instead of granting access or guessing a role. Cart snapshots, orders and notifications remain local browser data for now; admin products and customer catalog/detail pages use Supabase.
- Order history reads shared orders, newest first, scoped to the signed-in account's normalized email. Orders survive refresh and browser restarts on the same browser/origin. Two clearly labeled Demo examples (shipping and completed) remain for illustration; only the shipping example has a tracking bar. Three cards appear initially; Load More reveals the rest. Status counts, invoice/product search, and date filters use current state and the actual current date. Edited courier notes persist too. Recipient and address details are available in Detail Pesanan. The admin chat button opens the existing contact-availability dialog until a verified WhatsApp URL is configured. There is no backend synchronization, courier integration, or payment verification.
- The Login footer opens help or availability dialogs for privacy and terms. The SSL badge and copyright copy follow the approved mockup; transport security must be configured on the deployment host.
- Only signed-in navigation shows the notification bell, next to the profile button. Guest catalog links have a lock icon on desktop and mobile. Successfully placing an order creates one unread status notification, deduplicated by account, order ID, and status. Existing checkout orders are recovered on startup; sample orders do not generate alerts. Notification links mark the item read and open order history. Mark All Read applies to the current account. Only order-status notifications are supported; retired categories are removed when reading older browser storage and excluded from badges and counts.
- The notification modal uses a dimmed backdrop, trapped keyboard focus, Escape/outside/X dismissal, restored trigger focus, and a separately scrollable list. Relative timestamps refresh every minute while open. Notifications are local school-project state; there are no backend courier updates or push notifications.
- Individual review stars, testimonials, certifications, and contact details are static content.
- Footer contact and social buttons currently show an availability message. Replace them with verified contact URLs before launch.
- Catalog products, prices, checkout order creation and payment-proof recording use Supabase. Payment approval remains an admin process.

## Admin routing skeleton

The admin section deliberately contains heading-only pages and a minimal shared sidebar/top area; the final page designs are not implemented yet.

```text
src/pages/admin/
  components/
    AdminLayout/       AdminLayout.jsx, index.js
    AdminSidebar/      AdminSidebar.jsx, index.js
    AdminRoute/        AdminRoute.jsx, index.js
  AdminLogin/          AdminLogin.jsx, index.js, components/AdminLoginForm.jsx
  Dashboard/           Dashboard.jsx, index.js, components/.gitkeep
  ManajemenProduk/     ManajemenProduk.jsx, index.js, components/, utils/
  KelolaPesanan/       KelolaPesanan.jsx, index.js, components/, utils/
  LaporanPenjualan/    LaporanPenjualan.jsx, index.js, components/, utils/
```

- `/admin/login` is public and outside AdminLayout. Its form uses the same Supabase password login as the customer form. No mock credentials or hardcoded admin identity remain.
- `/admin`, `/admin/produk`, `/admin/pesanan`, and `/admin/laporan` nest under AdminRoute and AdminLayout. Guards wait for the session and profile: guests redirect to `/admin/login`, authenticated non-admins to `/`.
- Sidebar NavLinks highlight the active page. Pengaturan Dapur remains a placeholder; Keluar awaits Supabase signOut and returns home.
- Admin access comes only from `profiles.role = admin`; signup never sends a role or inserts a profile. Admin jobTitle remains `Head Baker & Owner`. Configure database RLS to allow users to read their own profile without allowing them to promote their role.
- Supabase integration checks use intercepted Auth/profile HTTP responses, covering session restoration, redirects, errors, signup confirmation, admin/customer roles and sign-out. Existing demo-auth browser scripts predate this migration.

## Admin product management

`/admin/produk` reuses the admin shell and non-modal right-hand editor. Products (including drafts/hidden items) and category options come only from Supabase via `adminProductService.js`, `productService.js`, and `ProductsProvider`. The legacy `happybite-products-v1` localStorage key is removed on startup; no provider reads seed products or restores a local product fallback.

- Search, category/stock filters, pagination, selection, and PDF export use the fetched list. Loading, failure/retry, and empty results are explicit.
- Create, edit, duplicate-as-draft, and delete await Supabase writes. Errors leave the form/data intact. Product writes use the existing signed-in client and database RLS; no keys or additional clients are created.
- The editor maps name/price/stock/chiller/location/oven/duration/descriptions, SKU, image, and visibility to their database columns. Category options use the database UUID. Badge, unit, short description, and catalog visibility are editable. Only the bundles category shows removable variant chips; comma/Enter/blur commits variants into the text array. Reviews/ratings are never written.
- New products generate normalized slugs with the first available numeric suffix, including retrying a concurrent unique-slug conflict. Editing preserves the existing slug. Blank new SKUs receive a generated identifier.
- Existing photo selection still accepts JPG/PNG/WEBP up to 2 MB and writes the resulting data URL to `gambar_url`; a Storage bucket/upload workflow is not configured in this step. Existing gallery URLs stay untouched on edit.
- Product changes are visible on the next customer catalog/detail request. New checkout orders use the Supabase RPC and stock deduction; the history/admin-order screens are still awaiting database integration.
- Run `node .artifacts/supabase-admin-products-check.cjs` with Vite on `127.0.0.1:5185` and the temporary Playwright harness. It uses isolated intercepted responses, never real database writes, to check field mappings, async failures, create/edit/delete/duplicate, slug conflicts, category/chip behavior, preservation of reviews/slug, refresh persistence, and customer visibility.

## Admin order management

`/admin/pesanan` reads the existing OrdersContext. Admins see orders from all customer accounts stored in this browser, alongside the two clearly marked existing demo orders. Customer history and notifications remain scoped to the signed-in account; there is no backend or cross-device synchronization yet.

- `fulfillmentStatus` tracks `pending → baking → packing → shipping → completed`, independently of payment status. Older orders are normalized on read. `deliveryMethod` defaults to `Belum ditentukan` until supplied; no courier assignment or GPS data is fabricated.
- Status transitions persist to localStorage, update customer history, and generate customer-owned notifications. Completing an order sets its delivery timestamp. Repeated clicks with a stale status cannot skip a stage, and failed writes do not update the UI state.
- The table supports combined order/customer search, status/delivery/payment filters, five-row pagination, and CSV export of all filtered rows. Customer-entered CSV cells are quoted and protected against spreadsheet formula interpretation.
- Row selection opens an inline, docked detail panel showing the actual recipient/address/notes, items and totals. The table total and panel summary omit payment-method tags. Copy and browser print work; the panel remains usable after a status change moves a row out of the active filter.
- `.artifacts/admin-orders-check.cjs` verifies a real checkout through all admin status transitions, customer-history and notification synchronization, account visibility, persistence, copy/print/export, filters/pagination, storage failure and desktop/tablet layout.

## Admin sales reports

`/admin/laporan` derives all metrics from OrdersContext entries with `source: 'checkout'`; demo orders are excluded even when no real orders exist. Default dates span all existing checkout orders and expand when new orders arrive, unless the admin chooses a custom period.

- Dates are inclusive in Asia/Jakarta (WIB). Revenue is the sum of every order total in the period, including pending/cancelled orders as specified; this is order value, not verified funds received. AOV is rounded to whole rupiah for display; zero orders produce Rp 0. Best sellers aggregate item quantities by product identity, using order snapshots.
- The SVG chart has daily, Monday-based weekly, and calendar-month grouping, keyboard/hover callouts, and empty states. Normal periods include days without sales; periods longer than a year show occupied buckets only, explicitly labeled, to bound rendering without dropping any revenue. No fabricated comparison series is displayed.
- Transaction search and payment-status filters affect the paginated table and its export, while summary cards/chart and header exports follow the date range. Cancelled orders take precedence over paid/pending status in the table filter.
- PDF export generates a paginated text report. Export Excel downloads a UTF-8 CSV compatible with Excel (not an XLSX workbook); table CSV includes every matching row, not only the visible page. CSV values are escaped and spreadsheet formulas neutralized. Print uses the browser dialog.
- `.artifacts/sales-report-check.cjs` checks actual checkout updates, demo exclusion, empty/invalid ranges, WIB boundaries, quantities/AOV, daily/weekly/monthly totals, table filters/pagination, all exports/printing and responsive widths.

## Animation

`src/components/Animation/presets.js` centralizes the Motion (`motion/react`) presets, shared by Reveal and the Home animation components.
Sections reveal at 20% visibility with a 24px rise and a 0.55s ease-out, reset
when leaving the viewport, and replay on every re-entry in either scroll direction.
Card grids stagger by 0.12s; the hero uses the same viewport-triggered sequence with
its image entering from the right. Product cards scale to 1.03
on hover. Reduced-motion users receive
ordinary HTML with all content visible immediately. Existing element types,
Tailwind layout classes, and interactive controls are preserved.

Browser animation checks cover repeating reveals and resets, stagger timing,
hover scales, reduced-motion visibility, and CTA interaction during entrance.

## Verification

Production build and ESLint checks pass. Browser checks cover image loading, runtime errors, search results and empty states, account navigation, FAQ, and mobile navigation.

Catalog browser checks cover direct loading and refresh, active navigation, combined search/category filtering, category counts, empty states, load more, wishlist toggles, bundle selection, cart-count persistence across routes, and responsive grids without horizontal overflow at 320, 375, 640, 768, 1024, 1312, and 1536 pixels.

Product detail browser checks cover catalog-to-detail links, active navigation, dynamic breadcrumbs, thumbnail changes, zoom dismissal and focus restoration, wishlist, quantity minimum and subtotal, shared cart increments, pairing links and state reset, bundle options, checkout navigation, invalid product IDs, direct refresh, image loading, and responsive layouts at 320–1536 pixels.

Login browser checks cover direct loading and refresh at `/login`, Home account links, form validation, password visibility, remember-me state, tab and keyboard navigation, footer dialogs, and responsive layouts from 320 to 1280 pixels.

Registration browser checks cover inline errors for empty/whitespace names, invalid emails, and passwords under 8 characters; valid submissions; separate Login/registration state; password toggles; tab switching and value persistence; input focus styling; and layouts from 320 to 1280 pixels.

Cart browser checks cover empty state, adds from catalog and detail, merged quantities and separate variants, select-all/mixed selection, partial totals, quantity minimum, synchronized badges, removal and clear, 150-character message limits, shared checkout data, and layouts without overflow at 320–1536 pixels.

Checkout browser checks cover selected items and totals, shared navbar/badge, greeting persistence when editing the cart, required/invalid fields and focus, payment navigation, Buy Now, empty/direct-refresh states, and no overflow or extra footer spacer at 320, 375, 640, 768, 1024, 1312, and 1536 pixels.

Payment browser checks cover all recipient fields, direct-route and stale-order guards, preserved IDs/deadlines across refresh, timer ticks, copy/download, invalid/oversized files, removal and drag/drop, disabled/valid confirmation, expiry/restart, demo success, and responsive layouts at 320–1536 pixels.

Authentication browser checks cover Login/Register validation and redirects, exact guest/member link order, active route styling, localStorage refresh, password exclusion, profile/history routes, dropdown outside-click/Escape/focus behavior, mobile menus, logout, guest route guards, and unchanged cart quantities.

Order history browser checks cover authentication redirects, navbar/dropdown access, status counts, combined search/date filters, empty states, load more, detail dialogs, local note edits, PDF downloads, reduced-motion tracking, refresh, and responsive layouts without overflow at 320–1536 pixels.

Connected-order browser checks cover Cart → Checkout → guest sign-in → QRIS confirmation → history, exact recipient/item/greeting/total snapshots, persistence across reload and a new browser session, account isolation, storage failures without cart loss, repeated-confirmation deduplication, partial checkout and variants, date/search/status filtering, and persisted note edits.

Notification browser checks cover guest/member navbar differences, catalog lock icons, checkout-generated alerts and deduplication, dynamic badges/category counts, mark-all and individual read persistence, account isolation, modal focus and dismissal, order-history links, and scrollable layouts at 320–1536 pixels. Legacy unsupported-category fixtures verify that old entries no longer appear or affect unread counts.

The folder refactor additionally verifies unchanged ASTs for all 72 existing functions, constants, Route JSX, App state, and CSS; resolves every import; checks shared/page-only component ownership; and exercises all existing routes, checkout, and notifications in the browser.

## Hosting

React Router uses browser history. Configure the production host to serve `index.html` for app routes such as `/login`, `/katalog`, `/checkout`, and `/pembayaran`, so direct links and refreshes work. Vite's development server already supports this fallback.

## Supabase Auth configuration

The existing client reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from `.env.local`. Never place a service-role key in frontend code. The `profiles` table and signup trigger must already exist; no frontend profile inserts are performed. Existing browser-only mock accounts are not migrated into Supabase. Use a registered, confirmed account; assign admin roles through trusted database administration.

Reference: [Supabase signup](https://supabase.com/docs/reference/javascript/auth-signup) and [auth state subscription](https://supabase.com/docs/reference/javascript/auth-onauthstatechange).

## Supabase customer products

`src/services/productService.js` uses the existing Supabase client and signed-in session to read `products` joined with `categories`. Catalog queries require `is_live` and `is_catalog_visible`; detail URLs `/produk/:slug` and `/katalog/:slug` require `is_live`. The mapper keeps the existing component field names and badge classes. Public Home gallery/search previews remain editorial content in `src/data/homeGallery.js`, without querying login-only product rows.

Cart lines store product snapshots with UUID `id` and a separate product/variant `lineId`. Legacy non-UUID entries are discarded on startup; Cart, Checkout, Payment and order snapshots do not resolve products from seed data. Zero display stock disables ordering unless `adonan_dingin > 0` (the schema has no separate made-to-order flag). Admin edits update Supabase display stock; the checkout `buat_pesanan` RPC atomically validates and deducts stock when creating an order.

Browser regression: `node .artifacts/supabase-products-check.cjs` with Vite on `127.0.0.1:5185` and the temporary Playwright harness. It intercepts Supabase responses in isolated browser contexts, covering authenticated queries, loading/error/retry/empty states, pagination, slug navigation, related products, stock rules, variants, migration, and snapshot checkout/payment. It does not write to the real database.

## Supabase checkout and payment

`src/services/orderService.js` uses the existing client for `buat_pesanan`, owned-order reads, private proof uploads and `kirim_bukti_bayar`. DB errors show Indonesian feedback; no coupons or client-provided prices/totals are involved. The delivery method currently defaults to "Belum ditentukan" and shipping to zero because Checkout has no configured method/rate selector.

The supplementary QRIS item-list query assumes `order_items.order_id`, `product_id` (FK to products), `jumlah`, and `harga_satuan`, with optional `nama_produk`, `gambar_url`, and `suhu_penyajian`. This table schema was not supplied, so a separate error/retry state keeps payment functional if the column names differ; saved invoice prices never fall back to cart prices. Confirm these columns against the database before release.

`node .artifacts/supabase-checkout-check.cjs` exercises the existing SDK with isolated intercepted responses: RPC payload allowlist, stock/network errors, cart preservation/clearing, authoritative totals/deadline, refresh, upload validation/path/sender, object URL cleanup, retry, status/expiry/404 states, missing item-schema fallback and mobile layout. The test never writes to the real database.
