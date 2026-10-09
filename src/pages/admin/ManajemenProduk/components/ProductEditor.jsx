import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import Icon from '@/components/Icon'
import { useProducts } from '@/context/productsContext'
import ProductField, { inputClass } from './ProductField'

export default function ProductEditor({ product, onClose, onSavingChange }) {
  const { saveProduct, categories } = useProducts()
  const reduceMotion = useReducedMotion()
  const panel = useRef(null)
  const photo = useRef(null)
  const photoRead = useRef(0)
  const savingRef = useRef(false)
  const [values, setValues] = useState(() => ({
    name: product?.name || '',
    sku: product?.sku || '',
    image: product?.gambarUrl || '',
    categoryId: product?.categoryId || categories[0]?.id || '',
    badge: product?.badge || '',
    unitNote: product?.unitNote || '',
    description: product?.description || '',
    variants: product?.variants || [],
    price: product?.price ?? '',
    stokDisplayEtalase: product?.stokDisplayEtalase ?? 0,
    adonanDinginChiller: product?.adonanDinginChiller ?? 0,
    adonanDinginLokasi: product?.adonanDinginLokasi || '',
    suhuOvenIdeal: product?.suhuOvenIdeal || '',
    durasiPemanggangan: product?.durasiPemanggangan || '',
    deskripsiProduk: product?.deskripsiProduk || '',
    isLiveOnWebsite: product?.isLiveOnWebsite ?? true,
    isCatalogVisible: product?.isCatalogVisible ?? true,
  }))
  const [errors, setErrors] = useState({})
  const [reading, setReading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [variantInput, setVariantInput] = useState('')
  const isBundle =
    categories.find((c) => c.id === values.categoryId)?.slug === 'bundles'
  function close() {
    if (!savingRef.current) onClose()
  }
  useEffect(() => {
    const previous = document.activeElement
    panel.current?.focus({ preventScroll: true })
    function key(event) {
      if (event.key === 'Escape' && !savingRef.current) onClose()
    }
    window.addEventListener('keydown', key)
    return () => {
      window.removeEventListener('keydown', key)
      previous?.focus({ preventScroll: true })
    }
  }, [onClose])
  function change(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '', save: '' }))
  }
  function choosePhoto(event) {
    const file = event.target.files?.[0]
    const version = ++photoRead.current
    if (!file) return
    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      setErrors((current) => ({
        ...current,
        image: 'Gunakan JPG, PNG, atau WEBP maksimal 2 MB.',
      }))
      event.target.value = ''
      return
    }
    const reader = new FileReader()
    setReading(true)
    reader.onload = () => {
      if (version !== photoRead.current) return
      setValues((current) => ({ ...current, image: reader.result }))
      setErrors((current) => ({ ...current, image: '' }))
      setReading(false)
    }
    reader.onerror = () => {
      setReading(false)
      setErrors((current) => ({
        ...current,
        image: 'Foto tidak dapat dibaca.',
      }))
    }
    reader.readAsDataURL(file)
  }
  function addVariants(text) {
    const added = text
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
    setValues((current) => ({
      ...current,
      variants: [...new Set([...current.variants, ...added])],
    }))
    setVariantInput('')
  }
  async function submit(event) {
    event.preventDefault()
    if (savingRef.current || reading) return
    const next = {}
    if (!values.name.trim()) next.name = 'Nama varian cookie wajib diisi.'
    if (!categories.some((c) => c.id === values.categoryId))
      next.categoryId = 'Pilih kategori menu.'
    if (
      !values.price ||
      !Number.isSafeInteger(Number(values.price)) ||
      Number(values.price) <= 0
    )
      next.price = 'Masukkan harga satuan lebih dari Rp 0 (rupiah bulat).'
    for (const field of ['stokDisplayEtalase', 'adonanDinginChiller']) {
      if (
        !Number.isSafeInteger(Number(values[field])) ||
        Number(values[field]) < 0 ||
        values[field] === ''
      )
        next[field] = 'Masukkan jumlah bulat minimal 0.'
    }
    setErrors(next)
    if (Object.keys(next).length) return
    savingRef.current = true
    setSaving(true)
    onSavingChange(true)
    try {
      const variants = [
        ...new Set([
          ...values.variants,
          ...variantInput
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean),
        ]),
      ]
      await saveProduct({ ...values, variants }, product?.id)
      onClose()
    } catch (error) {
      setErrors({ save: error.message })
    } finally {
      savingRef.current = false
      setSaving(false)
      onSavingChange(false)
    }
  }
  const field = (name) => ({
    name,
    value: values[name],
    onChange: change,
    error: errors[name],
  })
  return (
    <motion.aside
      data-product-editor
      ref={panel}
      tabIndex={-1}
      role="dialog"
      aria-modal="false"
      aria-labelledby="product-editor-title"
      initial={reduceMotion ? false : { x: '100%' }}
      animate={{ x: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.25, ease: 'easeOut' }}
      className="fixed bottom-0 right-0 top-0 z-40 flex w-[min(90vw,480px)] flex-col bg-white shadow-warm outline-none 2xl:w-[560px]"
    >
      <header className="shrink-0 bg-canvas px-6 py-6">
        <button
          onClick={close}
          disabled={saving}
          type="button"
          aria-label="Tutup panel produk"
          className="float-right ml-3 rounded-full bg-blush/60 p-2 hover:bg-blush"
        >
          <Icon name="close" className="h-4 w-4" />
        </button>
        {product && (
          <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px]">
            <span className="rounded-full bg-blush px-2 py-1 font-bold">
              SKU: {product.sku}
            </span>
            <span
              className={`h-1.5 w-1.5 rounded-full ${product.isLiveOnWebsite ? 'bg-emerald-600' : 'bg-muted'}`}
            />
            <span>
              {product.isLiveOnWebsite
                ? 'Live di Website'
                : 'Tidak ditampilkan'}
            </span>
          </div>
        )}
        <h2 id="product-editor-title" className="text-lg font-bold leading-7">
          {product ? `Edit Varian: ${product.name}` : 'Tambah Produk Baru'}
        </h2>
      </header>
      <form
        noValidate
        onSubmit={submit}
        className="flex min-h-0 flex-1 flex-col"
      >
        <fieldset
          disabled={saving}
          className="min-w-0 flex-1 space-y-5 overflow-y-auto p-6"
        >
          <div>
            <p className="mb-2 text-xs font-bold uppercase">
              Foto Tampilan Produk
            </p>
            <div className="flex items-center gap-4 rounded-2xl bg-peach p-3">
              {values.image ? (
                <img
                  src={values.image}
                  alt="Preview foto produk"
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-blush/60 text-primary">
                  <Icon name="cookie" className="h-8 w-8" />
                </span>
              )}
              <div className="text-[11px] text-muted">
                <p>Rekomendasi rasio 1:1, format WEBP/JPG max 2MB.</p>
                <div className="mt-2 flex gap-4">
                  <button
                    type="button"
                    onClick={() => photo.current.click()}
                    className="rounded-full bg-blush/60 px-3 py-1.5 font-semibold text-chocolate"
                  >
                    Ganti Foto
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      ++photoRead.current
                      setReading(false)
                      setValues((v) => ({ ...v, image: '' }))
                      photo.current.value = ''
                    }}
                    className="text-red-700"
                  >
                    Hapus
                  </button>
                </div>
              </div>
              <input
                ref={photo}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-label="Upload foto produk"
                onChange={choosePhoto}
                className="sr-only"
              />
            </div>
            {errors.image && (
              <p role="alert" className="mt-1 text-xs text-red-700">
                {errors.image}
              </p>
            )}
          </div>
          <ProductField
            label="SKU"
            {...field('sku')}
            placeholder="Otomatis jika kosong"
          />
          <ProductField
            label="Nama Varian Cookie"
            {...field('name')}
            placeholder="Nama varian cookie"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <ProductField
              label="Kategori Menu"
              name="categoryId"
              error={errors.categoryId}
            >
              <select
                id="product-categoryId"
                name="categoryId"
                value={values.categoryId}
                onChange={change}
                aria-invalid={!!errors.categoryId}
                className={inputClass}
              >
                <option value="">Pilih kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nama}
                  </option>
                ))}
              </select>
            </ProductField>
            <ProductField
              label="Harga Satuan (IDR)"
              {...field('price')}
              type="number"
              min="1"
              step="1"
              placeholder="Rp 34.000"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <ProductField
              label="Badge"
              {...field('badge')}
              placeholder="Best Seller"
            />
            <ProductField
              label="Satuan"
              {...field('unitNote')}
              placeholder="/ pcs (110gr)"
            />
          </div>
          <ProductField label="Deskripsi Singkat" {...field('description')} />
          {isBundle && (
            <ProductField label="Varian (pisahkan dengan koma)" name="variants">
              <div className="mb-2 flex flex-wrap gap-2">
                {values.variants.map((variant) => (
                  <span
                    key={variant}
                    className="inline-flex items-center gap-2 rounded-full bg-blush px-3 py-1 text-xs"
                  >
                    {variant}
                    <button
                      type="button"
                      aria-label={`Hapus varian ${variant}`}
                      onClick={() =>
                        setValues((v) => ({
                          ...v,
                          variants: v.variants.filter(
                            (item) => item !== variant,
                          ),
                        }))
                      }
                    >
                      <Icon name="close" className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                id="product-variants"
                value={variantInput}
                className={inputClass}
                placeholder="Mix Favorit, Chocolate Lovers"
                onChange={(e) => {
                  if (e.target.value.includes(',')) addVariants(e.target.value)
                  else setVariantInput(e.target.value)
                }}
                onBlur={() => addVariants(variantInput)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addVariants(variantInput)
                  }
                }}
              />
            </ProductField>
          )}
          <section className="space-y-4 rounded-2xl bg-canvas p-4">
            <h3 className="text-xs font-bold text-baked">
              STATUS STOK & KAPASITAS DAPUR
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <ProductField
                label="Stok Display Etalase"
                {...field('stokDisplayEtalase')}
                type="number"
                min="0"
                step="1"
              />
              <ProductField
                label="Adonan Dingin (Chiller)"
                {...field('adonanDinginChiller')}
                type="number"
                min="0"
                step="1"
              />
            </div>
            <ProductField
              label="Lokasi Adonan Dingin"
              {...field('adonanDinginLokasi')}
              placeholder="3 Loyang di Chiller B"
            />
            <p className="flex gap-2 text-[11px] leading-5 text-muted">
              <Icon name="note" className="mt-0.5 h-4 w-4 text-baked" />
              Adonan {values.adonanDinginChiller || 0} pcs
              {values.adonanDinginLokasi
                ? ` · ${values.adonanDinginLokasi}`
                : ''}{' '}
              (siap oven). Stok etalase ditampilkan di katalog pelanggan.
            </p>
          </section>
          <div className="grid grid-cols-2 gap-4">
            <ProductField
              label="Suhu Oven Ideal"
              {...field('suhuOvenIdeal')}
              placeholder="175°C"
            />
            <ProductField
              label="Durasi Pemanggangan"
              {...field('durasiPemanggangan')}
              placeholder="12 Menit"
            />
          </div>
          <ProductField
            label="Deskripsi Produk (Website & Menu QR)"
            name="deskripsiProduk"
          >
            <textarea
              id="product-deskripsiProduk"
              {...field('deskripsiProduk')}
              rows="4"
              className={`${inputClass} resize-y rounded-2xl`}
            />
          </ProductField>
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-peach p-4">
            <div>
              <p id="product-live-label" className="text-xs font-bold">
                Tampilkan di Menu Pemesanan
              </p>
              <p className="mt-1 text-[11px] text-muted">
                Pelanggan dapat memesan varian ini secara online.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={values.isLiveOnWebsite}
              aria-labelledby="product-live-label"
              onClick={() =>
                setValues((v) => ({
                  ...v,
                  isLiveOnWebsite: !v.isLiveOnWebsite,
                }))
              }
              className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 ${values.isLiveOnWebsite ? 'bg-baked' : 'bg-muted/40'}`}
            >
              <span
                className={`h-5 w-5 rounded-full bg-white transition-transform motion-reduce:transition-none ${values.isLiveOnWebsite ? 'translate-x-5' : ''}`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-peach p-4">
            <p id="product-catalog-label" className="text-xs font-bold">
              Tampilkan di Katalog
            </p>
            <button
              type="button"
              role="switch"
              aria-checked={values.isCatalogVisible}
              aria-labelledby="product-catalog-label"
              onClick={() =>
                setValues((v) => ({
                  ...v,
                  isCatalogVisible: !v.isCatalogVisible,
                }))
              }
              className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 ${values.isCatalogVisible ? 'bg-baked' : 'bg-muted/40'}`}
            >
              <span
                className={`h-5 w-5 rounded-full bg-white transition-transform motion-reduce:transition-none ${values.isCatalogVisible ? 'translate-x-5' : ''}`}
              />
            </button>
          </div>
          {errors.save && (
            <p role="alert" className="text-sm text-red-700">
              {errors.save}
            </p>
          )}
        </fieldset>
        <footer className="flex shrink-0 justify-end gap-6 border-t border-primary/10 bg-peach/70 px-6 py-5">
          <button
            type="button"
            onClick={close}
            disabled={saving}
            className="text-sm font-semibold"
          >
            Batal
          </button>
          <button
            disabled={reading || saving}
            type="submit"
            className="rounded-full bg-baked px-6 py-3 text-sm font-semibold text-white shadow-soft hover:bg-terracotta disabled:opacity-50"
          >
            {saving
              ? 'Menyimpan...'
              : reading
                ? 'Membaca foto...'
                : product
                  ? 'Simpan Perubahan'
                  : 'Tambah Produk'}
          </button>
        </footer>
      </form>
    </motion.aside>
  )
}
