// Real SDK/browser with mocked HTTP + Phoenix WebSocket; no remote writes.
const {chromium}=require(process.env.TEMP+'/happybite-auth-check/node_modules/playwright')
const assert=require('node:assert/strict')
const base='http://127.0.0.1:5185', uuid=n=>'50000000-0000-4000-8000-'+String(n).padStart(12,'0')
;(async()=>{
 const {loadEnv}=await import('vite');const origin=new URL(loadEnv('development',process.cwd(),'VITE_').VITE_SUPABASE_URL).origin
 const browser=await chromium.launch({channel:'msedge',headless:true})
 try{
 const context=await browser.newContext({viewport:{width:1320,height:1000},reducedMotion:'reduce'});const page=await context.newPage();page.setDefaultTimeout(12000)
 const errors=[];page.on('pageerror',e=>errors.push(e.message));const goto=p=>page.goto(base+p,{waitUntil:'domcontentloaded'})
 let user={id:uuid(999),aud:'authenticated',role:'authenticated',email:'customer@example.test',app_metadata:{provider:'email'},user_metadata:{}}
 const token=()=>[Buffer.from(JSON.stringify({alg:'HS256'})).toString('base64url'),Buffer.from(JSON.stringify({sub:user.id,email:user.email,role:'authenticated',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),'fixture'].join('.')
 let orders=['menunggu_pembayaran','dikirim','selesai','menunggu_konfirmasi','diproses','qc_packing','dibatalkan'].map((status,i)=>({id:uuid(i+1),user_id:user.id,no_pesanan:'HB-CUSTOMER-'+(i+1),created_at:new Date(Date.now()-i*60000).toISOString(),status_pesanan:status,subtotal:90000,ongkir:10000,total:100000,nama_penerima:'Penerima Asli',no_whatsapp:'081234567890',email:user.email,alamat:'Jalan Riwayat 5',kota:'Jakarta Selatan',kode_pos:'12345',catatan_kurir:'Titip resepsionis',metode_kirim:'GoSend',kartu_ucapan:'Terima kasih',order_items:[{id:uuid(50+i),order_id:uuid(i+1),product_id:uuid(90),nama_produk:'Cookie Harga Saat Beli',harga_satuan:30000,jumlah:3,suhu_penyajian:'Hangat',products:i===0?{gambar_url:base+'/test-cookie.png'}:i===1?{gambar_url:base+'/missing-cookie.png'}:null}],payments:i?[{id:uuid(60+i),nominal:100000,nama_pengirim:'Pengirim Asli',bukti_url:user.id+'/'+uuid(i+1)+'/proof.png',status:'lunas',uploaded_at:new Date().toISOString()}]:[]}))
 let notifications=[{id:uuid(100),user_id:user.id,order_id:orders[1].id,tipe:'status_pesanan',judul:'Pesanan sedang dikirim',deskripsi:'Paket Anda menuju alamat.',sudah_dibaca:false,created_at:new Date().toISOString()},{id:uuid(101),user_id:user.id,order_id:null,tipe:'informasi',judul:'Info akun',deskripsi:'Data telah diterima.',sudah_dibaca:false,created_at:new Date().toISOString()}]
 let historyFail=true,noticeFail=false,patchFail=false,rpcFail=false,patchGate=null,confirmGate=null,patches=0,rpcs=0,historyGets=0,noticeGets=0
 const sockets=[];let joins=0,leaves=0
 await context.routeWebSocket('**/realtime/v1/websocket**',ws=>{
  ws.onMessage(raw=>{const [joinRef,ref,topic,event,payload]=JSON.parse(raw.toString())
   if(event==='phx_join'){
    const configs=payload.config.postgres_changes;assert.equal(configs[0].table,'notifications');assert.equal(configs[0].schema,'public');assert.equal(configs[0].filter,'user_id=eq.'+user.id);joins++
    sockets.push({ws,joinRef,topic,userId:user.id});ws.send(JSON.stringify([joinRef,ref,topic,'phx_reply',{status:'ok',response:{postgres_changes:configs.map((c,i)=>({...c,id:i+1}))}}]))
   }else if(event==='phx_leave'){leaves++;ws.send(JSON.stringify([joinRef,ref,topic,'phx_reply',{status:'ok',response:{}}]))}
   else if(event==='heartbeat')ws.send(JSON.stringify([joinRef,ref,topic,'phx_reply',{status:'ok',response:{}}]))
  })
 })
 const realtime=(type,row)=>{const socket=sockets.at(-1);socket.ws.send(JSON.stringify([socket.joinRef,null,socket.topic,'postgres_changes',{ids:[1],data:{schema:'public',table:'notifications',type,commit_timestamp:new Date().toISOString(),record:row,old_record:{},columns:[],errors:null}}]))}
 await context.route('**/*',r=>[base,origin].includes(new URL(r.request().url()).origin)?r.continue():r.abort())
 await context.route(base+'/test-cookie.png',r=>r.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jC3cAAAAASUVORK5CYII=','base64')}))
 await context.route(base+'/missing-cookie.png',r=>r.fulfill({status:404,body:''}))
 await context.route(origin+'/**',async r=>{
  const req=r.request(),u=new URL(req.url()),q=u.searchParams
  const json=(data,status=200)=>r.fulfill({status,contentType:'application/json',headers:{'access-control-allow-origin':'*','x-supabase-api-version':'2024-01-01'},body:JSON.stringify(data)})
  if(u.pathname.endsWith('/token'))return json({access_token:token(),refresh_token:'fixture',expires_in:3600,token_type:'bearer',user})
  if(u.pathname.endsWith('/profiles'))return json({id:user.id,nama_lengkap:'Pembeli Asli',role:'pelanggan'})
  if(u.pathname.endsWith('/user'))return json(user)
  if(u.pathname.endsWith('/logout'))return json({})
  if(u.pathname.endsWith('/orders')){assert.equal(req.method(),'GET');assert.equal(q.get('user_id'),'eq.'+user.id);assert.equal(q.get('order'),'created_at.desc');assert.match(q.get('select'),/order_items\(.*nama_produk.*harga_satuan/);assert.match(q.get('select'),/products\(gambar_url\)/);assert.match(q.get('select'),/payments\(/);historyGets++;return historyFail?json({message:'database offline'},500):json(orders.filter(o=>o.user_id===user.id))}
  if(u.pathname.endsWith('/notifications')){
   assert.equal(q.get('user_id'),'eq.'+user.id)
   if(req.method()==='GET'){noticeGets++;return noticeFail?json({message:'notifications offline'},500):json(notifications.filter(n=>n.user_id===user.id))}
   assert.equal(req.method(),'PATCH');assert.deepEqual(req.postDataJSON(),{sudah_dibaca:true});patches++
   if(patchGate)await patchGate
   if(patchFail)return json({message:'policy denied'},403)
   if(!q.has('id'))assert.equal(q.get('sudah_dibaca'),'eq.false')
   notifications=notifications.map(n=>n.user_id===user.id&&(!q.has('id')||q.get('id')==='eq.'+n.id)?{...n,sudah_dibaca:true}:n);return json(null)
  }
  if(u.pathname.endsWith('/rpc/konfirmasi_pesanan_selesai')){rpcs++;const body=req.postDataJSON();assert.deepEqual(Object.keys(body),['p_order_id']);const order=orders.find(o=>o.id===body.p_order_id);assert.equal(order.status_pesanan,'dikirim');assert.equal(order.user_id,user.id);if(confirmGate)await confirmGate;if(rpcFail)return json({message:'status tidak diizinkan'},400);order.status_pesanan='selesai';return json(order)}
  if(u.pathname.includes('/storage/v1/object/sign/')){if(req.method()==='GET')return r.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jC3cAAAAASUVORK5CYII=','base64')});assert.deepEqual(req.postDataJSON(),{expiresIn:300});assert.ok(u.pathname.includes(user.id));return json({signedURL:u.pathname.replace('/storage/v1','')+'?token=fixture'})}
  throw Error('Unexpected request '+req.method()+' '+u.pathname)
 })
 await goto('/');await page.evaluate(()=>{localStorage.setItem('happybite-orders-v1','[]');localStorage.setItem('happybite-notifications-v1','[{"id":"old"}]')})
 async function login(){await goto('/login');await page.locator('#login-email').fill(user.email);await page.locator('#login-password').fill('password123');await page.getByRole('button',{name:'Masuk ke Akun HappyBite',exact:true}).click();await page.waitForURL(base+'/')}
 assert.equal(noticeGets,0);await login();await page.getByRole('button',{name:'Notifikasi, 2 belum dibaca',exact:true}).waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('happybite-notifications-v1')),null)
 await goto('/riwayat-pesanan');await page.getByText('Gagal memuat riwayat pesanan.',{exact:true}).waitFor();assert.equal(await page.locator('article').count(),0)
 historyFail=false;await page.getByRole('button',{name:'Coba lagi',exact:true}).click();await page.getByRole('button',{name:'Semua Pesanan (7)',exact:true}).waitFor();assert.equal(await page.locator('article').count(),3)
 await page.waitForFunction(()=>{const image=document.querySelector('article img');return image?.complete&&image.naturalWidth>0});assert.equal(await page.locator('article').first().getByRole('img',{name:'Cookie Harga Saat Beli',exact:true}).getAttribute('src'),base+'/test-cookie.png');await page.waitForFunction(()=>document.querySelectorAll('article img').length===1)
 const card=page.locator('article').filter({has:page.getByRole('heading',{name:'HB-CUSTOMER-2',exact:true})})
 await card.getByRole('button',{name:'Detail Pesanan',exact:true}).click();const detail=page.getByRole('dialog',{name:'Detail Pesanan',exact:true});await detail.getByText('Jalan Riwayat 5, Jakarta Selatan, 12345',{exact:true}).waitFor();await detail.getByText('Nama Pengirim: Pengirim Asli',{exact:true}).waitFor();await detail.getByText('Rp 90.000',{exact:true}).first().waitFor();await detail.getByRole('button',{name:'Lihat Bukti Pembayaran',exact:true}).click();await detail.getByRole('img',{name:'Bukti pembayaran',exact:true}).waitFor();await page.keyboard.press('Escape')
 assert.equal(await page.getByRole('link',{name:'Lanjutkan Pembayaran',exact:true}).getAttribute('href'),'/pembayaran/'+orders[0].id)
 rpcFail=true;await card.getByRole('button',{name:'Konfirmasi Pesanan Diterima',exact:true}).click();await page.getByText('Gagal mengonfirmasi pesanan. Coba lagi.',{exact:true}).waitFor()
 rpcFail=false;let release;confirmGate=new Promise(r=>release=r);await card.getByRole('button',{name:'Konfirmasi Pesanan Diterima',exact:true}).click();await card.getByRole('button',{name:'Memproses...',exact:true}).waitFor();assert.equal(await card.getByRole('button',{name:'Memproses...',exact:true}).isDisabled(),true);release();confirmGate=null;await page.getByText('Pesanan berhasil dikonfirmasi diterima.',{exact:true}).waitFor();await page.getByRole('button',{name:'Pesanan Selesai (2)',exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Konfirmasi Pesanan Diterima',exact:true}).count(),0)
 await page.getByLabel('Cari invoice / jenis cookie',{exact:true}).fill('HB-CUSTOMER-6');await page.waitForFunction(()=>document.querySelectorAll('article').length===1);await page.getByRole('heading',{name:'HB-CUSTOMER-6',exact:true}).waitFor();await page.getByLabel('Cari invoice / jenis cookie',{exact:true}).fill('Cookie Harga Saat Beli');await page.getByRole('button',{name:'QC & Packing (1)',exact:true}).click();await page.getByRole('heading',{name:'HB-CUSTOMER-6',exact:true}).waitFor()
 await page.getByRole('button',{name:'Notifikasi, 2 belum dibaca',exact:true}).click();const panel=page.getByRole('dialog',{name:'Notifikasi & Update Pesanan',exact:true});await panel.getByRole('button',{name:/Info akun/}).waitFor()
 patchFail=true;await panel.getByRole('button',{name:/Info akun/}).click();await panel.getByText('Gagal menandai notifikasi. Coba lagi.',{exact:true}).waitFor();await page.getByRole('button',{name:'Notifikasi, 2 belum dibaca',exact:true}).waitFor()
 patchFail=false;patchGate=new Promise(r=>release=r);await panel.getByRole('button',{name:/Info akun/}).click();await page.getByRole('button',{name:'Notifikasi, 1 belum dibaca',exact:true}).waitFor();release();patchGate=null;await panel.getByRole('button',{name:/Pesanan sedang dikirim/}).click();await page.waitForFunction(()=>!document.querySelector('#notifications-panel'));await page.getByRole('button',{name:'Notifikasi, 0 belum dibaca',exact:true}).waitFor()
 const newNotification={id:uuid(102),user_id:user.id,order_id:orders[1].id,tipe:'status',judul:'Pesanan selesai realtime',deskripsi:'Terima kasih!',sudah_dibaca:false,created_at:new Date().toISOString()};notifications.unshift(newNotification);realtime('INSERT',newNotification);await page.getByRole('button',{name:'Notifikasi, 1 belum dibaca',exact:true}).waitFor();realtime('INSERT',newNotification)
 await page.getByRole('button',{name:'Notifikasi, 1 belum dibaca',exact:true}).click();await panel.getByRole('button',{name:'Semua (3)',exact:true}).waitFor();await panel.getByRole('button',{name:/Tandai Semua Dibaca/}).click();await page.getByRole('button',{name:'Notifikasi, 0 belum dibaca',exact:true}).waitFor();await page.waitForFunction(()=>document.querySelector('#notifications-panel li button')?.disabled===false);await page.keyboard.press('Escape')
 noticeFail=true;realtime('UPDATE',newNotification);await page.getByRole('button',{name:'Notifikasi, 0 belum dibaca',exact:true}).click();await panel.getByText('Gagal memuat notifikasi.',{exact:true}).waitFor();noticeFail=false;await panel.getByRole('button',{name:'Muat Ulang Notifikasi',exact:true}).click();await panel.getByRole('button',{name:'Semua (3)',exact:true}).waitFor();await page.keyboard.press('Escape')
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.setViewportSize({width:1320,height:1000})
 await page.evaluate(async()=>{const {supabase}=await import('/src/lib/supabaseClient.js');await supabase.auth.signOut()});await page.waitForURL('**/login');assert.equal(await page.getByRole('button',{name:/Notifikasi, /}).count(),0);assert.ok(leaves>0)
 const oldGets=noticeGets;await page.waitForTimeout(100);assert.equal(noticeGets,oldGets)
 user={...user,id:uuid(998),email:'second@example.test'};await login();await page.getByRole('button',{name:'Notifikasi, 0 belum dibaca',exact:true}).waitFor();await goto('/riwayat-pesanan');await page.getByText('Tidak ada pesanan yang cocok',{exact:true}).waitFor();assert.equal(await page.locator('article').count(),0)
 assert.ok(joins>=2);assert.ok(historyGets>=3);assert.ok(patches>=4);assert.equal(rpcs,2);assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>localStorage.getItem('happybite-orders-v1')),'[]')
 console.log('PASS: customer-scoped history snapshots, error/retry/empty/search/statuses, details/private proof/payment URL, received RPC, notification read rollback/optimism/all, realtime INSERT dedup + UPDATE, logout cleanup and account isolation, mobile layout, no local order writes')
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1})
