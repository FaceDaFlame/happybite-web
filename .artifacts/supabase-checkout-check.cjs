// Isolated browser/real Supabase SDK; every remote request is intercepted.
const { chromium } = require(process.env.TEMP + '/happybite-auth-check/node_modules/playwright')
const assert = require('node:assert/strict')
const base = 'http://127.0.0.1:5185'
const uuid = n => '30000000-0000-4000-8000-' + String(n).padStart(12, '0')
;(async () => {
  const { loadEnv } = await import('vite')
  const env = loadEnv('development', process.cwd(), 'VITE_')
  const origin = new URL(env.VITE_SUPABASE_URL).origin
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  try {
    const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1320, height: 1000 } })
    await context.addInitScript(() => {
      window.proofUrls = { created: [], revoked: [] }
      const create = URL.createObjectURL.bind(URL), revoke = URL.revokeObjectURL.bind(URL)
      URL.createObjectURL = blob => { const url = create(blob); window.proofUrls.created.push(url); return url }
      URL.revokeObjectURL = url => { window.proofUrls.revoked.push(url); revoke(url) }
    })
    const page = await context.newPage(); page.setDefaultTimeout(15000)
    const errors = []; page.on('pageerror', e => errors.push(e.message))
    const goto = path => page.goto(base + path, { waitUntil: 'domcontentloaded' })
    await context.route('**/*', route => [base, origin].includes(new URL(route.request().url()).origin) ? route.continue() : route.abort())
    const user = { id: uuid(999), aud: 'authenticated', role: 'authenticated', email: 'checkout@example.test', app_metadata: { provider: 'email' }, user_metadata: {}, identities: [{ id: uuid(999), provider: 'email' }] }
    const token = [Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url'), Buffer.from(JSON.stringify({ sub: user.id, email: user.email, role: 'authenticated', exp: Math.floor(Date.now()/1000)+3600 })).toString('base64url'), 'fixture'].join('.')
    let order = null, createMode = 'stock', orderReadFail = false, uploadFail = false, proofMode = 'ok', gate = null
    let createCalls = 0, uploadCalls = 0, proofCalls = 0, itemsFail = false
    let uploadPath, createPayload, proofPayload
    await context.route(origin + '/**', async route => {
      const request = route.request(), url = new URL(request.url()), params = url.searchParams
      const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'x-supabase-api-version': '2024-01-01' }, body: JSON.stringify(body) })
      if (url.pathname.endsWith('/token')) return json({ access_token: token, refresh_token: 'test-refresh', expires_in: 3600, token_type: 'bearer', user })
      if (url.pathname.endsWith('/profiles')) return json({ id: user.id, nama_lengkap: 'Pembeli RPC', role: 'pelanggan' })
      if (url.pathname.endsWith('/user')) return json(user)
      assert.equal(request.headers().authorization, 'Bearer ' + token)
      if (url.pathname.endsWith('/rpc/buat_pesanan')) {
        createCalls++
        createPayload = request.postDataJSON()
        assert.deepEqual(Object.keys(createPayload).sort(), ['p_items','p_nama_penerima','p_no_whatsapp','p_email','p_alamat','p_kota','p_kode_pos','p_catatan_kurir','p_metode_kirim','p_kartu_ucapan','p_ongkir'].sort())
        assert.deepEqual(createPayload.p_items, [{ product_id: uuid(1), jumlah: 2 }])
        assert.equal(createPayload.p_ongkir, 0)
        if (createMode === 'stock') return json({ code: 'P0001', message: 'Stok Cookie RPC tidak cukup' }, 400)
        if (createMode === 'error') return json({ message: 'Internal failure' }, 500)
        if (gate) await gate
        order = { id: uuid(200), no_pesanan: 'HB-DB-00200', user_id: user.id, subtotal: 58000, ongkir: 0, total: 58000, nama_penerima: createPayload.p_nama_penerima, no_whatsapp: createPayload.p_no_whatsapp, email: createPayload.p_email, alamat: createPayload.p_alamat, kota: createPayload.p_kota, kode_pos: createPayload.p_kode_pos, catatan_kurir: createPayload.p_catatan_kurir, metode_kirim: createPayload.p_metode_kirim, kartu_ucapan: createPayload.p_kartu_ucapan, status_pesanan: 'menunggu_pembayaran', batas_bayar: new Date(Date.now()+120000).toISOString(), created_at: new Date().toISOString() }
        return json([order])
      }
      if (url.pathname.endsWith('/order_items')) {
        if (itemsFail) return json({ message: 'Unknown snapshot column' }, 400)
        assert.equal(params.get('order_id'), 'eq.' + order.id)
        return json([{ id: uuid(500), jumlah: 2, harga_satuan: 29000, nama_produk: 'Cookie RPC', products: { nama: 'Cookie RPC', gambar_url: '/images/classic-chocochip.jpg' } }])
      }
      if (url.pathname.endsWith('/orders')) {
        assert.equal(request.method(), 'GET'); assert.equal(params.get('select'), '*')
        if (orderReadFail) return json({ message: 'Read failed' }, 500)
        return json(order && params.get('id') === 'eq.' + order.id ? [order] : [])
      }
      if (url.pathname.includes('/storage/v1/object/payment-proofs/')) {
        uploadCalls++
        uploadPath = decodeURIComponent(url.pathname.split('/payment-proofs/')[1])
        assert.match(uploadPath, new RegExp('^' + user.id + '/' + order.id + '/[0-9]+-[a-z0-9-]+\\.(jpg|png|webp)$'))
        assert.equal(request.method(), 'POST')
        assert.equal(request.headers()['x-upsert'], 'false')
        if (uploadFail) return json({ statusCode: '500', message: 'Upload failed', error: 'Upload failed' }, 500)
        return json({ Key: 'payment-proofs/' + uploadPath, Id: uuid(300) })
      }
      if (url.pathname.endsWith('/rpc/kirim_bukti_bayar')) {
        proofCalls++; proofPayload = request.postDataJSON()
        assert.deepEqual(Object.keys(proofPayload).sort(), ['p_order_id','p_path','p_nama_pengirim'].sort())
        assert.equal(proofPayload.p_order_id, order.id); assert.equal(proofPayload.p_path, uploadPath)
        if (gate) await gate
        if (proofMode === 'error') return json({ message: 'Temporary failure' }, 500)
        if (proofMode === 'expired') return json({ message: 'Batas waktu pembayaran sudah lewat.' }, 400)
        order.status_pesanan = 'menunggu_konfirmasi'
        return json(null)
      }
      throw Error('Unexpected request ' + request.method() + ' ' + url.pathname)
    })
    await goto('/pembayaran/' + uuid(200)); await page.waitForURL('**/login')
    await page.locator('#login-email').fill(user.email); await page.locator('#login-password').fill('password123')
    await page.getByRole('button', { name: 'Masuk ke Akun HappyBite', exact: true }).click(); await page.waitForURL(base + '/')
    await page.evaluate(({ id1, id2 }) => {
      const product = { id: id1, slug: 'cookie-rpc', name: 'Cookie RPC', price: 999999, image: '/images/classic-chocochip.jpg', quantity: 2, selected: true, variant: '' }
      localStorage.setItem('happybite-cart-v1', JSON.stringify([product, { ...product, id: id2, name: 'Unchecked', selected: false }]))
      localStorage.setItem('happybite-orders-v1', '[]')
      sessionStorage.setItem('happybite-shop-v1', JSON.stringify({ gift: { enabled: true, message: 'Selamat ulang tahun!' }, checkout: {} }))
    }, { id1: uuid(1), id2: uuid(2) })
    await goto('/checkout')
    const pay = () => page.getByRole('button', { name: 'Lanjut ke Pembayaran', exact: true })
    await pay().click(); await page.getByText('Masukkan nama lengkap penerima.', { exact: true }).waitFor(); assert.equal(createCalls, 0)
    for (const [name, value] of Object.entries({ name: 'Penerima RPC', whatsapp: '081234567890', email: 'penerima@example.test', address: 'Jalan RPC 42', city: 'Jakarta Selatan - Kitchen Senopati', postalCode: '12730', notes: 'Titip satpam' })) {
      if (name === 'city') await page.locator('#checkout-' + name).selectOption(value)
      else await page.locator('#checkout-' + name).fill(value)
    }
    await pay().click(); await page.getByText('Stok Cookie RPC tidak cukup', { exact: true }).waitFor()
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('happybite-cart-v1')).length), 2)
    createMode = 'error'; await pay().click(); await page.getByText('Terjadi kesalahan, coba lagi.', { exact: true }).waitFor()
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('happybite-cart-v1')).length), 2)
    createMode = 'ok'; let release; gate = new Promise(resolve => { release=resolve })
    await pay().click(); await page.getByRole('button', { name: 'Memproses...', exact: true }).waitFor()
    assert.equal(await page.getByRole('button', { name: 'Memproses...', exact: true }).isDisabled(), true)
    assert.equal(await page.locator('#checkout-name').isDisabled(), true)
    assert.equal(createCalls, 3)
    release(); gate=null
    await page.waitForURL(base + '/pembayaran/' + uuid(200))
    await page.getByText('HB-DB-00200', { exact: true }).waitFor()
    assert.equal(await page.getByLabel('Total tagihan', { exact: true }).innerText(), 'Rp 58.000')
    assert.equal(await page.locator('#payment-sender').inputValue(), 'Penerima RPC')
    await page.getByRole('heading', { name: 'Cookie RPC', exact: true }).waitFor()
    await page.getByText('2 Pcs Cookies', { exact: true }).waitFor()
    assert.equal(createPayload.p_alamat, 'Jalan RPC 42'); assert.equal(createPayload.p_kartu_ucapan, 'Selamat ulang tahun!')
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('happybite-cart-v1'))), [])
    assert.equal(await page.evaluate(() => localStorage.getItem('happybite-orders-v1')), '[]')
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.getByText('HB-DB-00200', { exact: true }).waitFor()
    assert.equal(await page.getByLabel('Total tagihan', { exact: true }).innerText(), 'Rp 58.000')
    const firstTimer = await page.getByLabel('Sisa waktu pembayaran', { exact: true }).innerText()
    await page.waitForFunction(t => document.querySelector('[aria-label="Sisa waktu pembayaran"]').textContent !== t, firstTimer)
    assert.ok(!firstTimer.startsWith('15:'), 'Uses the two-minute database deadline')
    const input = () => page.getByLabel('Pilih bukti pembayaran', { exact: true })
    await input().setInputFiles({ name: 'proof.pdf', mimeType: 'application/pdf', buffer: Buffer.from('pdf') })
    await page.getByText('Format file harus JPG, PNG, atau WEBP.', { exact: true }).waitFor()
    await input().setInputFiles({ name: 'proof.png', mimeType: 'image/png', buffer: Buffer.alloc(2*1024*1024+1) })
    await page.getByText('Ukuran file maksimal 2 MB.', { exact: true }).waitFor()
    const image = { name: 'Bukti Transfer Caf\u00e9!.JPG', mimeType: 'image/jpeg', buffer: Buffer.from('proof-fixture') }
    await input().setInputFiles(image)
    assert.match(await page.getByAltText('Preview bukti pembayaran').getAttribute('src'), /^blob:/)
    await page.getByRole('button', { name: 'Hapus bukti pembayaran', exact: true }).click()
    assert.equal(await page.evaluate(() => window.proofUrls.revoked.length), 1)
    await input().setInputFiles(image)
    await page.locator('#payment-sender').fill('Pengirim Berbeda')
    const confirm = () => page.getByRole('button', { name: 'Konfirmasi Pembayaran Sekarang', exact: true })
    uploadFail = true; await confirm().click(); await page.getByText('Terjadi kesalahan, coba lagi.', { exact: true }).waitFor()
    assert.equal(proofCalls, 0)
    uploadFail = false; proofMode = 'error'; await confirm().click()
    await page.getByText('Terjadi kesalahan, coba lagi.', { exact: true }).waitFor()
    assert.equal(proofCalls, 1); assert.equal(uploadCalls, 2)
    assert.ok(uploadPath.endsWith('-bukti-transfer-cafe.jpg'))
    proofMode = 'ok'; gate=new Promise(resolve => { release=resolve })
    await confirm().click(); await page.getByRole('button', { name: 'Memproses...', exact: true }).waitFor()
    assert.equal(await input().isDisabled(), true); assert.equal(await page.locator('#payment-sender').isDisabled(), true)
    release(); gate=null
    await page.getByText('Bukti pembayaran sudah dikirim. Menunggu verifikasi admin.', { exact: true }).waitFor()
    assert.equal(uploadCalls, 2, 'RPC retry reuses the uploaded private path')
    assert.equal(proofPayload.p_nama_pengirim, 'Pengirim Berbeda')
    assert.equal(await input().count(), 0)
    assert.equal(await page.evaluate(() => window.proofUrls.created.length), await page.evaluate(() => window.proofUrls.revoked.length))
    assert.equal(await page.evaluate(() => localStorage.getItem('happybite-orders-v1')), '[]')
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.getByText('Bukti pembayaran sudah dikirim. Menunggu verifikasi admin.', { exact: true }).waitFor()
    order.status_pesanan='menunggu_pembayaran'; order.batas_bayar=new Date(Date.now()-1000).toISOString()
    await page.reload({ waitUntil: 'domcontentloaded' }); await page.getByText('Waktu pembayaran habis.', { exact: false }).waitFor()
    assert.equal(await input().count(), 0)
    order.batas_bayar=new Date(Date.now()+120000).toISOString(); proofMode='expired'
    await page.reload({ waitUntil: 'domcontentloaded' }); await input().setInputFiles({ ...image, name: 'proof.webp', mimeType: 'image/webp' })
    await confirm().click(); await page.getByText('Batas waktu pembayaran sudah lewat.', { exact: true }).waitFor(); assert.equal(await input().count(), 0)
    await goto('/pembayaran/' + uuid(888)); await page.getByRole('heading', { name: 'Pesanan tidak ditemukan', exact: true }).waitFor()
    await goto('/pembayaran/not-a-uuid'); await page.getByRole('heading', { name: 'Pesanan tidak ditemukan', exact: true }).waitFor()
    orderReadFail=true; await goto('/pembayaran/' + order.id); await page.getByText('Gagal memuat pesanan. Coba lagi.', { exact: true }).waitFor()
    orderReadFail=false; await page.getByRole('button', { name: 'Coba lagi', exact: true }).click(); await page.getByText('HB-DB-00200', { exact: true }).waitFor()
    itemsFail = true; await page.reload({ waitUntil: 'domcontentloaded' })
    await page.getByText('Rincian menu belum dapat dimuat.', { exact: true }).waitFor()
    assert.equal(await page.getByLabel('Total tagihan', { exact: true }).innerText(), 'Rp 58.000')
    itemsFail = false; await page.getByRole('button', { name: 'Coba lagi', exact: true }).click()
    await page.getByRole('heading', { name: 'Cookie RPC', exact: true }).waitFor()
    await page.setViewportSize({ width: 390, height: 844 }); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    assert.deepEqual(errors, [])
    console.log('PASS RPC-only checkout payload/no prices, validation/errors/cart integrity, server totals/deadline/refresh, private uploads/type-size/preview cleanup, retry without reupload, submitted/expired/missing/error states, no local order writes, responsive layout')
  } finally { await browser.close() }
})().catch(error => { console.error(error); process.exitCode=1 })
