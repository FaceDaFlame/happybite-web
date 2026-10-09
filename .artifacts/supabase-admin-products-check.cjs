// Browser integration with isolated, intercepted Supabase responses. No remote writes.
const { chromium } = require(process.env.TEMP + '/happybite-auth-check/node_modules/playwright')
const assert = require('node:assert/strict')
const base = 'http://127.0.0.1:5185'
const uuid = n => '20000000-0000-4000-8000-' + String(n).padStart(12, '0')
const categories = [
  { id: uuid(100), nama: 'Signature NYC', slug: 'signature' },
  { id: uuid(101), nama: 'Hampers & Gift Box', slug: 'bundles' },
  { id: uuid(102), nama: 'Stuffed Lava', slug: 'stuffed' },
]
const make = (n, extra = {}) => ({
  id: uuid(n), slug: 'cookie-' + n, sku: 'HB-' + n, nama: 'Cookie DB ' + n,
  category_id: categories[0].id, harga: 28000, deskripsi_singkat: 'Singkat DB', deskripsi: 'Panjang DB',
  badge: 'Best Seller', satuan: '/ pcs (110gr)', rating: 4.8, jumlah_ulasan: 12, stok_siap_jual: 22,
  adonan_dingin: 40, lokasi_adonan: 'Chiller B', suhu_oven: '175?C', durasi_panggang: '12 Menit',
  varian: [], galeri: ['/images/red-velvet.jpg'], gambar_url: '/images/classic-chocochip.jpg',
  is_live: true, is_catalog_visible: true, ...extra,
})
let rows = [make(1), make(2, { slug: 'cookie-baru', is_live: false }), make(3, { slug: 'cookie-baru-2', is_catalog_visible: false })]
;(async () => {
  const { loadEnv } = await import('vite')
  const env = loadEnv('development', process.cwd(), 'VITE_')
  const origin = new URL(env.VITE_SUPABASE_URL).origin
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  try {
    const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1500, height: 1000 } })
    const page = await context.newPage()
    page.setDefaultTimeout(10000)
    const errors = []; page.on('pageerror', e => errors.push(e.message))
    const goto = path => page.goto(base + path, { waitUntil: 'domcontentloaded' })
    await context.route('**/*', route => [base, origin].includes(new URL(route.request().url()).origin) ? route.continue() : route.abort())
    const user = { id: uuid(999), aud: 'authenticated', role: 'authenticated', email: 'admin@example.test', app_metadata: { provider: 'email' }, user_metadata: {}, identities: [{ id: uuid(999), provider: 'email' }] }
    const token = [Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url'), Buffer.from(JSON.stringify({ sub: user.id, email: user.email, role: 'authenticated', exp: Math.floor(Date.now()/1000)+3600 })).toString('base64url'), 'fixture'].join('.')
    let listFail = true, patchFail = false, deleteFail = false, race = true, gate = null, sequence = 10
    const writes = []
    await context.route(origin + '/**', async route => {
      const request = route.request(), url = new URL(request.url()), params = url.searchParams
      const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'x-supabase-api-version': '2024-01-01' }, body: JSON.stringify(body) })
      if (url.pathname.endsWith('/token')) return json({ access_token: token, refresh_token: 'test-refresh', expires_in: 3600, token_type: 'bearer', user })
      if (url.pathname.endsWith('/profiles')) return json({ id: user.id, nama_lengkap: 'Admin Database', role: 'admin' })
      if (url.pathname.endsWith('/user')) return json(user)
      if (url.pathname.endsWith('/categories')) return json(categories)
      if (!url.pathname.endsWith('/products')) throw Error('Unexpected request ' + url.pathname)
      assert.equal(request.headers().authorization, 'Bearer ' + token)
      const joined = row => ({ ...row, categories: categories.find(c => c.id === row.category_id) })
      if (request.method() === 'GET') {
        if (params.has('order') && !params.has('is_live') && listFail) return json({ message: 'List failed' }, 500)
        let result = rows.slice()
        if (params.get('slug')?.startsWith('like.')) result = result.filter(p => p.slug.startsWith(params.get('slug').slice(5, -1)))
        else if (params.has('slug')) result = result.filter(p => 'eq.' + p.slug === params.get('slug'))
        if (params.has('is_live')) result = result.filter(p => p.is_live)
        if (params.has('is_catalog_visible')) result = result.filter(p => p.is_catalog_visible)
        if (params.get('select') === 'slug') return json(result.map(p => ({ slug: p.slug })))
        if (params.get('select') === 'id') return json(result.map(p => ({ id: p.id })))
        return json(result.map(joined))
      }
      if (gate) await gate
      if (request.method() === 'DELETE') {
        if (deleteFail) return json({ message: 'Produk masih digunakan pesanan.', code: '23503' }, 409)
        const id = params.get('id').slice(3)
        rows = rows.filter(row => row.id !== id)
        writes.push({ method: 'DELETE', id })
        return json({ id })
      }
      const payload = request.postDataJSON()
      assert.ok(!('rating' in payload) && !('jumlah_ulasan' in payload), 'Review fields must never be written')
      if (request.method() === 'PATCH') {
        assert.ok(!('slug' in payload), 'Editing cannot change slug')
        if (patchFail) return json({ message: 'Denied', code: '42501' }, 403)
        const id = params.get('id').slice(3)
        rows = rows.map(p => p.id === id ? { ...p, ...payload } : p)
        writes.push({ method: 'PATCH', payload })
        return json(joined(rows.find(p => p.id === id)))
      }
      assert.equal(request.method(), 'POST')
      if (race && payload.slug === 'cookie-baru-3') {
        race = false
        rows.push(make(sequence++, { slug: payload.slug, nama: 'Concurrent insert' }))
        return json({ code: '23505', message: 'duplicate slug' }, 409)
      }
      if (rows.some(p => p.slug === payload.slug)) return json({ code: '23505', message: 'duplicate slug' }, 409)
      const row = make(sequence++, { ...payload, rating: 0, jumlah_ulasan: 0 })
      rows.push(row)
      writes.push({ method: 'POST', payload })
      return json(joined(row), 201)
    })
    await goto('/admin/produk')
    await page.waitForURL('**/admin/login')
    await page.evaluate(() => localStorage.setItem('happybite-products-v1', JSON.stringify([{ name: 'Wrong seed data' }])))
    await page.getByLabel('Email Admin', { exact: true }).fill(user.email)
    await page.getByLabel('Kata Sandi', { exact: true }).fill('testpassword')
    await page.getByRole('button', { name: 'Masuk Admin', exact: true }).click()
    await page.waitForURL(base + '/admin')
    await goto('/admin/produk')
    await page.getByText('Gagal memuat produk. Coba lagi.', { exact: true }).waitFor()
    assert.equal(await page.evaluate(() => localStorage.getItem('happybite-products-v1')), null)
    listFail = false
    await page.getByRole('button', { name: 'Coba lagi', exact: true }).click()
    await page.getByRole('button', { name: 'Edit Cookie DB 1', exact: true }).waitFor()
    assert.equal(await page.locator('tbody tr').count(), 3, 'Admin sees draft and hidden products')
    await page.getByRole('button', { name: 'Edit Cookie DB 1', exact: true }).click()
    const panel = page.locator('[data-product-editor]')
    const field = name => panel.getByLabel(name, { exact: true })
    assert.equal(await field('Kategori Menu').inputValue(), categories[0].id)
    assert.equal(await field('Lokasi Adonan Dingin').inputValue(), 'Chiller B')
    assert.equal(await field('Deskripsi Singkat').inputValue(), 'Singkat DB')
    assert.equal(await panel.locator('#product-variants').count(), 0)
    assert.equal(await panel.locator('input[name="rating"],input[name="reviewCount"]').count(), 0)
    await field('Nama Varian Cookie').fill('Cookie Renamed')
    await field('Harga Satuan (IDR)').fill('45000')
    await field('SKU').fill('HB-EDIT')
    await field('Kategori Menu').selectOption(categories[1].id)
    await field('Varian (pisahkan dengan koma)').fill('Mix A, Mix B, Mix A')
    await field('Badge').fill('Gift Ready')
    await field('Satuan').fill('/ box (4 pcs)')
    await field('Deskripsi Singkat').fill('Ringkas baru')
    await field('Deskripsi Produk (Website & Menu QR)').fill('Deskripsi lengkap baru')
    await field('Stok Display Etalase').fill('19')
    await field('Adonan Dingin (Chiller)').fill('60')
    await field('Lokasi Adonan Dingin').fill('3 Loyang Chiller A')
    await field('Suhu Oven Ideal').fill('180?C')
    await field('Durasi Pemanggangan').fill('15 Menit')
    patchFail = true
    await panel.getByRole('button', { name: 'Simpan Perubahan', exact: true }).click()
    await panel.getByRole('alert').filter({ hasText: 'Akses ditolak' }).waitFor()
    assert.equal(rows[0].nama, 'Cookie DB 1')
    assert.equal(await field('Nama Varian Cookie').inputValue(), 'Cookie Renamed')
    patchFail = false
    let release; gate = new Promise(resolve => { release = resolve })
    await panel.getByRole('button', { name: 'Simpan Perubahan', exact: true }).click()
    await panel.getByRole('button', { name: 'Menyimpan...', exact: true }).waitFor()
    assert.equal(await field('Nama Varian Cookie').isDisabled(), true)
    assert.equal(await panel.getByRole('button', { name: 'Batal', exact: true }).isDisabled(), true)
    release(); gate = null
    await panel.waitFor({ state: 'hidden' })
    await page.getByRole('button', { name: 'Edit Cookie Renamed', exact: true }).waitFor()
    assert.equal(rows[0].slug, 'cookie-1')
    assert.equal(rows[0].sku, 'HB-EDIT')
    assert.equal(rows[0].category_id, categories[1].id)
    assert.deepEqual(rows[0].varian, ['Mix A','Mix B'])
    assert.equal(rows[0].rating, 4.8); assert.equal(rows[0].jumlah_ulasan, 12)
    assert.equal(rows[0].harga, 45000); assert.equal(rows[0].stok_siap_jual, 19)
    assert.equal(rows[0].adonan_dingin, 60); assert.equal(rows[0].lokasi_adonan, '3 Loyang Chiller A')
    assert.equal(rows[0].suhu_oven, '180?C'); assert.equal(rows[0].durasi_panggang, '15 Menit')
    assert.equal(rows[0].deskripsi_singkat, 'Ringkas baru'); assert.equal(rows[0].deskripsi, 'Deskripsi lengkap baru')
    assert.equal(rows[0].badge, 'Gift Ready'); assert.equal(rows[0].satuan, '/ box (4 pcs)')
    assert.deepEqual(rows[0].galeri, ['/images/red-velvet.jpg'])
    await goto('/katalog')
    await page.getByRole('link', { name: 'Cookie Renamed', exact: true }).waitFor()
    await goto('/admin/produk')
    await page.getByRole('button', { name: 'Tambah Produk Baru', exact: true }).click()
    await panel.getByRole('button', { name: 'Tambah Produk', exact: true }).click()
    await panel.getByText('Nama varian cookie wajib diisi.', { exact: true }).waitFor()
    await field('Nama Varian Cookie').fill('Cookie Baru!')
    await field('Harga Satuan (IDR)').fill('32000')
    await field('Kategori Menu').selectOption(categories[1].id)
    await field('Varian (pisahkan dengan koma)').fill('Vanilla, Choco,')
    await field('Kategori Menu').selectOption(categories[0].id)
    assert.equal(await panel.locator('#product-variants').count(), 0)
    await panel.getByRole('switch', { name: 'Tampilkan di Katalog', exact: true }).click()
    await panel.getByRole('button', { name: 'Tambah Produk', exact: true }).click()
    await panel.waitFor({ state: 'hidden' })
    await page.getByRole('button', { name: 'Edit Cookie Baru!', exact: true }).waitFor()
    const created = rows.find(p => p.nama === 'Cookie Baru!')
    assert.equal(created.slug, 'cookie-baru-4', 'Collision suffixes and concurrent conflict handled')
    assert.deepEqual(created.varian, []); assert.equal(created.is_catalog_visible, false)
    assert.ok(created.sku.startsWith('HB-'))
    await page.getByRole('button', { name: 'Aksi Cookie Baru!', exact: true }).click()
    await page.getByRole('button', { name: 'Duplikat', exact: true }).click()
    await page.getByRole('button', { name: 'Edit Cookie Baru! (Salinan)', exact: true }).waitFor()
    const duplicate = rows.find(p => p.nama === 'Cookie Baru! (Salinan)')
    assert.equal(duplicate.is_live, false); assert.notEqual(duplicate.sku, created.sku)
    await page.getByRole('button', { name: 'Aksi Cookie Baru! (Salinan)', exact: true }).click()
    await page.getByRole('button', { name: 'Hapus', exact: true }).click()
    deleteFail = true
    await page.getByRole('button', { name: 'Hapus Produk', exact: true }).click()
    await page.getByText('Produk masih digunakan pesanan.', { exact: true }).waitFor()
    assert.ok(rows.some(p => p.id === duplicate.id))
    deleteFail = false
    await page.getByRole('button', { name: 'Hapus Produk', exact: true }).click()
    await page.getByText('Produk dihapus.', { exact: true }).waitFor()
    assert.ok(!rows.some(p => p.id === duplicate.id))
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: 'Edit Cookie Renamed', exact: true }).waitFor()
    assert.equal(await page.evaluate(() => localStorage.getItem('happybite-products-v1')), null)
    await page.getByRole('button', { name: 'Edit Cookie Renamed', exact: true }).click()
    await page.setViewportSize({ width: 900, height: 1000 })
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    await panel.getByRole('button', { name: 'Batal', exact: true }).click()
    assert.deepEqual(errors, [])
    assert.ok(writes.some(w => w.method === 'POST') && writes.some(w => w.method === 'PATCH') && writes.some(w => w.method === 'DELETE'))
    console.log('PASS admin DB-only reads, retry, field mappings, categories/chips, immutable slug/reviews, async errors, slug collisions/race, create/edit/duplicate/delete, storefront update, refresh/no local product persistence, tablet layout')
  } finally { await browser.close() }
})().catch(error => { console.error(error); process.exitCode = 1 })
