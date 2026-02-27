import { supabase, type Artwork, type PrintProduct } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArtworkActions } from '@/components/ArtworkActions';
import Link from 'next/link';

export const revalidate = 60;

async function getArtwork(slug: string): Promise<Artwork | null> {
  const { data } = await supabase
    .from('artworks')
    .select('*, art_styles(name, slug)')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();
  return data as Artwork | null;
}

async function getPrintProducts(): Promise<PrintProduct[]> {
  const { data } = await supabase
    .from('print_products')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  return (data as PrintProduct[]) || [];
}

async function getRelatedArtworks(styleId: string | null, currentId: string): Promise<Artwork[]> {
  let query = supabase
    .from('artworks')
    .select('*, art_styles(name, slug)')
    .eq('status', 'published')
    .neq('id', currentId)
    .limit(4);

  if (styleId) {
    query = query.eq('style_id', styleId);
  }

  const { data } = await query.order('published_at', { ascending: false });
  return (data as Artwork[]) || [];
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const artwork = await getArtwork(params.slug);
  if (!artwork) return { title: 'Not Found — Blart' };

  return {
    title: `${artwork.title} — Blart`,
    description: artwork.description || `"${artwork.title}" — AI-generated art by Blart. Free 4K download or order as a framed print.`,
    openGraph: {
      title: `${artwork.title} — Blart`,
      description: artwork.description || `AI-generated art. Free 4K download available.`,
      images: [{ url: artwork.image_url, width: artwork.width_px || 1200, height: artwork.height_px || 1600 }],
      type: 'article',
    },
  };
}

export default async function ArtworkPage({ params }: { params: { slug: string } }) {
  const [artwork, products] = await Promise.all([
    getArtwork(params.slug),
    getPrintProducts(),
  ]);

  if (!artwork) notFound();

  const related = await getRelatedArtworks(artwork.style_id, artwork.id);

  // JSON-LD for this specific product (agentic compatibility)
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VisualArtwork',
    name: artwork.title,
    description: artwork.description || `AI-generated artwork by Blart`,
    image: artwork.image_url,
    creator: { '@type': 'Organization', name: 'Blart AI' },
    artform: 'Digital Art',
    artMedium: 'AI Generated',
    dateCreated: artwork.published_at,
    offers: products.map(p => ({
      '@type': 'Offer',
      name: `${p.name} — ${p.size_label}`,
      price: (p.retail_price_aud / 100).toFixed(2),
      priceCurrency: 'AUD',
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
    })),
  };

  return (
    <div className="page-enter pt-24 md:pt-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      <div className="max-w-[1800px] mx-auto px-6 md:px-10">
        {/* Breadcrumb */}
        <nav className="mb-6 text-xs text-blart-ash">
          <Link href="/gallery" className="hover:text-blart-black transition-colors">Gallery</Link>
          {artwork.art_styles && (
            <>
              <span className="mx-2">/</span>
              <Link
                href={`/gallery?style=${(artwork.art_styles as any).slug}`}
                className="hover:text-blart-black transition-colors"
              >
                {(artwork.art_styles as any).name}
              </Link>
            </>
          )}
          <span className="mx-2">/</span>
          <span className="text-blart-dim">{artwork.title}</span>
        </nav>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16">
          {/* Image */}
          <div className="lg:col-span-3">
            <div className="sticky top-24">
              <img
                src={artwork.image_url}
                alt={artwork.title}
                className="w-full h-auto rounded-sm"
              />
            </div>
          </div>

          {/* Details & Actions */}
          <div className="lg:col-span-2">
            <div className="sticky top-24">
              {artwork.art_styles && (
                <p className="text-xs tracking-widest uppercase text-blart-ash mb-3">
                  {(artwork.art_styles as any).name}
                </p>
              )}

              <h1 className="font-display text-heading font-light mb-4">
                {artwork.title}
              </h1>

              {artwork.description && (
                <p className="text-blart-dim text-sm leading-relaxed mb-8">
                  {artwork.description}
                </p>
              )}

              {/* Tags */}
              {artwork.tags && artwork.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {artwork.tags.map(tag => (
                    <span key={tag} className="tag-pill">{tag}</span>
                  ))}
                </div>
              )}

              {/* Actions: Download & Order */}
              <ArtworkActions artwork={artwork} products={products} />

              {/* Stats */}
              <div className="mt-10 pt-6 border-t border-blart-stone/50 flex gap-8">
                <div>
                  <p className="text-xs tracking-wider uppercase text-blart-ash">Downloads</p>
                  <p className="font-mono text-sm mt-1">{artwork.download_count.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs tracking-wider uppercase text-blart-ash">Orders</p>
                  <p className="font-mono text-sm mt-1">{artwork.order_count.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-24">
            <h2 className="font-display text-heading font-light mb-8">You might also like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map(r => (
                <Link key={r.id} href={`/artwork/${r.slug}`} className="artwork-card rounded-sm">
                  <img
                    src={r.thumbnail_url || r.image_url}
                    alt={r.title}
                    className="w-full h-auto rounded-sm"
                    loading="lazy"
                  />
                  <div className="artwork-overlay rounded-sm">
                    <p className="text-white font-display text-sm">{r.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
