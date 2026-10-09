// Isolated browser + real SDK with intercepted DB/storage responses. No remote writes.
const {chromium}=require(process.env.TEMP+'/happybite-auth-check/node_modules/playwright')
const assert=require('node:assert/strict')
const base='http://127.0.0.1:5185'
const uuid=n=>'40000000-0000-4000-8000-'+String(n).padStart(12,'0')
const states=['menunggu_pembayaran','menunggu_konfirmasi','diproses','qc_packing','dikirim','selesai','dibatalkan']
let rows=states.map((status,i)=>({id:uuid(i+1),no_pesanan:'HB-DB-'+(i+1),user_id:uuid(300),subtotal:64000,ongkir:10000,total:74000,nama_penerima:'Pelanggan '+(i+1),no_whatsapp:'081234567890',email:'buyer@example.test',alamat:'Jalan Pesanan 42',kota:'Jakarta Selatan',kode_pos:'12730',catatan_kurir:'Titip satpam',metode_kirim:i%2?'GoSend':'Shopee Express',kartu_ucapan:'Selamat ulang tahun',status_pesanan:status,created_at:new Date(Date.now()-i*60000).toISOString(),order_items:[{order_id:uuid(i+1),product_id:uuid(200),nama_produk:'Cookie Database',harga_satuan:32000,jumlah:2,suhu_penyajian:'Hangat'}],payments:i===0?[]:[{order_id:uuid(i+1),nominal:74000,bukti_url:uuid(300)+'/'+uuid(i+1)+'/old.png',nama_pengirim:'Pengirim Lama',status:'ditolak',uploaded_at:new Date(Date.now()-60000).toISOString(),verified_at:null},{order_id:uuid(i+1),nominal:74000,bukti_url:uuid(300)+'/'+uuid(i+1)+'/latest.png',nama_pengirim:'Pengirim Terbaru',status:i===1?'menunggu_verifikasi':'lunas',uploaded_at:new Date().toISOString(),verified_at:null}]}))
;(async()=>{
 const {loadEnv}=await import('vite');const env=loadEnv('development',process.cwd(),'VITE_');const origin=new URL(env.VITE_SUPABASE_URL).origin
 const browser=await chromium.launch({channel:'msedge',headless:true})
 try{
 const context=await browser.newContext({reducedMotion:'reduce',viewport:{width:1500,height:1100}});const page=await context.newPage();page.setDefaultTimeout(12000)
 const errors=[];page.on('pageerror',e=>errors.push(e.message));const goto=p=>page.goto(base+p,{waitUntil:'domcontentloaded'})
 await context.route('**/*',r=>[base,origin].includes(new URL(r.request().url()).origin)?r.continue():r.abort())
 const user={id:uuid(999),aud:'authenticated',role:'authenticated',email:'admin@example.test',app_metadata:{provider:'email'},user_metadata:{},identities:[{id:uuid(999),provider:'email'}]}
 const token=[Buffer.from(JSON.stringify({alg:'HS256'})).toString('base64url'),Buffer.from(JSON.stringify({sub:user.id,email:user.email,role:'authenticated',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),'fixture'].join('.')
 let listFail=true,proofFail=true,actionFail='',gate=null,gets=0,signs=0;const actions=[]
 await context.route(origin+'/**',async r=>{
  const req=r.request(),url=new URL(req.url()),params=url.searchParams
  const json=(body,status=200)=>r.fulfill({status,contentType:'application/json',headers:{'access-control-allow-origin':'*','x-supabase-api-version':'2024-01-01'},body:JSON.stringify(body)})
  if(url.pathname.endsWith('/token'))return json({access_token:token,refresh_token:'test',expires_in:3600,token_type:'bearer',user})
  if(url.pathname.endsWith('/profiles'))return json({id:user.id,nama_lengkap:'Admin DB',role:'admin'})
  if(url.pathname.endsWith('/user'))return json(user)
  if(url.pathname.includes('/storage/v1/object/sign/')&&req.method()==='GET')return r.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jC3cAAAAASUVORK5CYII=','base64')})
  assert.equal(req.headers().authorization,'Bearer '+token)
  if(url.pathname.endsWith('/products')||url.pathname.endsWith('/categories'))return json([])
  if(url.pathname.endsWith('/orders')){
   gets++;assert.equal(params.get('select'),'*,order_items(*),payments(*)');assert.equal(params.get('order'),'created_at.desc');assert.equal(params.get('limit'),'200');assert.equal(req.method(),'GET')
   return listFail?json({message:'List failed'},500):json(rows)
  }
  if(url.pathname.includes('/storage/v1/object/sign/payment-proofs/')){
   signs++;assert.equal(req.method(),'POST');assert.deepEqual(req.postDataJSON(),{expiresIn:300});assert.ok(url.pathname.endsWith('/latest.png'))
   return proofFail?json({message:'Signed URL failed'},500):json({signedURL:url.pathname.replace('/storage/v1','')+'?token=fixture'})
  }
  if(url.pathname.includes('/rpc/')){
   const body=req.postDataJSON(),name=url.pathname.split('/').at(-1);actions.push({name,body})
   if(gate)await gate
   if(actionFail)return json({message:actionFail},400)
   const order=rows.find(o=>o.id===body.p_order_id);assert.ok(order)
   if(name==='verifikasi_pembayaran'){
    assert.deepEqual(Object.keys(body).sort(),['p_order_id','p_setuju']);order.status_pesanan=body.p_setuju?'diproses':'menunggu_pembayaran';order.payments.at(-1).status=body.p_setuju?'lunas':'ditolak'
   }else if(name==='ubah_status_pesanan'){
    assert.ok(['qc_packing','dikirim'].includes(body.p_status));assert.equal(body.p_status,order.status_pesanan==='diproses'?'qc_packing':'dikirim');order.status_pesanan=body.p_status
   }else if(name==='batalkan_pesanan')order.status_pesanan='dibatalkan'
   else throw Error('Unexpected RPC '+name)
   return json(null)
  }
  throw Error('Unexpected request '+url.pathname)
 })
 await goto('/admin/pesanan');await page.waitForURL('**/admin/login')
 await page.locator('#admin-email').fill(user.email);await page.locator('#admin-password').fill('password123');await page.getByRole('button',{name:'Masuk Admin',exact:true}).click();await page.waitForURL(base+'/admin')
 await page.evaluate(()=>localStorage.setItem('happybite-orders-v1','[]'))
 await goto('/admin/pesanan');await page.getByText('Gagal memuat pesanan. Coba lagi.',{exact:true}).waitFor();assert.equal(await page.locator('tbody tr').count(),0)
 listFail=false;await page.getByRole('button',{name:'Coba lagi',exact:true}).click();await page.getByRole('button',{name:'Semua Pesanan (7)',exact:true}).waitFor();assert.equal(await page.locator('tbody tr').count(),5)
 await page.getByRole('button',{name:'Halaman berikutnya',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('tbody tr').length===2)
 const search=page.getByLabel('Cari nomor pesanan atau pelanggan',{exact:true})
 await search.fill('Pelanggan 2');await page.waitForFunction(()=>document.querySelectorAll('tbody tr').length===1)
 await page.getByRole('radio',{name:'Pilih pesanan HB-DB-2',exact:true}).check()
 const panel=page.getByRole('complementary',{name:'HB-DB-2',exact:true})
 await panel.getByText('Gagal memuat bukti pembayaran. Coba lagi.',{exact:true}).waitFor()
 proofFail=false;await panel.getByRole('button',{name:'Muat Ulang Bukti',exact:true}).click();await panel.getByRole('button',{name:'Perbesar bukti pembayaran',exact:true}).waitFor()
 await panel.getByRole('button',{name:'Perbesar bukti pembayaran',exact:true}).click();await page.getByRole('dialog',{name:'Bukti pembayaran diperbesar',exact:true}).waitFor();await page.keyboard.press('Escape')
 await panel.getByText('Pengirim Terbaru',{exact:true}).waitFor();assert.equal(await panel.getByText('Pengirim Lama',{exact:true}).count(),0)
 await panel.getByText('Jalan Pesanan 42, Jakarta Selatan, 12730',{exact:true}).waitFor();await panel.getByText('Titip satpam',{exact:true}).waitFor();await panel.getByText('Selamat ulang tahun',{exact:true}).waitFor();await panel.getByText('Metode Kirim: GoSend',{exact:true}).waitFor()
 await panel.getByText('Rp 10.000',{exact:true}).waitFor()
 actionFail='status transition denied';const before=gets
 await panel.getByRole('button',{name:'Verifikasi Pembayaran',exact:true}).click();await page.getByText('Perubahan status tidak diizinkan.',{exact:true}).waitFor();await panel.getByRole('button',{name:'Verifikasi Pembayaran',exact:true}).waitFor();assert.ok(gets>before)
 actionFail='';let release;gate=new Promise(resolve=>{release=resolve})
 await panel.getByRole('button',{name:'Verifikasi Pembayaran',exact:true}).click();await panel.getByRole('button',{name:'Memproses...',exact:true}).waitFor();assert.equal(await panel.getByRole('button',{name:'Tolak Bukti',exact:true}).isDisabled(),true);assert.equal(await page.getByRole('button',{name:'Muat Ulang',exact:true}).isDisabled(),true)
 release();gate=null;await page.getByText('Pembayaran berhasil diverifikasi.',{exact:true}).waitFor();await panel.getByRole('button',{name:'Lanjut ke QC & Packing',exact:true}).waitFor()
 await panel.getByRole('button',{name:'Lanjut ke QC & Packing',exact:true}).click();await panel.getByRole('button',{name:'Tandai Dikirim',exact:true}).waitFor();await panel.getByRole('button',{name:'Tandai Dikirim',exact:true}).click();await page.getByText('Pesanan ditandai dikirim.',{exact:true}).waitFor();await panel.getByText('Sedang Dikirim',{exact:true}).waitFor()
 assert.equal(await panel.getByRole('button',{name:/Batalkan|Selesai|QC|Dikirim|Verifikasi Pembayaran|Tolak Bukti/}).count(),0)
 await search.fill('HB-DB-1');await page.getByRole('radio',{name:'Pilih pesanan HB-DB-1',exact:true}).check();const unpaid=page.getByRole('complementary',{name:'HB-DB-1',exact:true});await unpaid.getByText('Belum ada bukti pembayaran.',{exact:true}).waitFor()
 const beforeCancel=actions.length;page.once('dialog',d=>d.dismiss());await unpaid.getByRole('button',{name:'Batalkan Pesanan',exact:true}).click();assert.equal(actions.length,beforeCancel)
 page.once('dialog',async d=>{assert.match(d.message(),/Stok produk akan dikembalikan/);await d.accept()});await unpaid.getByRole('button',{name:'Batalkan Pesanan',exact:true}).click();await page.getByText('Pesanan dibatalkan. Stok dikembalikan.',{exact:true}).waitFor();await unpaid.getByText('Dibatalkan',{exact:true}).waitFor()
 rows[2].status_pesanan='menunggu_konfirmasi';rows[2].payments.at(-1).status='menunggu_verifikasi';await page.getByRole('button',{name:'Muat Ulang',exact:true}).click();await page.getByRole('button',{name:'Menunggu Konfirmasi (1)',exact:true}).waitFor();await search.fill('');await page.getByRole('button',{name:'Menunggu Konfirmasi (1)',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('tbody tr').length===1)
 await page.getByRole('radio',{name:'Pilih pesanan HB-DB-3',exact:true}).check();const reject=page.getByRole('complementary',{name:'HB-DB-3',exact:true});page.once('dialog',d=>d.accept());await reject.getByRole('button',{name:'Tolak Bukti',exact:true}).click();await page.getByText('Bukti pembayaran ditolak.',{exact:true}).waitFor();await page.getByRole('button',{name:'Menunggu Konfirmasi (0)',exact:true}).waitFor();await reject.getByText('Menunggu Pembayaran',{exact:true}).waitFor()
 assert.equal(await reject.getByRole('button',{name:'Verifikasi Pembayaran',exact:true}).count(),0)
 await page.getByRole('button',{name:'Semua Pesanan (7)',exact:true}).click();await search.fill('not-found');await page.getByText('Tidak ada pesanan yang cocok dengan filter ini.',{exact:true}).waitFor()
 await search.fill('');await page.getByLabel('Metode kirim',{exact:true}).selectOption('GoSend');assert.ok(await page.locator('tbody tr').count()>0)
 await page.getByLabel('Metode kirim',{exact:true}).selectOption('all');await page.getByLabel('Status pembayaran',{exact:true}).selectOption('Ditolak');await page.waitForFunction(()=>document.querySelectorAll('tbody tr').length===1)
 await page.setViewportSize({width:900,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
 assert.equal(await page.evaluate(()=>localStorage.getItem('happybite-orders-v1')),'[]')
 assert.ok(signs>=2);assert.ok(actions.some(a=>a.name==='verifikasi_pembayaran'&&a.body.p_setuju===false));assert.deepEqual(errors,[])
 rows=[];await page.getByRole('button',{name:'Muat Ulang',exact:true}).click();await page.getByRole('button',{name:'Semua Pesanan (0)',exact:true}).waitFor();await page.getByText('Tidak ada pesanan yang cocok dengan filter ini.',{exact:true}).waitFor()
 console.log('PASS Supabase-only admin orders, joined mapping, pagination/search/filters, signed proof retry/zoom, RPC approval/reject/cancel/transitions, status counts, busy/errors/refetch, no completion action, empty states, no local writes, tablet layout')
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1})
