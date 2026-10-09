import { Link } from 'react-router-dom'
import { isProductSoldOut } from '@/services/productMapper'

export default function RelatedProductCard({ product, onAdd }) {
  return (
    <article className="flex min-w-0 flex-col rounded-2xl bg-white p-3 shadow-soft">
      <Link
        to={`/produk/${product.slug}`}
        className="relative block overflow-hidden rounded-xl"
        aria-label={`Lihat ${product.name}`}
      >
        <img
          src={product.image}
          alt={product.name}
          width="500"
          height="500"
          loading="lazy"
          className="aspect-square w-full object-cover transition-transform duration-300 hover:scale-[1.03] motion-reduce:transform-none"
        />
        <span className="absolute left-3 top-3 rounded-full bg-canvas px-3 py-1 text-[11px] font-bold">
          {product.badge}
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-1 pt-3">
        <p className="text-xs">
          <span aria-hidden="true" className="text-baked">
            ★{' '}
          </span>
          <span className="sr-only">Rating </span>
          <strong>{product.rating.toFixed(1)}</strong>{' '}
          <span className="text-muted">
            ({product.reviewCount.toLocaleString('id-ID')} ulasan)
          </span>
        </p>
        <h3 className="mt-2 text-lg font-bold">
          <Link
            to={`/produk/${product.slug}`}
            className="rounded hover:text-baked"
          >
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 text-sm leading-6 text-muted">
          {product.description}
        </p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
          <p className="text-lg font-bold text-baked">
            Rp {product.price.toLocaleString('id-ID')}
          </p>
          <button
            type="button"
            disabled={isProductSoldOut(product)}
            onClick={() => onAdd(product)}
            aria-label={`Tambah ${product.name}`}
            className="rounded-full bg-blush/70 px-4 py-2.5 text-sm font-bold hover:bg-blush"
          >
            {isProductSoldOut(product) ? 'Stok Habis' : '+ Tambah'}
          </button>
        </div>
      </div>
    </article>
  )
}
