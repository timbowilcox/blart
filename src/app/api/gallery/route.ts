import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/gallery
 * 
 * Public API for browsing the Blart gallery.
 * Designed for AI agents to recommend art to their users.
 * 
 * Query params:
 *   style  - Filter by style slug (e.g. "abstract", "landscapes")
 *   tag    - Filter by tag
 *   featured - "true" to show only featured works
 *   limit  - Number of results (default 20, max 100)
 *   offset - Pagination offset
 *   sort   - "newest" | "popular" | "most_downloaded"
 * 
 * Returns JSON array of artworks with download URLs and print pricing.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const style = searchParams.get('style');
  const tag = searchParams.get('tag');
  const featured = searchParams.get('featured') === 'true';
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');
  const sort = searchParams.get('sort') || 'newest';

  let query = supabase
    .from('artworks')
    .select('id, title, slug, description, image_url, image_4k_url, thumbnail_url, tags, colors, orientation, view_count, download_count, order_count, published_at, art_styles(name, slug)')
    .eq('status', 'published')
    .range(offset, offset + limit - 1);

  if (featured) {
    query = query.eq('is_featured', true);
  }

  if (tag) {
    query = query.contains('tags', [tag]);
  }

  // Sort
  switch (sort) {
    case 'popular':
      query = query.order('order_count', { ascending: false });
      break;
    case 'most_downloaded':
      query = query.order('download_count', { ascending: false });
      break;
    default:
      query = query.order('published_at', { ascending: false });
  }

  const { data: artworks, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filter by style in JS (since we join)
  let results = artworks || [];
  if (style) {
    results = results.filter((a: any) => a.art_styles?.slug === style);
  }

  // Get print products for pricing info
  const { data: products } = await supabase
    .from('print_products')
    .select('name, size_label, retail_price_aud, frame_colors')
    .eq('is_active', true)
    .order('sort_order');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://blart.ai';

  // Format response for agents
  const response = {
    gallery: 'Blart — AI Generated Art',
    description: 'Unique AI-generated art. Free 4K downloads. Museum-quality framed prints worldwide.',
    website: appUrl,
    total_results: results.length,
    artworks: results.map((artwork: any) => ({
      id: artwork.id,
      title: artwork.title,
      description: artwork.description,
      style: artwork.art_styles?.name || null,
      tags: artwork.tags,
      orientation: artwork.orientation,
      urls: {
        page: `${appUrl}/artwork/${artwork.slug}`,
        image: artwork.image_url,
        download_4k: artwork.image_4k_url,
        thumbnail: artwork.thumbnail_url,
      },
      stats: {
        views: artwork.view_count,
        downloads: artwork.download_count,
        orders: artwork.order_count,
      },
      published: artwork.published_at,
    })),
    print_options: (products || []).map((p: any) => ({
      size: p.size_label,
      price_aud: (p.retail_price_aud / 100).toFixed(2),
      frame_colors: p.frame_colors,
    })),
    free_download: true,
    free_download_resolution: '4K (3840×2160 minimum)',
  };

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
