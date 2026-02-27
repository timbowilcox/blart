'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface ArtStyle {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  prompt_prefix: string | null;
  reference_images: string[];
  is_active: boolean;
  sort_order: number;
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

type Tab = 'review' | 'published' | 'archived' | 'styles' | 'generate' | 'settings';

export default function AdminPage() {
  const [adminSecret, setAdminSecret] = useState('');
  const [isAuthed, setIsAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>('review');
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Generation state
  const [genStyles, setGenStyles] = useState<{ id: string; name: string; slug: string; prompt_prefix: string | null }[]>([]);
  const [genMode, setGenMode] = useState<'single' | 'batch'>('single');
  const [genStyleId, setGenStyleId] = useState('');
  const [genOrientation, setGenOrientation] = useState('');
  const [genCustomPrompt, setGenCustomPrompt] = useState('');
  const [genCount, setGenCount] = useState(10);
  const [genAutoPublish, setGenAutoPublish] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genResults, setGenResults] = useState<any>(null);

  // Preview state
  const [previewing, setPreviewing] = useState(false);
  const [previewResult, setPreviewResult] = useState<{ image_data_url?: string; error?: string } | null>(null);

  // Settings state (master prompt)
  const [defaultBasePrompt, setDefaultBasePrompt] = useState('');
  const [persistedBasePrompt, setPersistedBasePrompt] = useState('');
  const [settingsBasePrompt, setSettingsBasePrompt] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  // Styles management state
  const [allStyles, setAllStyles] = useState<ArtStyle[]>([]);
  const [stylesLoading, setStylesLoading] = useState(false);
  const [uploadingStyleId, setUploadingStyleId] = useState<string | null>(null);
  const styleFileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadStyleId, setActiveUploadStyleId] = useState<string | null>(null);

  const headers = useCallback(() => ({
    'Authorization': `Bearer ${adminSecret}`,
    'Content-Type': 'application/json',
  }), [adminSecret]);

  const handleLogin = async () => {
    try {
      const res = await fetch('/api/admin/artworks?status=review&limit=1', { headers: headers() });
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

  useEffect(() => {
    const saved = localStorage.getItem('blart_admin_secret');
    if (saved) setAdminSecret(saved);
  }, []);

  // ── Fetch artworks ──
  const fetchArtworks = useCallback(async (status: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/artworks?status=${status}&limit=100`, { headers: headers() });
      const data = await res.json();
      setArtworks(data.artworks || []);
    } catch {
      setMessage('Failed to fetch artworks');
    }
    setLoading(false);
  }, [headers]);

  // ── Fetch generation styles (lightweight, for Generate tab) ──
  const fetchGenStyles = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/generate', { headers: headers() });
      const data = await res.json();
      setGenStyles(data.styles || []);
      if (data.default_base_prompt) setDefaultBasePrompt(data.default_base_prompt);
      if (data.persisted_base_prompt) setPersistedBasePrompt(data.persisted_base_prompt);
    } catch {}
  }, [headers]);

  // ── Fetch settings (master prompt) ──
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings?key=base_prompt', { headers: headers() });
      const data = await res.json();
      if (data.value) {
        setSettingsBasePrompt(data.value);
        setPersistedBasePrompt(data.value);
      } else {
        // No persisted prompt yet, use the default
        setSettingsBasePrompt(defaultBasePrompt);
      }
    } catch {}
  }, [headers, defaultBasePrompt]);

  // ── Fetch all styles (full data, for Styles tab) ──
  const fetchAllStyles = useCallback(async () => {
    setStylesLoading(true);
    try {
      const res = await fetch('/api/admin/styles', { headers: headers() });
      const data = await res.json();
      setAllStyles(data.styles || []);
    } catch {
      setMessage('Failed to fetch styles');
    }
    setStylesLoading(false);
  }, [headers]);

  // ── Tab routing ──
  useEffect(() => {
    if (isAuthed) {
      if (tab === 'generate') fetchGenStyles();
      else if (tab === 'settings') {
        if (!defaultBasePrompt) fetchGenStyles();
        fetchSettings();
      }
      else if (tab === 'styles') fetchAllStyles();
      else fetchArtworks(tab);
    }
  }, [isAuthed, tab, fetchArtworks, fetchGenStyles, fetchSettings, fetchAllStyles, defaultBasePrompt]);

  // ── Artwork management ──
  const updateArtwork = async (id: string, updates: Record<string, any>) => {
    try {
      const res = await fetch('/api/admin/artworks', {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ id, ...updates }),
      });
      if (res.ok) { setMessage('Updated successfully'); fetchArtworks(tab); }
      else setMessage('Update failed');
    } catch { setMessage('Update failed'); }
  };

  // ── Save master prompt to DB ──
  const saveBasePrompt = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({ key: 'base_prompt', value: settingsBasePrompt }),
      });
      if (res.ok) {
        setMessage('Master prompt saved');
        setPersistedBasePrompt(settingsBasePrompt);
      } else {
        setMessage('Failed to save master prompt');
      }
    } catch {
      setMessage('Failed to save master prompt');
    }
    setSavingSettings(false);
  };

  // ── Style moodboard image upload ──
  const handleStyleImageUpload = async (styleId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingStyleId(styleId);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      try {
        const res = await fetch('/api/admin/styles', {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify({ style_id: styleId, image_data_url: dataUrl }),
        });
        if (res.ok) {
          setMessage('Reference image uploaded');
          fetchAllStyles();
        } else {
          const data = await res.json();
          setMessage(`Upload failed: ${data.error}`);
        }
      } catch {
        setMessage('Upload failed');
      }
      setUploadingStyleId(null);
    };
    reader.readAsDataURL(file);
    if (styleFileInputRef.current) styleFileInputRef.current.value = '';
  };

  // ── Remove reference image from style ──
  const removeStyleImage = async (styleId: string, imageUrl: string) => {
    const style = allStyles.find(s => s.id === styleId);
    if (!style) return;
    const updatedImages = (style.reference_images || []).filter(url => url !== imageUrl);
    try {
      const res = await fetch('/api/admin/styles', {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ id: styleId, reference_images: updatedImages }),
      });
      if (res.ok) {
        setMessage('Image removed');
        fetchAllStyles();
      } else {
        setMessage('Failed to remove image');
      }
    } catch {
      setMessage('Failed to remove image');
    }
  };

  // ── Preview ──
  const handlePreview = async () => {
    if (!genStyleId) { setMessage('Select a style first to preview'); return; }
    setPreviewing(true);
    setPreviewResult(null);
    setMessage('');
    try {
      const res = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          mode: 'preview',
          style_id: genStyleId,
          orientation: genOrientation || undefined,
          custom_prompt: genCustomPrompt || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) { setPreviewResult({ image_data_url: data.image_data_url }); }
      else { setPreviewResult({ error: data.error }); setMessage(`Preview failed: ${data.error}`); }
    } catch (err: any) { setMessage(`Preview error: ${err.message}`); }
    setPreviewing(false);
  };

  // ── Generate ──
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
      if (data.success === false) setMessage(`Generation failed: ${data.error}`);
      else if (data.summary) setMessage(`Batch complete: ${data.summary.success} success, ${data.summary.failed} failed`);
      else setMessage(`Generated: ${data.title || 'artwork'}`);
    } catch (err: any) { setMessage(`Error: ${err.message}`); }
    setGenerating(false);
  };

  // ── Login screen ──
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
          <button onClick={handleLogin} className="w-full bg-blart-black text-white py-3 text-sm tracking-wider uppercase hover:bg-blart-dim transition-colors">
            Enter
          </button>
          {message && <p className="text-red-600 text-xs mt-4 text-center">{message}</p>}
        </div>
      </div>
    );
  }

  // ── Main layout ──
  return (
    <div className="min-h-screen bg-blart-cream">
      <div className="border-b border-blart-stone/50 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="font-display text-xl">Blart Admin</h1>
          <div className="flex items-center gap-1">
            {(['review', 'published', 'archived', 'styles', 'generate', 'settings'] as Tab[]).map((t) => (
              <button key={t} onClick={() => { setTab(t); setMessage(''); }}
                className={`px-4 py-2 text-xs tracking-wider uppercase transition-colors ${tab === t ? 'bg-blart-black text-white' : 'text-blart-dim hover:text-blart-black'}`}>
                {t}
              </button>
            ))}
          </div>
          <button onClick={() => { setIsAuthed(false); localStorage.removeItem('blart_admin_secret'); }}
            className="text-xs text-blart-dim hover:text-blart-black uppercase tracking-wider">
            Logout
          </button>
        </div>
      </div>

      {message && (
        <div className="max-w-7xl mx-auto px-6 pt-4">
          <div className="bg-white border border-blart-stone/50 px-4 py-3 text-sm flex items-center justify-between">
            <span>{message}</span>
            <button onClick={() => setMessage('')} className="text-blart-dim hover:text-blart-black text-xs ml-4">×</button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* SETTINGS TAB — Master Prompt */}
        {tab === 'settings' && (
          <div className="max-w-3xl">
            <h2 className="font-display text-2xl mb-2">Settings</h2>
            <p className="text-sm text-blart-dim mb-8">Global configuration that applies across all generations.</p>

            <div className="bg-white p-8 border border-blart-stone/30">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm uppercase tracking-wider font-medium">Master Prompt</h3>
                  <p className="text-xs text-blart-ash mt-1">
                    This base prompt is prepended to every artwork generation, regardless of style.
                    It defines the overall quality and creative direction of all Blart artwork.
                  </p>
                </div>
              </div>

              <textarea
                value={settingsBasePrompt}
                onChange={(e) => setSettingsBasePrompt(e.target.value)}
                rows={10}
                className="w-full px-4 py-3 border border-blart-stone/50 bg-white text-sm focus:outline-none focus:border-blart-black resize-none font-mono text-xs leading-relaxed"
              />

              <div className="flex items-center justify-between mt-4">
                <div className="flex gap-3 items-center">
                  <button
                    onClick={() => setSettingsBasePrompt(defaultBasePrompt)}
                    className="text-xs text-blart-dim hover:text-blart-black underline"
                  >
                    Reset to factory default
                  </button>
                  {settingsBasePrompt !== persistedBasePrompt && (
                    <span className="text-xs text-amber-600">● Unsaved changes</span>
                  )}
                </div>
                <button
                  onClick={saveBasePrompt}
                  disabled={savingSettings || settingsBasePrompt === persistedBasePrompt}
                  className={`px-6 py-2.5 text-sm tracking-wider uppercase transition-colors ${
                    savingSettings ? 'bg-blart-ash text-white cursor-wait' :
                    settingsBasePrompt === persistedBasePrompt ? 'bg-blart-stone/30 text-blart-ash cursor-not-allowed' :
                    'bg-blart-black text-white hover:bg-blart-dim'
                  }`}
                >
                  {savingSettings ? 'Saving...' : 'Save Prompt'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STYLES TAB — Per-Style Moodboards */}
        {tab === 'styles' && (
          <div>
            <h2 className="font-display text-2xl mb-2">Styles & Moodboards</h2>
            <p className="text-sm text-blart-dim mb-8">
              Manage reference images for each art style. These images are sent to the AI as visual context
              with every generation in that style — they act as a persistent moodboard.
            </p>

            {stylesLoading ? (
              <div className="text-center py-20 text-blart-dim">Loading styles...</div>
            ) : (
              <div className="space-y-6">
                {allStyles.map((style) => (
                  <div key={style.id} className="bg-white border border-blart-stone/30 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-display text-lg">{style.name}</h3>
                        <p className="text-xs text-blart-ash font-mono mt-0.5">{style.slug}</p>
                        {style.description && (
                          <p className="text-sm text-blart-dim mt-1">{style.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 ${style.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                          {style.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    {/* Reference images grid */}
                    <div className="flex flex-wrap gap-3">
                      {(style.reference_images || []).map((imgUrl, i) => (
                        <div key={i} className="relative w-28 h-28 border border-blart-stone/50 overflow-hidden group bg-blart-cream">
                          <img src={imgUrl} alt={`${style.name} ref ${i + 1}`} className="w-full h-full object-cover" />
                          <button
                            onClick={() => removeStyleImage(style.id, imgUrl)}
                            className="absolute inset-0 bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Remove
                          </button>
                        </div>
                      ))}

                      {/* Upload button */}
                      <label className="w-28 h-28 border border-dashed border-blart-stone/60 text-blart-ash hover:border-blart-black hover:text-blart-black transition-colors flex flex-col items-center justify-center text-xs gap-1 cursor-pointer">
                        {uploadingStyleId === style.id ? (
                          <span className="text-xs">Uploading...</span>
                        ) : (
                          <>
                            <span className="text-lg leading-none">+</span>
                            <span>Add image</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingStyleId === style.id}
                          onChange={(e) => handleStyleImageUpload(style.id, e)}
                        />
                      </label>
                    </div>

                    {(style.reference_images || []).length > 0 && (
                      <p className="text-xs text-blart-ash mt-3">
                        {(style.reference_images || []).length} reference image{(style.reference_images || []).length !== 1 ? 's' : ''} — sent as mood/style context with every {style.name} generation
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* GENERATE TAB — Simplified (no base prompt, no inspiration) */}
        {tab === 'generate' && (
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl mb-2">Generate Artwork</h2>
            <p className="text-sm text-blart-dim mb-8">
              Master prompt and moodboard images are configured in Settings and Styles tabs.
            </p>

            <div className="space-y-6 bg-white p-8 border border-blart-stone/30">
              {/* Mode */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-blart-dim mb-2">Mode</label>
                <div className="flex gap-2">
                  {(['single', 'batch'] as const).map(m => (
                    <button key={m} onClick={() => setGenMode(m)}
                      className={`px-4 py-2 text-sm border ${genMode === m ? 'bg-blart-black text-white border-blart-black' : 'border-blart-stone/50 text-blart-dim hover:border-blart-black'}`}>
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Style */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-blart-dim mb-2">
                  Style {genMode === 'batch' && '(leave empty to rotate all)'}
                </label>
                <select value={genStyleId} onChange={(e) => setGenStyleId(e.target.value)}
                  className="w-full px-4 py-3 border border-blart-stone/50 bg-white text-sm focus:outline-none focus:border-blart-black">
                  <option value="">All styles (rotate)</option>
                  {genStyles.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {/* Orientation */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-blart-dim mb-2">Orientation</label>
                <select value={genOrientation} onChange={(e) => setGenOrientation(e.target.value)}
                  className="w-full px-4 py-3 border border-blart-stone/50 bg-white text-sm focus:outline-none focus:border-blart-black">
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
                  <textarea value={genCustomPrompt} onChange={(e) => setGenCustomPrompt(e.target.value)} rows={3}
                    placeholder="Additional guidance for this specific generation..."
                    className="w-full px-4 py-3 border border-blart-stone/50 bg-white text-sm focus:outline-none focus:border-blart-black resize-none" />
                </div>
              )}

              {/* Count (batch mode) */}
              {genMode === 'batch' && (
                <div>
                  <label className="block text-xs uppercase tracking-wider text-blart-dim mb-2">Count (max 50)</label>
                  <input type="number" value={genCount}
                    onChange={(e) => setGenCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                    min={1} max={50}
                    className="w-full px-4 py-3 border border-blart-stone/50 bg-white text-sm font-mono focus:outline-none focus:border-blart-black" />
                </div>
              )}

              {/* Auto-publish */}
              <div className="flex items-center gap-3">
                <input type="checkbox" id="autoPublish" checked={genAutoPublish}
                  onChange={(e) => setGenAutoPublish(e.target.checked)} className="w-4 h-4" />
                <label htmlFor="autoPublish" className="text-sm text-blart-dim">Auto-publish (skip review)</label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {genMode === 'single' && (
                  <button onClick={handlePreview} disabled={previewing || generating || !genStyleId}
                    className={`flex-1 py-4 text-sm tracking-wider uppercase transition-colors border ${
                      previewing ? 'border-blart-stone/50 text-blart-ash cursor-wait' : 'border-blart-black text-blart-black hover:bg-blart-black hover:text-white'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}>
                    {previewing ? 'Previewing...' : 'Preview'}
                  </button>
                )}
                <button onClick={handleGenerate} disabled={generating || previewing || (genMode === 'single' && !genStyleId)}
                  className={`flex-1 py-4 text-sm tracking-wider uppercase transition-colors ${
                    generating ? 'bg-blart-ash text-white cursor-wait' : 'bg-blart-black text-white hover:bg-blart-dim'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}>
                  {generating
                    ? genMode === 'batch' ? `Generating ${genCount} artworks...` : 'Generating...'
                    : genMode === 'batch' ? `Generate ${genCount} artworks` : 'Generate & Save'}
                </button>
              </div>
            </div>

            {/* Preview Result */}
            {previewResult && (
              <div className="mt-6 bg-white p-6 border border-blart-stone/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm uppercase tracking-wider text-blart-dim">Preview</h3>
                  <span className="text-xs text-blart-ash">Not saved — click Generate & Save to keep</span>
                </div>
                {previewResult.image_data_url
                  ? <img src={previewResult.image_data_url} alt="Preview" className="w-full border border-blart-stone/30" />
                  : <p className="text-red-600 text-sm">{previewResult.error}</p>
                }
              </div>
            )}

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
                    <img src={genResults.image_url || ''} alt={genResults.title} className="w-32 h-32 object-cover border border-blart-stone/30" />
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

        {/* ARTWORK TABS — Review, Published, Archived */}
        {(tab === 'review' || tab === 'published' || tab === 'archived') && (
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
                  <button onClick={() => setTab('generate')} className="mt-4 text-sm underline hover:text-blart-black">
                    Generate some →
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {artworks.map((artwork) => (
                  <div key={artwork.id} className="bg-white border border-blart-stone/30 group">
                    <div className="aspect-square overflow-hidden bg-blart-cream">
                      <img src={artwork.image_url} alt={artwork.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-display truncate">{artwork.title}</p>
                      <p className="text-xs text-blart-dim mt-0.5">{artwork.art_styles?.name || 'Unknown'} · {artwork.orientation}</p>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {tab === 'review' && (
                          <>
                            <button onClick={() => updateArtwork(artwork.id, { status: 'published' })}
                              className="px-2.5 py-1 text-xs bg-green-700 text-white hover:bg-green-800 transition-colors">Publish</button>
                            <button onClick={() => updateArtwork(artwork.id, { status: 'archived' })}
                              className="px-2.5 py-1 text-xs bg-blart-ash text-white hover:bg-blart-dim transition-colors">Archive</button>
                          </>
                        )}
                        {tab === 'published' && (
                          <>
                            <button onClick={() => updateArtwork(artwork.id, { is_featured: !artwork.is_featured })}
                              className={`px-2.5 py-1 text-xs border transition-colors ${artwork.is_featured ? 'bg-amber-600 text-white border-amber-600' : 'border-blart-stone/50 text-blart-dim hover:border-blart-black'}`}>
                              {artwork.is_featured ? '★ Featured' : '☆ Feature'}
                            </button>
                            <button onClick={() => updateArtwork(artwork.id, { status: 'archived' })}
                              className="px-2.5 py-1 text-xs border border-blart-stone/50 text-blart-dim hover:border-blart-black transition-colors">Archive</button>
                          </>
                        )}
                        {tab === 'archived' && (
                          <>
                            <button onClick={() => updateArtwork(artwork.id, { status: 'published' })}
                              className="px-2.5 py-1 text-xs bg-green-700 text-white hover:bg-green-800 transition-colors">Publish</button>
                            <button onClick={() => updateArtwork(artwork.id, { status: 'review' })}
                              className="px-2.5 py-1 text-xs border border-blart-stone/50 text-blart-dim hover:border-blart-black transition-colors">→ Review</button>
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