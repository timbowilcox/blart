import { supabase, type Artwork, type ArtStyle } from '@/lib/supabase';
import { ArtworkGrid } from '@/components/ArtworkGrid';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gallery — Blart',
  description: 'Browse our collection of unique AI-generated art. Free 4K downloads available for every piece.',
};

export const revalidate = 60;

async function getStyles(): Promise<ArtStyle[]> {
  const { data } = await supabase
    .from('art_styles')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  return (data as ArtStyle[]) || [];
}

async function getArtworks(style?: string, featured?: boolean): Promise<Artwork[]> {
  let query = supabase
    .from('artworks')
    .select('*, art_styles(name, slug)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(100);

  if (featured) {
    query = query.eq('is_featured', true);
  }

  // Style filtering via join
  const { data } = await query;
  let artworks = (data as Artwork[]) || [];

  if (style) {
    artworks = artworks.filter(a => (a.art_styles as any)?.slug === style);
  }

  return artworks;
}

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: { style?: string; filter?: string };
}) {
  const styles = await getStyles();
  const artworks = await getArtworks(
    searchParams.style,
    searchParams.filter === 'featured'
  );

  const activeStyle = searchParams.style;
  const isFeatured = searchParams.filter === 'featured';

  return (
    <div className="page-enter pt-24 md:pt-28">
      {/* Title */}
      <div className="px-6 md:px-10 max-w-[1800px] mx-auto mb-8">
        <h1 className="font-display text-display font-light">
          {isFeatured ? 'Featured' : activeStyle ? styles.find(s => s.slug === activeStyle)?.name || 'Gallery' : 'Gallery'}
        </h1>
        <p className="mt-3 text-blart-dim">
          {artworks.length} piece{artworks.length !== 1 ? 's' : ''}
          {activeStyle && (
            <> · <Link href="/gallery" className="underline underline-offset-2">View all</Link></>
          )}
        </p>
      </div>

      {/* Style filters */}
      <div className="px-6 md:px-10 max-w-[1800px] mx-auto mb-10 overflow-x-auto">
        <div className="flex gap-2 pb-2">
          <Link
            href="/gallery"
            className={`tag-pill whitespace-nowrap ${!activeStyle && !isFeatured ? 'border-blart-black text-blart-black' : ''}`}
          >
            All
          </Link>
          <Link
            href="/gallery?filter=featured"
            className={`tag-pill whitespace-nowrap ${isFeatured ? 'border-blart-black text-blart-black' : ''}`}
          >
            Featured
          </Link>
          {styles.map(style => (
            <Link
              key={style.id}
              href={`/gallery?style=${style.slug}`}
              className={`tag-pill whitespace-nowrap ${activeStyle === style.slug ? 'border-blart-black text-blart-black' : ''}`}
            >
              {style.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="px-6 md:px-10 max-w-[1800px] mx-auto mb-20">
        <ArtworkGrid artworks={artworks} />
      </div>
    </div>
  );
}
