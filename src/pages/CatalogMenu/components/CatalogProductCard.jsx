import { Link } from 'react-router-dom'
import Icon from '@/components/Icon'
import { isProductSoldOut } from '@/services/productMapper'

export default function CatalogProductCard({
  product,
  wished,
  onWishlist,
  onAdd,
  onSelect,
}) {
  return (
    <article className="flex h-full min-w-0 flex-col rounded-[30px] bg-white p-3 shadow-soft">
      <div className="relative overflow-hidden rounded-t-[20px]">
        <Link
          to={`/produk/${product.slug}`}
          aria-label={`Lihat ${product.name}`}
          className="block"
        >
          <img
            src={product.image}
            alt={product.name}
            width="600"
            height="600"
            loading="lazy"
            className="aspect-square w-full object-cover transition-transform duration-300 hover:scale-[1.03] motion-reduce:transform-none"
          />
        </Link>
        <div className="pointer-events-none absolute left-2.5 top-2.5 flex max-w-[75%] flex-col items-start gap-1.5">
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${product.badgeStyle}`}
          >
            {product.badge}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] ${product.lowStock ? 'bg-blush font-bold text-baked' : 'bg-canvas text-chocolate'}`}
          >
            {product.stockNote}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onWishlist(product.id)}
          aria-label={`${wished ? 'Hapus' : 'Simpan'} ${product.name} ${wished ? 'dari' : 'ke'} wishlist`}
          aria-pressed={wished}
          className={`absolute right-2.5 top-2.5 rounded-full bg-white/95 p-2 shadow-soft transition-colors hover:text-terracotta ${wished ? 'text-terracotta' : 'text-muted'}`}
        >
          <Icon
            name="heart"
            className={`h-4 w-4 ${wished ? 'fill-current' : ''}`}
          />
        </button>
      </div>
      <div className="flex flex-1 flex-col px-0.5 pb-1 pt-3">
        <p className="flex items-center gap-1.5 text-xs">
          <span aria-hidden="true" className="text-base text-baked">
            ★
          </span>
          <span className="sr-only">Rating</span>
          <strong>{product.rating.toFixed(1)}</strong>
          <span className="text-muted">
            ({product.reviewCount.toLocaleString('id-ID')} ulasan)
          </span>
        </p>
        <h2 className="mt-2 text-lg font-bold leading-7 tracking-[-.3px]">
          <Link
            to={`/produk/${product.slug}`}
            className="rounded hover:text-baked"
          >
            {product.name}
          </Link>
        </h2>
        <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted">
          {product.description}
        </p>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-7">
          <div>
            <p className="mb-1 text-[10px] text-muted">
              {product.priceLabel || 'Harga Satuan'}
            </p>
            <p className="whitespace-nowrap text-lg font-bold text-baked">
              Rp {product.price.toLocaleString('id-ID')}
            </p>
          </div>
          <button
            type="button"
            disabled={isProductSoldOut(product)}
            onClick={() =>
              product.variantSelect ? onSelect(product) : onAdd(product)
            }
            aria-label={`${product.variantSelect ? 'Pilih varian' : 'Tambah ke keranjang'} ${product.name}`}
            className={`inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-bold transition-colors ${product.variantSelect ? 'bg-primary text-chocolate hover:bg-golden' : 'bg-baked text-white hover:bg-terracotta'}`}
          >
            {isProductSoldOut(product) ? (
              'Stok Habis'
            ) : product.variantSelect ? (
              <>
                <span>
                  Pilih Varian &<br />
                  Beli
                </span>
                <Icon name="chevronRight" className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                <Icon name="cart" className="h-4 w-4" />+ Keranjang
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  )
}
