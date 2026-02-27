'use client';

import { useState } from 'react';
import { type Artwork, type PrintProduct } from '@/lib/supabase';

const FRAME_COLORS: Record<string, string> = {
  'black': '#1a1a1a',
  'white': '#f5f5f5',
  'natural': '#c4a882',
  'antique-silver': '#a8a8a8',
  'brown': '#5c3d2e',
  'antique-gold': '#b89a5a',
  'dark-grey': '#4a4a4a',
  'light-grey': '#c0c0c0',
};

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function ArtworkActions({
  artwork,
  products,
}: {
  artwork: Artwork;
  products: PrintProduct[];
}) {
  const [selectedProduct, setSelectedProduct] = useState<PrintProduct | null>(products[1] || products[0] || null);
  const [selectedFrame, setSelectedFrame] = useState('black');
  const [isOrdering, setIsOrdering] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    setIsDownloading(true);
    try {
      // Track download
      await fetch(`/api/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artwork_id: artwork.id, action: 'download' }),
      });

      // Open 4K image
      const url = artwork.image_4k_url || artwork.image_url;
      const link = document.createElement('a');
      link.href = url;
      link.download = `blart-${artwork.slug}-4k.png`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleOrder() {
    if (!selectedProduct) return;
    setIsOrdering(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artwork_id: artwork.id,
          artwork_title: artwork.title,
          artwork_slug: artwork.slug,
          artwork_image: artwork.image_url,
          print_product_id: selectedProduct.id,
          size_label: selectedProduct.size_label,
          prodigi_sku: selectedProduct.prodigi_sku,
          frame_color: selectedFrame,
          unit_price: selectedProduct.retail_price_aud,
          quantity: 1,
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('No checkout URL returned');
      }
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setIsOrdering(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Free Download */}
      <div>
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="btn-outline w-full"
        >
          {isDownloading ? 'Preparing...' : 'Download 4K — Free'}
        </button>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-blart-stone/50" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-blart-white px-4 text-xs tracking-widest uppercase text-blart-ash">
            or order a print
          </span>
        </div>
      </div>

      {/* Size Selection */}
      <div>
        <p className="text-xs tracking-widest uppercase text-blart-ash mb-3">Size</p>
        <div className="grid grid-cols-1 gap-2">
          {products.map(product => (
            <button
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              className={`flex items-center justify-between px-4 py-3 border rounded-sm transition-all text-sm ${
                selectedProduct?.id === product.id
                  ? 'border-blart-black bg-blart-black text-white'
                  : 'border-blart-stone hover:border-blart-dim'
              }`}
            >
              <span className="font-medium">{product.size_label}</span>
              <span className={selectedProduct?.id === product.id ? 'text-white/80' : 'text-blart-dim'}>
                {formatPrice(product.retail_price_aud)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Frame Color */}
      {selectedProduct && (
        <div>
          <p className="text-xs tracking-widest uppercase text-blart-ash mb-3">
            Frame — <span className="capitalize">{selectedFrame.replace('-', ' ')}</span>
          </p>
          <div className="flex gap-2">
            {selectedProduct.frame_colors.map(color => (
              <button
                key={color}
                onClick={() => setSelectedFrame(color)}
                className={`w-9 h-9 rounded-full border-2 transition-all ${
                  selectedFrame === color ? 'border-blart-black scale-110' : 'border-blart-stone'
                }`}
                style={{ backgroundColor: FRAME_COLORS[color] || '#ccc' }}
                title={color.replace('-', ' ')}
              />
            ))}
          </div>
        </div>
      )}

      {/* Order Button */}
      {selectedProduct && (
        <div>
          <button
            onClick={handleOrder}
            disabled={isOrdering}
            className="btn-primary w-full text-base py-4"
          >
            {isOrdering
              ? 'Preparing checkout...'
              : `Order Print — ${formatPrice(selectedProduct.retail_price_aud)}`}
          </button>
          <p className="text-xs text-blart-ash text-center mt-3">
            + $15 shipping · Worldwide delivery · Ready to hang
          </p>
        </div>
      )}
    </div>
  );
}
