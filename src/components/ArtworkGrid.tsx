import Link from 'next/link';
import { type Artwork } from '@/lib/supabase';

export function ArtworkGrid({ artworks }: { artworks: Artwork[] }) {
  if (artworks.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-blart-ash font-display text-xl">No artworks yet</p>
        <p className="text-sm text-blart-dim mt-2">Check back soon — new pieces are added daily.</p>
      </div>
    );
  }

  return (
    <div className="masonry-grid">
      {artworks.map((artwork, i) => (
        <Link
          key={artwork.id}
          href={`/artwork/${artwork.slug}`}
          className={`masonry-item artwork-card block rounded-sm opacity-0 animate-fade-in stagger-${Math.min(i + 1, 8)}`}
        >
          <div className="relative">
            <img
              src={artwork.thumbnail_url || artwork.image_url}
              alt={artwork.title}
              className="w-full h-auto rounded-sm"
              loading={i < 4 ? 'eager' : 'lazy'}
            />
            <div className="artwork-overlay rounded-sm">
              <div>
                <h3 className="text-white font-display text-lg font-light">{artwork.title}</h3>
                {artwork.art_styles && (
                  <p className="text-white/60 text-xs tracking-wider uppercase mt-1">
                    {(artwork.art_styles as any).name}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
