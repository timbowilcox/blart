'use client';

import { useState, useEffect, useCallback } from 'react';

interface ArtStyle {
  id: string;
  name: string;
  slug: string;
  prompt_prefix: string | null;
}

interface Artwork {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  image_url: string;
  status: string;
  is_featured: boolean;
  orientation: string;
  tags: string[];
  created_at: string;
  published_at: string | null;
  art_styles?: { name: string; slug: string };
}

type Tab = 'review' | 'published' | 'archived' | 'generate';

export default function AdminPage() {
  const [adminSecret, setAdminSecret] = useState('');
  const [isAuthed, setIsAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>('review');
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [styles, setStyles] = useState<ArtStyle[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Generation state
  const [genMode, setGenMode] = useState<'single' | 'batch'>('single');
  const [genStyleId, setGenStyleId] = useState('');
  const [genOrientation, setGenOrientation] = useState('');
  const [genCustomPrompt, setGenCustomPrompt] = useState('');
  const [genCount, setGenCount] = useState(10);
  const [genAutoPublish, setGenAutoPublish] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genResults, setGenResults] = useState<any>(null);

  const headers = useCallback(() => ({
    'Authorization': `Bearer ${adminSecret}`,
    'Content-Type': 'application/json',
  }), [adminSecret]);

  // Login
  const handleLogin = async () => {
    try {
      const res = await fetch('/api/admin/artworks?status=review&limit=1', {
        headers: headers(),
      });
      if (res.ok) {
        setIsAuthed(true);
        localStorage.setItem('blart_admin_secret', adminSecret);
      } else {
        setMessage('Invalid admin secret');
      }
    } catch {
      setMessage('Connection error');
    }
  };

  // Load saved secret
  useEffect(() => {
    const saved = localStorage.getItem('blart_admin_secret');
    if (saved) {
      setAdminSecret(saved);
    }
  }, []);

  // Fetch artworks
  const fetchArtworks = useCallback(async (status: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/artworks?status=${status}&limit=100`, {
        headers: headers(),
      });
      const data = await res.json();
      setArtworks(data.artworks || []);
    } catch {
      setMessage('Failed to fetch artworks');
    }
    setLoading(false);
  }, [headers]);

  // Fetch styles
  const fetchStyles = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/generate', {
        headers: headers(),
      });
      const data = await res.json();
      setStyles(data.styles || []);
    } catch {
      // Styles not critical
    }
  }, [headers]);

  useEffect(() => {
    if (isAuthed) {
      if (tab === 'generate') {
        fetchStyles();
      } else {
        fetchArtworks(tab);
      }
    }
  }, [isAuthed, tab, fetchArtworks, fetchStyles]);

  // Update artwork status
  const updateArtwork = async (id: string, updates: Record<string, any>) => {
    try {
      const res = await fetch('/api/admin/artworks', {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ id, ...updates }),
      });
      if (res.ok) {
        setMessage(`Updated successfully`);
        fetchArtworks(tab);
      } else {
        setMessage('Update failed');
      }
    } catch {
      setMessage('Update failed');
    }
  };

  // Generate artwork
  const handleGenerate = async () => {
    setGenerating(true);
    setGenResults(null);
    setMessage('');

    try {
      const res = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          mode: genMode,
          style_id: genStyleId || undefined,
          orientation: genOrientation || undefined,
          custom_prompt: genCustomPrompt || undefined,
          auto_publish: genAutoPublish,
          count: genCount,
        }),
      });
      const data = await res.json();
      setGenResults(data);

      if (data.success === false) {
        setMessage(`Generation failed: ${data.error}`);
      } else if (data.summary) {
        setMessage(`Batch complete: ${data.summary.success} success, ${data.summary.failed} failed`);
      } else {
        setMessage(`Generated: ${data.title || 'artwork'}`);
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }

    setGenerating(false);
  };

  // --- Login Screen ---
  if (!isAuthed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blart-cream">
        <div className="w-full max-w-sm p-8">
          <h1 className="font-display text-2xl mb-8 text-center">Blart Admin</h1>
          <input
            type="password"
            value={adminSecret}
            onChange={(e) => setAdminSecret(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Admin secret"
            className="w-full px-4 py-3 border border-blart-stone/50 bg-white text-sm font-mono focus:outline-none focus:border-blart-black mb-4"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-blart-black text-white py-3 text-sm tracking-wider uppercase hover:bg-blart-dim transition-colors"
          >
            Enter
          </button>
          {message && <p className="text-red-600 text-xs mt-4 text-center">{message}</p>}
        </div>
      </div>
    );
  }

  // --- Admin Dashboard ---
  return (
    <div className="min-h-screen bg-blart-cream">
      {/* Header */}
      <div className="border-b border-blart-stone/50 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="font-display text-xl">Blart Admin</h1>
          <div className="flex items-center gap-1">
            {(['review', 'published', 'archived', 'generate'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setMessage(''); }}
                className={`px-4 py-2 text-xs tracking-wider uppercase transition-colors ${
                  tab === t
                    ? 'bg-blart-black text-white'
                    : 'text-blart-dim hover:text-blart-black'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setIsAuthed(false); localStorage.removeItem('blart_admin_secret'); }}
            className="text-xs text-blart-dim hover:text-blart-black uppercase tracking-wider"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <div className="max-w-7xl mx-auto px-6 pt-4">
          <div className="bg-white border border-blart-stone/50 px-4 py-3 text-sm flex items-center justify-between">
            <span>{message}</span>
            <button onClick={() => setMessage('')} className="text-blart-dim hover:text-blart-black text-xs ml-4">×</button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* --- Generate Tab --- */}
        {tab === 'generate' && (
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl mb-8">Generate Artwork</h2>

            <div className="space-y-6 bg-white p-8 border border-blart-stone/30">
              {/* Mode */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-blart-dim mb-2">Mode</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setGenMode('single')}
                    className={`px-4 py-2 text-sm border ${genMode === 'single' ? 'bg-blart-black text-white border-blart-black' : 'border-blart-stone/50 text-blart-dim hover:border-blart-black'}`}
                  >
                    Single
                  </button>
                  <button
                    onClick={() => setGenMode('batch')}
                    className={`px-4 py-2 text-sm border ${genMode === 'batch' ? 'bg-blart-black text-white border-blart-black' : 'border-blart-stone/50 text-blart-dim hover:border-blart-black'}`}
                  >
                    Batch
                  </button>
                </div>
              </div>

              {/* Style */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-blart-dim mb-2">
                  Style {genMode === 'batch' && '(leave empty to rotate all)'}
                </label>
                <select
                  value={genStyleId}
                  onChange={(e) => setGenStyleId(e.target.value)}
                  className="w-full px-4 py-3 border border-blart-stone/50 bg-white text-sm focus:outline-none focus:border-blart-black"
                >
                  <option value="">All styles (rotate)</option>
                  {styles.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Orientation */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-blart-dim mb-2">Orientation</label>
                <select
                  value={genOrientation}
                  onChange={(e) => setGenOrientation(e.target.value)}
                  className="w-full px-4 py-3 border border-blart-stone/50 bg-white text-sm focus:outline-none focus:border-blart-black"
                >
                  <option value="">Random</option>
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                  <option value="square">Square</option>
                </select>
              </div>

              {/* Custom Prompt (single mode) */}
              {genMode === 'single' && (
                <div>
                  <label className="block text-xs uppercase tracking-wider text-blart-dim mb-2">Custom Prompt (optional)</label>
                  <textarea
                    value={genCustomPrompt}
                    onChange={(e) => setGenCustomPrompt(e.target.value)}
                    rows={3}
                    placeholder="Additional guidance for the AI artist..."
                    className="w-full px-4 py-3 border border-blart-stone/50 bg-white text-sm focus:outline-none focus:border-blart-black resize-none"
                  />
                </div>
              )}

              {/* Count (batch mode) */}
              {genMode === 'batch' && (
                <div>
                  <label className="block text-xs uppercase tracking-wider text-blart-dim mb-2">Count (max 50)</label>
                  <input
                    type="number"
                    value={genCount}
                    onChange={(e) => setGenCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                    min={1}
                    max={50}
                    className="w-full px-4 py-3 border border-blart-stone/50 bg-white text-sm font-mono focus:outline-none focus:border-blart-black"
                  />
                </div>
              )}

              {/* Auto-publish */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="autoPublish"
                  checked={genAutoPublish}
                  onChange={(e) => setGenAutoPublish(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="autoPublish" className="text-sm text-blart-dim">
                  Auto-publish (skip review)
                </label>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={generating || (genMode === 'single' && !genStyleId)}
                className={`w-full py-4 text-sm tracking-wider uppercase transition-colors ${
                  generating
                    ? 'bg-blart-ash text-white cursor-wait'
                    : 'bg-blart-black text-white hover:bg-blart-dim'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {generating
                  ? genMode === 'batch'
                    ? `Generating ${genCount} artworks...`
                    : 'Generating...'
                  : genMode === 'batch'
                    ? `Generate ${genCount} artworks`
                    : 'Generate artwork'}
              </button>
            </div>

            {/* Generation Results */}
            {genResults && (
              <div className="mt-6 bg-white p-6 border border-blart-stone/30">
                <h3 className="text-sm uppercase tracking-wider text-blart-dim mb-4">Results</h3>
                {genResults.summary ? (
                  <div className="space-y-2 text-sm">
                    <p className="font-mono">Success: {genResults.summary.success} / Failed: {genResults.summary.failed}</p>
                    <div className="max-h-64 overflow-y-auto space-y-1 mt-3">
                      {genResults.results?.map((r: any, i: number) => (
                        <div key={i} className={`font-mono text-xs px-2 py-1 ${r.success ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                          {r.success ? `✓ ${r.title}` : `✗ ${r.error}`}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : genResults.success ? (
                  <div className="flex items-start gap-4">
                    <img
                      src={genResults.image_url || ''}
                      alt={genResults.title}
                      className="w-32 h-32 object-cover border border-blart-stone/30"
                    />
                    <div>
                      <p className="font-display text-lg">{genResults.title}</p>
                      <p className="text-xs text-blart-dim font-mono mt-1">{genResults.slug}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-red-600 text-sm">{genResults.error}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* --- Artworks Grid (Review / Published / Archived) --- */}
        {tab !== 'generate' && (
          <>
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-2xl capitalize">{tab}</h2>
              <span className="text-sm text-blart-dim">{artworks.length} artwork{artworks.length !== 1 ? 's' : ''}</span>
            </div>

            {loading ? (
              <div className="text-center py-20 text-blart-dim">Loading...</div>
            ) : artworks.length === 0 ? (
              <div className="text-center py-20 text-blart-dim">
                <p>No {tab} artworks</p>
                {tab === 'review' && (
                  <button
                    onClick={() => setTab('generate')}
                    className="mt-4 text-sm underline hover:text-blart-black"
                  >
                    Generate some →
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {artworks.map((artwork) => (
                  <div key={artwork.id} className="bg-white border border-blart-stone/30 group">
                    {/* Image */}
                    <div className="aspect-square overflow-hidden bg-blart-cream">
                      <img
                        src={artwork.image_url}
                        alt={artwork.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <p className="text-sm font-display truncate">{artwork.title}</p>
                      <p className="text-xs text-blart-dim mt-0.5">
                        {artwork.art_styles?.name || 'Unknown'} · {artwork.orientation}
                      </p>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {tab === 'review' && (
                          <>
                            <button
                              onClick={() => updateArtwork(artwork.id, { status: 'published' })}
                              className="px-2.5 py-1 text-xs bg-green-700 text-white hover:bg-green-800 transition-colors"
                            >
                              Publish
                            </button>
                            <button
                              onClick={() => updateArtwork(artwork.id, { status: 'archived' })}
                              className="px-2.5 py-1 text-xs bg-blart-ash text-white hover:bg-blart-dim transition-colors"
                            >
                              Archive
                            </button>
                          </>
                        )}

                        {tab === 'published' && (
                          <>
                            <button
                              onClick={() => updateArtwork(artwork.id, { is_featured: !artwork.is_featured })}
                              className={`px-2.5 py-1 text-xs border transition-colors ${
                                artwork.is_featured
                                  ? 'bg-amber-600 text-white border-amber-600'
                                  : 'border-blart-stone/50 text-blart-dim hover:border-blart-black'
                              }`}
                            >
                              {artwork.is_featured ? '★ Featured' : '☆ Feature'}
                            </button>
                            <button
                              onClick={() => updateArtwork(artwork.id, { status: 'archived' })}
                              className="px-2.5 py-1 text-xs border border-blart-stone/50 text-blart-dim hover:border-blart-black transition-colors"
                            >
                              Archive
                            </button>
                          </>
                        )}

                        {tab === 'archived' && (
                          <>
                            <button
                              onClick={() => updateArtwork(artwork.id, { status: 'published' })}
                              className="px-2.5 py-1 text-xs bg-green-700 text-white hover:bg-green-800 transition-colors"
                            >
                              Publish
                            </button>
                            <button
                              onClick={() => updateArtwork(artwork.id, { status: 'review' })}
                              className="px-2.5 py-1 text-xs border border-blart-stone/50 text-blart-dim hover:border-blart-black transition-colors"
                            >
                              → Review
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
