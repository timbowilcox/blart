import Link from 'next/link';
import { supabase, type Artwork } from '@/lib/supabase';
import { ArtworkGrid } from '@/components/ArtworkGrid';

async function getFeaturedArtworks(): Promise<Artwork[]> {
  const { data } = await supabase
    .from('artworks')
    .select('*, art_styles(name, slug)')
    .eq('status', 'published')
    .eq('is_featured', true)
    .order('published_at', { ascending: false })
    .limit(8);

  return (data as Artwork[]) || [];
}

async function getLatestArtworks(): Promise<Artwork[]> {
  const { data } = await supabase
    .from('artworks')
    .select('*, art_styles(name, slug)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(12);

  return (data as Artwork[]) || [];
}

export const revalidate = 60; // Revalidate every 60 seconds

export default async function HomePage() {
  const [featured, latest] = await Promise.all([
    getFeaturedArtworks(),
    getLatestArtworks(),
  ]);

  return (
    <div className="page-enter">
      {/* Hero */}
      <section className="pt-32 pb-20 md:pt-44 md:pb-28 px-6 md:px-10 max-w-[1800px] mx-auto">
        <div className="max-w-3xl">
          <h1 className="font-display text-display font-light">
            Art, generated.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-blart-dim font-light leading-relaxed max-w-xl">
            Every piece is unique. Download in 4K for free, or order a museum-quality
            framed print delivered to your door.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/gallery" className="btn-primary">
              Browse Gallery
            </Link>
            <Link href="/about" className="btn-outline">
              How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="px-6 md:px-10 max-w-[1800px] mx-auto mb-24">
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="font-display text-heading font-light">Featured</h2>
            <Link
              href="/gallery?filter=featured"
              className="text-xs tracking-widest uppercase text-blart-ash hover:text-blart-black transition-colors"
            >
              View all →
            </Link>
          </div>
          <ArtworkGrid artworks={featured} />
        </section>
      )}

      {/* Latest */}
      {latest.length > 0 && (
        <section className="px-6 md:px-10 max-w-[1800px] mx-auto mb-24">
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="font-display text-heading font-light">Latest</h2>
            <Link
              href="/gallery"
              className="text-xs tracking-widest uppercase text-blart-ash hover:text-blart-black transition-colors"
            >
              View all →
            </Link>
          </div>
          <ArtworkGrid artworks={latest} />
        </section>
      )}

      {/* Free Downloads CTA */}
      <section className="bg-blart-cream px-6 md:px-10 py-20 md:py-28">
        <div className="max-w-[1800px] mx-auto text-center">
          <h2 className="font-display text-heading font-light mb-4">
            Every piece, free in 4K
          </h2>
          <p className="text-blart-dim max-w-md mx-auto mb-8">
            No sign-up needed. Download any artwork in full 4K resolution.
            Use it as a wallpaper, print it yourself, or share it.
          </p>
          <Link href="/gallery" className="btn-primary">
            Start Browsing
          </Link>
        </div>
      </section>

      {/* Print Quality */}
      <section className="px-6 md:px-10 py-20 md:py-28 max-w-[1800px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
          <div>
            <p className="text-xs tracking-widest uppercase text-blart-ash mb-3">Print Quality</p>
            <h3 className="font-display text-xl font-light mb-3">Museum-Grade Giclée</h3>
            <p className="text-sm text-blart-dim leading-relaxed">
              Fine art prints on archival paper, hand-framed in solid wood with conservation-grade mounting. 
              Lasts 100–200 years in optimal conditions.
            </p>
          </div>
          <div>
            <p className="text-xs tracking-widest uppercase text-blart-ash mb-3">Delivery</p>
            <h3 className="font-display text-xl font-light mb-3">Printed Locally, Shipped Fast</h3>
            <p className="text-sm text-blart-dim leading-relaxed">
              Orders are routed to the nearest print facility in our global network — UK, EU, US, or AU.
              Shorter distances mean faster delivery and lower impact.
            </p>
          </div>
          <div>
            <p className="text-xs tracking-widest uppercase text-blart-ash mb-3">Framing</p>
            <h3 className="font-display text-xl font-light mb-3">8 Frame Colours</h3>
            <p className="text-sm text-blart-dim leading-relaxed">
              Classic satin-laminated wood frames in black, white, natural, antique silver, brown,
              antique gold, dark grey, and light grey. Delivered ready to hang.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
