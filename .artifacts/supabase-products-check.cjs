// Real client/query code, isolated browser and intercepted Supabase responses.
const { chromium } = require(process.env.TEMP + '/happybite-auth-check/node_modules/playwright')
const assert = require('node:assert/strict')
const base = 'http://127.0.0.1:5185'
const uuid = n => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const categories = ['stuffed', 'signature', 'bundles', 'seasonal', 'vegan', 'drinks'].map((slug, i) => ({ id: uuid(i + 100), nama: slug, slug }))
const makeProduct = (n, slug, category = 'signature', extra = {}) => ({
  id: uuid(n), slug, sku: `HB-${String(n).padStart(2, '0')}`, nama: `DB Cookie ${n}`,
  category_id: categories.find(c => c.slug === category).id,
  categories: categories.find(c => c.slug === category), harga: 28000,
  deskripsi_singkat: 'Deskripsi database', deskripsi: 'Deskripsi lengkap dari database.',
  badge: 'Best Seller', rating: 4.9, jumlah_ulasan: 12, stok_siap_jual: 22,
  catatan_stok: null, adonan_dingin: 0, satuan: '/ pcs (110gr)', varian: [],
  galeri: ['/images/red-velvet.jpg'], gambar_url: '/images/classic-chocochip.jpg',
  is_live: true, is_catalog_visible: true, ...extra,
})
let rows = [
  makeProduct(1, 'red-velvet', 'stuffed', { nama: 'Red Velvet Database', harga: 34000 }),
  makeProduct(2, 'classic-nyc', 'signature', { nama: 'The OG Classic Chocochip NYC' }),
  makeProduct(3, 'sold-out', 'vegan', { stok_siap_jual: 0 }),
  makeProduct(4, 'chilled-cookie', 'stuffed', { stok_siap_jual: 0, adonan_dingin: 12 }),
  makeProduct(5, 'bundle-box', 'bundles', { varian: ['Mix A', 'Mix B'], harga: 118000 }),
  makeProduct(6, 'coffee', 'drinks', { is_catalog_visible: false }),
  ...Array.from({ length: 5 }, (_, i) => makeProduct(i + 7, `cookie-${i + 7}`, 'seasonal')),
  makeProduct(12, 'hidden-cookie', 'signature', { is_live: false }),
]

;(async () => {
  const { mapProduct, getBadgeStyle, isProductSoldOut } = await import('../src/services/productMapper.js')
  assert.equal(mapProduct(rows[0]).detailBadge, 'Best Seller #1 Stuffed Cookie')
  assert.equal(mapProduct(rows[0]).id, uuid(1))
  assert.equal(mapProduct(rows[0]).galleryImages.length, 2)
  assert.equal(mapProduct({ ...rows[0], stok_siap_jual: 5, catatan_stok: 'custom' }).stockNote, 'Sisa 5 pcs (Hampir Habis)')
  assert.equal(mapProduct({ ...rows[0], catatan_stok: 'custom' }).stockNote, 'custom')
  assert.equal(mapProduct(rows[5]).batchNote, 'Freshly Brewed Today')
  assert.equal(mapProduct(rows[5]).packagingNote, 'Sudah Termasuk Pajak & Botol Food-Grade')
  assert.equal(getBadgeStyle('Gift Ready'), 'bg-chocolate text-white')
  assert.equal(getBadgeStyle('unknown'), 'bg-blush text-chocolate')
  assert.ok(isProductSoldOut(mapProduct(rows[2])))
  assert.ok(!isProductSoldOut(mapProduct(rows[3])))

  const { loadEnv } = await import('vite')
  const env = loadEnv('development', process.cwd(), 'VITE_')
  const origin = new URL(env.VITE_SUPABASE_URL).origin
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  try {
    const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1320, height: 960 } })
    const page = await context.newPage()
    page.setDefaultTimeout(10000)
    const goto = path => page.goto(base + path, { waitUntil: 'domcontentloaded' })
    const errors = []
    page.on('pageerror', e => errors.push(e.message))
    let catalogMode = 'error'
    let detailMode = 'ok'
    let relatedFails = false
    let productRequests = 0
    let productGate = null
    await context.route('**/*', route => {
      const target = new URL(route.request().url()).origin
      return target === base || target === origin ? route.continue() : route.abort()
    })
    const user = { id: uuid(999), aud: 'authenticated', role: 'authenticated', email: 'products@example.test', app_metadata: { provider: 'email' }, user_metadata: {}, identities: [{ id: uuid(999), provider: 'email' }] }
    const token = [Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url'), Buffer.from(JSON.stringify({ sub: user.id, email: user.email, role: 'authenticated', exp: Math.floor(Date.now()/1000) + 3600 })).toString('base64url'), 'test-signature'].join('.')
    await context.route(origin + '/**', async route => {
      const request = route.request()
      const url = new URL(request.url())
      const params = url.searchParams
      const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'access-control-expose-headers': 'x-supabase-api-version', 'x-supabase-api-version': '2024-01-01' }, body: JSON.stringify(body) })
      if (url.pathname.endsWith('/token')) return json({ access_token: token, refresh_token: 'test-refresh', expires_in: 3600, token_type: 'bearer', user })
      if (url.pathname.endsWith('/profiles')) return json({ id: user.id, nama_lengkap: 'Pembeli Database', role: 'pelanggan' })
      if (url.pathname.endsWith('/categories')) return json(categories)
      if (url.pathname.endsWith('/products')) {
        productRequests++
        assert.equal(request.method(), 'GET', 'No DB inventory writes during this migration')
        assert.equal(params.get('select'), '*,categories(id,nama,slug)')
        assert.equal(params.get('is_live'), 'eq.true')
        assert.equal(request.headers().authorization, 'Bearer ' + token)
        if (productGate) await productGate
        if ((params.has('is_catalog_visible') && catalogMode === 'error') || (params.has('slug') && detailMode === 'error') || (params.has('limit') && relatedFails)) return json({ message: 'Test failure' }, 400)
        if (params.has('is_catalog_visible') && catalogMode === 'empty') return json([])
        let result = rows.filter(p => p.is_live)
        if (params.has('is_catalog_visible')) result = result.filter(p => p.is_catalog_visible)
        if (params.has('slug')) result = result.filter(p => 'eq.' + p.slug === params.get('slug'))
        if (params.has('category_id')) result = result.filter(p => 'eq.' + p.category_id === params.get('category_id'))
        if (params.get('id')?.startsWith('neq.')) result = result.filter(p => 'neq.' + p.id !== params.get('id'))
        if (params.get('id')?.startsWith('not.in.')) result = result.filter(p => !params.get('id').includes(p.id))
        result.sort((a, b) => a.sku.localeCompare(b.sku))
        if (params.has('limit')) result = result.slice(0, Number(params.get('limit')))
        // maybeSingle negotiates an object response (or an empty row set).
        if (params.has('slug') && request.headers().accept?.includes('object')) return result.length ? json(result[0]) : json(null)
        return json(result)
      }
      if (url.pathname.endsWith('/user')) return json(user)
      throw new Error('Unexpected request ' + url.pathname)
    })

    await goto('/katalog')
    await page.waitForURL('**/login')
    assert.equal(productRequests, 0, 'Products must not load before auth guard resolves')
    await page.locator('#login-email').fill(user.email)
    await page.locator('#login-password').fill('password123')
    await page.getByRole('button', { name: 'Masuk ke Akun HappyBite', exact: true }).click()
    await page.waitForURL(base + '/')
    assert.equal(productRequests, 0, 'Public Home editorial gallery does not query RLS products')
    await page.evaluate(() => {
      const legacy = [{ id: 'classic-nyc', productId: 'classic-nyc', quantity: 3, variant: '', selected: true }]
      localStorage.setItem('happybite-cart-v1', JSON.stringify(legacy))
      localStorage.setItem('happybite-shop-v1', JSON.stringify({ cartItems: legacy, checkout: { name: 'Keep recipient' } }))
    })
    await goto('/katalog')
    await page.getByText('Gagal memuat produk. Coba lagi.', { exact: true }).waitFor()
    assert.equal(await page.locator('article').count(), 0)
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('happybite-cart-v1'))), [])
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('happybite-shop-v1')).cartItems), [])
    catalogMode = 'ok'
    let releaseProducts
    productGate = new Promise(resolve => { releaseProducts = resolve })
    await page.getByRole('button', { name: 'Coba lagi', exact: true }).click()
    await page.getByText('Memuat produk...', { exact: true }).waitFor()
    releaseProducts(); productGate = null
    await page.getByText('Menampilkan 8 dari 10 varian produk pilihan', { exact: true }).waitFor()
    assert.equal(await page.locator('article').count(), 8)
    await page.getByRole('button', { name: /Muat Lebih Banyak/ }).click()
    assert.equal(await page.locator('article').count(), 10)
    await page.getByRole('button', { name: 'Stuffed Soft Cookies (2)', exact: true }).click()
    assert.equal(await page.locator('article').count(), 2)
    await page.getByRole('button', { name: 'Semua Varian (10)', exact: true }).click()
    await page.locator('#catalog-search').fill('chocochip')
    assert.equal(await page.locator('article').count(), 1)
    const card = page.locator('article').first()
    assert.equal(await card.getByRole('link', { name: 'Lihat The OG Classic Chocochip NYC', exact: true }).getAttribute('href'), '/produk/classic-nyc')
    await card.getByRole('button', { name: 'Tambah ke keranjang The OG Classic Chocochip NYC', exact: true }).click()
    const cart = () => page.evaluate(() => JSON.parse(localStorage.getItem('happybite-cart-v1')))
    let saved = await cart()
    assert.equal(saved[0].id, uuid(2))
    assert.equal(saved[0].slug, 'classic-nyc')
    assert.equal(saved[0].price, 28000)
    // Database changes must not alter the saved cart's name/price snapshot.
    rows[1] = { ...rows[1], harga: 99000, nama: 'New database name' }
    const beforeCart = productRequests
    await goto('/keranjang')
    await page.getByRole('heading', { name: 'The OG Classic Chocochip NYC', exact: true }).waitFor()
    await page.getByRole('button', { name: 'Tambah The OG Classic Chocochip NYC', exact: true }).click()
    assert.equal(await page.getByLabel('Total sementara', { exact: true }).innerText(), 'Rp 56.000')
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.getByRole('heading', { name: 'The OG Classic Chocochip NYC', exact: true }).waitFor()
    assert.equal(productRequests, beforeCart)
    assert.equal((await cart())[0].quantity, 2)
    await page.getByRole('button', { name: /Lanjut ke Pembayaran/ }).click()
    const recipient = { name: 'Pembeli UUID', whatsapp: '081234567890', email: user.email, address: 'Jl. Mawar No 21', city: 'Jakarta Selatan - Kitchen Senopati', postalCode: '12730', notes: 'Snapshot test' }
    for (const [field, value] of Object.entries(recipient)) {
      const input = page.locator('#checkout-' + field)
      if (field === 'city') await input.selectOption(value); else await input.fill(value)
    }
    await page.getByRole('button', { name: 'Lanjut ke Pembayaran', exact: true }).click()
    await page.waitForURL('**/pembayaran')
    assert.equal(await page.getByLabel('Total tagihan', { exact: true }).innerText(), 'Rp 56.000')
    assert.equal(productRequests, beforeCart)
    await page.locator('input[type="file"]').setInputFiles({ name: 'proof.png', mimeType: 'image/png', buffer: Buffer.from('test') })
    await page.getByRole('button', { name: 'Konfirmasi Pembayaran Sekarang', exact: true }).click()
    await page.waitForURL('**/riwayat-pesanan')
    const order = await page.evaluate(() => JSON.parse(localStorage.getItem('happybite-orders-v1')).find(o => o.source === 'checkout'))
    assert.equal(order.items[0].productId, uuid(2))
    assert.equal(order.total, 56000)
    assert.equal(order.items[0].name, 'The OG Classic Chocochip NYC')
    assert.equal((await cart()).length, 0)
    console.log('PASS RLS guard, catalog queries/states/filter/search/load-more, UUID migration, snapshot cart/checkout/payment and existing order flow')

    await goto('/produk/red-velvet')
    await page.getByRole('heading', { name: 'Red Velvet Database', exact: true }).waitFor()
    assert.equal(await page.locator('section[aria-labelledby="pairing-title"] article').count(), 3)
    assert.equal(await page.locator('section[aria-labelledby="pairing-title"] article').first().getByRole('heading').innerText(), 'DB Cookie 4')
    assert.ok((await page.getByRole('link', { name: 'Katalog Menu', exact: true }).first().getAttribute('class')).includes('bg-blush'))
    await page.getByRole('button', { name: 'Lihat foto 2', exact: true }).click()
    await page.getByRole('button', { name: 'Tambah jumlah', exact: true }).click()
    await page.getByRole('button', { name: '+ Masukkan Keranjang', exact: true }).click()
    assert.equal((await cart())[0].id, uuid(1))
    assert.equal((await cart())[0].quantity, 2)
    await goto('/katalog/red-velvet')
    await page.getByRole('heading', { name: 'Red Velvet Database', exact: true }).waitFor()
    await goto('/produk/sold-out')
    await page.getByRole('heading', { name: 'DB Cookie 3', exact: true }).waitFor()
    assert.equal(await page.getByRole('button', { name: 'Stok Habis', exact: true }).first().isDisabled(), true)
    assert.equal(await page.getByRole('button', { name: 'Beli Langsung Sekarang', exact: true }).isDisabled(), true)
    await goto('/produk/chilled-cookie')
    await page.getByRole('heading', { name: 'DB Cookie 4', exact: true }).waitFor()
    assert.equal(await page.getByRole('button', { name: '+ Masukkan Keranjang', exact: true }).isEnabled(), true)
    await goto('/produk/bundle-box')
    await page.getByRole('heading', { name: 'DB Cookie 5', exact: true }).waitFor()
    await page.getByRole('radio', { name: 'Mix A', exact: true }).check()
    await page.getByRole('button', { name: '+ Masukkan Keranjang', exact: true }).click()
    await page.getByRole('radio', { name: 'Mix B', exact: true }).check()
    await page.getByRole('button', { name: '+ Masukkan Keranjang', exact: true }).click()
    saved = await cart()
    const bundles = saved.filter(p => p.id === uuid(5))
    assert.equal(bundles.length, 2)
    assert.notEqual(bundles[0].lineId, bundles[1].lineId)
    await goto('/keranjang')
    await page.getByRole('heading', { name: 'Keranjang Belanja Anda', exact: true }).waitFor()
    await page.getByRole('button', { name: 'Hapus DB Cookie 5 — Mix A', exact: true }).click()
    assert.deepEqual((await cart()).filter(p => p.id === uuid(5)).map(p => p.variant), ['Mix B'])
    await goto('/produk/coffee')
    await page.getByText('Freshly Brewed Today', { exact: true }).waitFor()
    await page.getByText('Sudah Termasuk Pajak & Botol Food-Grade', { exact: true }).waitFor()
    for (const slug of ['missing', 'hidden-cookie']) {
      await goto('/produk/' + slug)
      await page.getByRole('heading', { name: 'Produk tidak ditemukan', exact: true }).waitFor()
    }
    detailMode = 'error'
    await goto('/produk/red-velvet')
    await page.getByText('Gagal memuat produk. Coba lagi.', { exact: true }).waitFor()
    detailMode = 'ok'
    await page.getByRole('button', { name: 'Coba lagi', exact: true }).click()
    await page.getByRole('heading', { name: 'Red Velvet Database', exact: true }).waitFor()
    relatedFails = true
    await goto('/produk/red-velvet')
    await page.getByRole('heading', { name: 'Red Velvet Database', exact: true }).waitFor()
    await page.getByText('Gagal memuat produk. Coba lagi.', { exact: true }).waitFor()
    relatedFails = false
    await page.getByRole('button', { name: 'Coba lagi', exact: true }).click()
    await page.locator('section[aria-labelledby="pairing-title"] article').first().waitFor()
    catalogMode = 'empty'
    await goto('/katalog')
    await page.getByRole('heading', { name: 'Belum ada cookie yang cocok', exact: true }).waitFor()
    const categoryData = await page.evaluate(async () => (await import('/src/services/productService.js')).getCategories())
    assert.equal(categoryData.length, 6)
    assert.deepEqual(errors, [])
    console.log('PASS slug aliases, related priority/fill, stock/chilled exceptions, variants, drinks, missing products, retries, categories and empty state')
  } finally { await browser.close() }
})().catch(error => { console.error(error); process.exitCode = 1 })
