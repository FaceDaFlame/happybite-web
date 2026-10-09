import ProductCard from './ProductCard'
import SectionHeading from './SectionHeading'
import CatalogGateBanner from './CatalogGateBanner'
import { gallery } from '@/data/homeGallery'
import { Reveal } from '@/components/Animation'
import Stagger from './Stagger'

export default function GalleryShowcase({ onAccount }) {
  return (
    <Reveal id="katalog" className="scroll-mt-36 bg-peach">
      <div className="mx-auto max-w-[1320px] px-5 py-11 lg:px-8">
        <SectionHeading
          eyebrow="Galeri karya dapur • Artisan showcase"
          title="Kreasi Cookie Penuh Cinta & Bahan Alami"
        >
          Setiap gigitan dipanggang segar setiap pagi dengan mentega murni
          Prancis dan cokelat Belgia pilihan.
        </SectionHeading>
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {gallery.map((product) => (
            <ProductCard key={product.name} {...product} />
          ))}
        </Stagger>
        <CatalogGateBanner onAccount={onAccount} />
      </div>
    </Reveal>
  )
}
