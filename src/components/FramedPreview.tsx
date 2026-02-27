'use client';

import { useState } from 'react';

const FRAME_HEX: Record<string, string> = {
  'black': '#1a1a1a',
  'white': '#f5f5f5',
  'natural': '#c4a882',
  'antique-silver': '#a8a8a8',
  'brown': '#5c3d2e',
  'antique-gold': '#b89a5a',
  'dark-grey': '#4a4a4a',
  'light-grey': '#c0c0c0',
};

// Subtle wood grain / texture via inline gradient overlays
function frameTexture(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lighter = `rgba(${Math.min(r + 18, 255)},${Math.min(g + 18, 255)},${Math.min(b + 18, 255)},0.5)`;
  const darker = `rgba(${Math.max(r - 12, 0)},${Math.max(g - 12, 0)},${Math.max(b - 12, 0)},0.4)`;
  return `linear-gradient(135deg, ${lighter} 0%, transparent 40%, transparent 60%, ${darker} 100%)`;
}

type ViewMode = 'framed' | 'raw';

export function FramedPreview({
  imageUrl,
  title,
  frameColor = 'black',
  showMount = true,
  sizeLabel,
  orientation = 'portrait',
}: {
  imageUrl: string;
  title: string;
  frameColor: string;
  showMount?: boolean;
  sizeLabel?: string;
  orientation?: string;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>('framed');
  const [imgLoaded, setImgLoaded] = useState(false);

  const hex = FRAME_HEX[frameColor] || FRAME_HEX['black'];
  const isLight = frameColor === 'white' || frameColor === 'light-grey' || frameColor === 'antique-silver';

  // Frame width scales based on view — thick enough to look real
  const frameWidth = 'clamp(12px, 2.5vw, 28px)';
  // Mount (mat) width
  const mountWidth = showMount ? 'clamp(16px, 3vw, 40px)' : '0px';

  // Shadow for depth
  const frameShadow = isLight
    ? '0 8px 40px rgba(0,0,0,0.12), 0 2px 10px rgba(0,0,0,0.08)'
    : '0 12px 50px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.15)';

  // Inner frame edge shadow (bevel effect)
  const innerShadow = isLight
    ? 'inset 1px 1px 3px rgba(0,0,0,0.08), inset -1px -1px 2px rgba(255,255,255,0.5)'
    : 'inset 1px 1px 4px rgba(0,0,0,0.3), inset -1px -1px 2px rgba(255,255,255,0.05)';

  if (viewMode === 'raw') {
    return (
      <div className="relative">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-auto rounded-sm"
        />
        {/* View toggle */}
        <div className="absolute bottom-4 right-4 flex bg-black/60 backdrop-blur-sm rounded-sm overflow-hidden">
          <button
            onClick={() => setViewMode('raw')}
            className="px-3 py-1.5 text-[10px] tracking-wider uppercase text-white/90 bg-white/20"
          >
            Image
          </button>
          <button
            onClick={() => setViewMode('framed')}
            className="px-3 py-1.5 text-[10px] tracking-wider uppercase text-white/50 hover:text-white/80 transition-colors"
          >
            Framed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Wall background */}
      <div
        className="flex items-center justify-center py-10 px-6 md:py-14 md:px-10 transition-all duration-500"
        style={{
          background: 'linear-gradient(180deg, #f0ede6 0%, #e8e4dc 100%)',
          minHeight: '300px',
        }}
      >
        {/* Frame outer */}
        <div
          className="relative transition-all duration-500"
          style={{
            padding: frameWidth,
            backgroundColor: hex,
            backgroundImage: frameTexture(hex),
            boxShadow: frameShadow,
            maxWidth: '85%',
          }}
        >
          {/* Inner frame bevel */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ boxShadow: innerShadow }}
          />

          {/* Mount/Mat area */}
          <div
            className="transition-all duration-500"
            style={{
              padding: mountWidth,
              backgroundColor: showMount ? '#faf9f6' : 'transparent',
              boxShadow: showMount
                ? 'inset 0 0 0 1px rgba(0,0,0,0.04), inset 0 1px 3px rgba(0,0,0,0.06)'
                : 'none',
            }}
          >
            {/* Image */}
            <div className="relative overflow-hidden bg-blart-cream">
              <img
                src={imageUrl}
                alt={title}
                className={`w-full h-auto block transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImgLoaded(true)}
              />
              {!imgLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-blart-ash/30 border-t-blart-ash rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Wall shadow beneath frame */}
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[60%] h-4 rounded-full"
          style={{
            background: 'radial-gradient(ellipse, rgba(0,0,0,0.06) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Size label badge */}
      {sizeLabel && (
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-sm">
          <span className="text-[10px] tracking-wider uppercase text-white/80">{sizeLabel}</span>
        </div>
      )}

      {/* View toggle */}
      <div className="absolute bottom-4 right-4 flex bg-black/60 backdrop-blur-sm rounded-sm overflow-hidden">
        <button
          onClick={() => setViewMode('raw')}
          className="px-3 py-1.5 text-[10px] tracking-wider uppercase text-white/50 hover:text-white/80 transition-colors"
        >
          Image
        </button>
        <button
          onClick={() => setViewMode('framed')}
          className="px-3 py-1.5 text-[10px] tracking-wider uppercase text-white/90 bg-white/20"
        >
          Framed
        </button>
      </div>
    </div>
  );
}