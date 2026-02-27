import { supabaseAdmin } from './supabase';
import type { ArtStyle } from './supabase';

// --- Google Gemini 3.1 Flash Image ---

const GEMINI_MODEL = 'gemini-3.1-flash-image-preview';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ============================================================
// BASE PROMPT - Applied to ALL image generations regardless of style
// ============================================================
export const DEFAULT_BASE_PROMPT = `You are an elite fine art creator producing original artwork for a premium digital art gallery called "Blart". 

Every piece must be:
- Museum-quality fine art suitable for large format printing on canvas or archival paper
- Richly detailed with intentional composition, lighting, and color harmony
- Original and distinctive — never generic, stock-photo-like, or clip-art style
- Free of any text, watermarks, signatures, borders, frames, or UI elements
- Emotionally evocative and visually striking — the kind of art that makes people stop and stare

The artwork should feel like it belongs in a curated contemporary art gallery. Think bold artistic choices, masterful use of color and light, and compositions that reward close viewing. Each piece should have a clear focal point and sense of depth.`;

interface GenerationRequest {
  style_id: string;
  style_name: string;
  prompt_prefix: string;
  custom_prompt?: string;
  orientation?: 'portrait' | 'landscape' | 'square';
  reference_notes?: string;
  reference_images?: string[];
  inspiration_images?: string[];
  base_prompt?: string;
}

interface GenerationResult {
  success: boolean;
  artwork_id?: string;
  title?: string;
  slug?: string;
  image_url?: string;
  error?: string;
}

const STYLE_ENHANCERS: Record<string, string[]> = {
  abstract: [
    'bold color fields and organic shapes with impasto texture',
    'layered textures with dripping paint effects and raw energy',
    'geometric fragments dissolving into expressive chaos',
    'vibrant acrylic splashes on raw canvas with gestural marks',
    'meditative color gradients with subtle texture and depth',
  ],
  geometric: [
    'precise tessellations in warm earth tones with metallic accents',
    'overlapping translucent polygons creating luminous depth',
    'isometric impossible architecture with dramatic shadows',
    'sacred geometry with gold leaf accents on deep backgrounds',
    'minimalist line compositions with negative space and one bold color',
  ],
  landscapes: [
    'misty mountain valley at golden hour with atmospheric perspective',
    'vast desert dunes under starlight with deep shadows',
    'tropical coast with turquoise water and dramatic sky',
    'snow-covered forest in soft morning light filtering through trees',
    'rolling hills with dramatic storm clouds and shafts of light',
  ],
  botanical: [
    'oversized tropical leaves in close-up detail with water droplets',
    'delicate wildflower arrangement on dark moody background',
    'lush monstera and palm fronds in rich emerald tones',
    'dried flower still life in muted palette with soft directional light',
    'intricate fern patterns with dew drops and bokeh background',
  ],
  portraits: [
    'ethereal figure emerging from abstract color and light',
    'silhouette with double exposure landscape and cosmic elements',
    'contemporary portrait with bold color blocking and geometric overlay',
    'dreamlike face composed of natural elements like flowers and water',
    'fragmented figure in cubist style with rich jewel tones',
  ],
  celestial: [
    'deep space nebula in vivid ultraviolet and magenta',
    'ringed planet rising over alien terrain with bioluminescent flora',
    'cosmic dust clouds in gold and teal with stellar nursery',
    'star field with bioluminescent auroras and reflection',
    'eclipse casting light through crystalline structures in space',
  ],
  'ocean-water': [
    'deep underwater bioluminescence with ethereal jellyfish',
    'crashing wave frozen in crystal detail with spray and foam',
    'abstract ocean currents in blue and silver with depth',
    'coral reef teeming with color and tropical fish',
    'calm tide pool reflections at sunset with perfect mirror',
  ],
  minimalist: [
    'single continuous line drawing on textured handmade paper',
    'two-tone composition with subtle gradient and one accent',
    'negative space study with one powerful focal point',
    'simple circle and shadow on warm textured background',
    'thin horizontal bands in muted palette suggesting landscape',
  ],
  texture: [
    'cracked earth with golden veins of kintsugi repair',
    'weathered wood grain in extreme close-up with rich patina',
    'marble surface with dramatic veining in moody lighting',
    'rust and patina on aged metal with beautiful decay',
    'layered paper torn to reveal vivid colors beneath',
  ],
  surreal: [
    'melting clocks in a desert landscape with long shadows',
    'floating islands connected by waterfalls against starry sky',
    'rooms defying gravity with impossible stairs and doorways',
    'objects scaled absurdly large in miniature settings',
    'dreamscape merging ocean floor with sky and clouds',
  ],
};

const TITLE_THEMES: Record<string, string[]> = {
  abstract: ['Resonance', 'Convergence', 'Pulse', 'Drift', 'Fracture', 'Bloom', 'Threshold', 'Echo', 'Flux', 'Veil'],
  geometric: ['Lattice', 'Vertex', 'Prism', 'Tessellation', 'Axis', 'Meridian', 'Grid', 'Facet', 'Vector', 'Form'],
  landscapes: ['Horizon', 'Valley', 'Ridge', 'Stillness', 'Passage', 'Clearing', 'Solitude', 'Expanse', 'Dawn', 'Dusk'],
  botanical: ['Petal', 'Root', 'Canopy', 'Bloom', 'Tendril', 'Spore', 'Frond', 'Seed', 'Thorn', 'Moss'],
  portraits: ['Gaze', 'Presence', 'Shadow Self', 'Inner Light', 'Fragment', 'Reverie', 'Essence', 'Visage', 'Aura', 'Mask'],
  celestial: ['Nova', 'Orbit', 'Eclipse', 'Nebula', 'Void', 'Astral', 'Corona', 'Zenith', 'Solstice', 'Pulsar'],
  'ocean-water': ['Tide', 'Depth', 'Current', 'Undertow', 'Swell', 'Reef', 'Abyss', 'Surface', 'Shimmer', 'Riptide'],
  minimalist: ['Silence', 'Breath', 'Pause', 'Interval', 'Space', 'Line', 'Rest', 'Void', 'Calm', 'Still'],
  texture: ['Grain', 'Patina', 'Layer', 'Surface', 'Weave', 'Erosion', 'Sediment', 'Fiber', 'Stratum', 'Crust'],
  surreal: ['Paradox', 'Liminal', 'Threshold', 'Mirage', 'Anomaly', 'Reverie', 'Alchemy', 'Chimera', 'Enigma', 'Portal'],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateTitle(styleSlug: string): string {
  const themes = TITLE_THEMES[styleSlug] || TITLE_THEMES.abstract;
  const base = pickRandom(themes);
  const suffixes = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'No. 1', 'No. 2', 'No. 3', 'No. 4', 'No. 5', 'in Blue', 'in Gold', 'in Shadow', 'at Dawn', 'at Dusk', 'Ascending', 'Descending', 'Unfurling', 'Dissolving', 'Emerging'];
  if (Math.random() > 0.4) return `${base} ${pickRandom(suffixes)}`;
  return base;
}

function generateDescription(styleSlug: string, title: string): string {
  const descriptions: Record<string, string[]> = {
    abstract: ['A study in form and colour that invites contemplation.', 'Bold gestural marks create a dialogue between chaos and order.', 'Layers of pigment build a rich, textural surface that rewards close viewing.'],
    geometric: ['Precise mathematical forms create a harmonious visual rhythm.', 'Clean lines and careful proportions produce a meditative composition.', 'An exploration of symmetry and balance through geometric abstraction.'],
    landscapes: ['A dreamlike vista that captures the essence of untouched wilderness.', 'Light and atmosphere converge in this sweeping natural panorama.', "An AI interpretation of nature's grandeur, both familiar and otherworldly."],
    botanical: ['Intricate organic forms reveal the hidden beauty of the natural world.', 'A celebration of botanical elegance rendered in vivid detail.', "Nature's patterns and textures take centre stage in this intimate study."],
    portraits: ['A contemporary figure study that blurs the line between identity and abstraction.', 'Human presence emerges from and dissolves into the surrounding composition.', 'An exploration of the self through the lens of algorithmic creativity.'],
    celestial: ['Cosmic phenomena rendered with otherworldly beauty and scale.', 'The vastness of space distilled into a mesmerising visual experience.', 'Stellar formations and celestial light create an immersive cosmic portrait.'],
    'ocean-water': ['The fluid dynamics of water captured in a single transcendent moment.', 'Deep marine blues and aquatic light create an immersive underwater world.', 'Ocean energy and tranquility coexist in this aquatic composition.'],
    minimalist: ['Restrained elegance — every element exists with deliberate purpose.', 'A meditation on negative space and the beauty of simplicity.', 'Stripped to its essence, the composition speaks through what it leaves out.'],
    texture: ['Surface, material, and light interact to create a tactile visual experience.', 'Macro-scale textures reveal hidden landscapes within everyday materials.', 'An intimate exploration of surface and substance.'],
    surreal: ['Reality bends and transforms in this dreamlike visual narrative.', 'Familiar elements are reimagined in impossible, captivating arrangements.', 'A window into a world where the laws of physics are merely suggestions.'],
  };
  const pool = descriptions[styleSlug] || descriptions.abstract;
  return pickRandom(pool);
}

function generateTags(styleSlug: string): string[] {
  const baseTags = ['ai-art', 'digital-art', 'wall-art', 'print'];
  const styleTags: Record<string, string[]> = {
    abstract: ['abstract', 'contemporary', 'modern-art', 'color-field', 'expressionism'],
    geometric: ['geometric', 'pattern', 'symmetry', 'mathematical', 'modern'],
    landscapes: ['landscape', 'nature', 'scenic', 'wilderness', 'environment'],
    botanical: ['botanical', 'plants', 'nature', 'floral', 'organic'],
    portraits: ['portrait', 'figure', 'human', 'face', 'identity'],
    celestial: ['space', 'cosmic', 'stars', 'universe', 'astronomy'],
    'ocean-water': ['ocean', 'water', 'marine', 'aquatic', 'sea'],
    minimalist: ['minimal', 'clean', 'simple', 'modern', 'zen'],
    texture: ['texture', 'material', 'surface', 'macro', 'detail'],
    surreal: ['surreal', 'dreamlike', 'fantasy', 'imagination', 'otherworldly'],
  };
  const extras = styleTags[styleSlug] || styleTags.abstract;
  const picked = extras.sort(() => Math.random() - 0.5).slice(0, 2 + Math.floor(Math.random() * 2));
  return [...baseTags, ...picked];
}

function generateColors(styleSlug: string): string[] {
  const palettes: Record<string, string[][]> = {
    abstract: [['#E63946', '#F1FAEE', '#457B9D', '#1D3557'], ['#FF6B6B', '#FEC89A', '#B5838D', '#6D6875'], ['#264653', '#2A9D8F', '#E9C46A', '#F4A261']],
    geometric: [['#003049', '#D62828', '#F77F00', '#FCBF49'], ['#2B2D42', '#8D99AE', '#EDF2F4', '#EF233C'], ['#606C38', '#283618', '#FEFAE0', '#DDA15E'], ['#606C38', '#283618', '#FEFAE0', '#DDA15E']],
    landscapes: [['#606C38', '#283618', '#FEFAE0', '#DDA15E'], ['#0077B6', '#00B4D8', '#90E0EF', '#CAF0F8'], ['#5F0F40', '#9A031E', '#FB8B24', '#E36414']],
    botanical: [['#386641', '#6A994E', '#A7C957', '#F2E8CF'], ['#3D405B', '#E07A5F', '#F4F1DE', '#81B29A'], ['#2D6A4F', '#40916C', '#52B788', '#B7E4C7']],
    portraits: [['#353535', '#3C6E71', '#FFFFFF', '#D9D9D9'], ['#6B2737', '#C97C5D', '#E8D6CB', '#B7B7A4'], ['#0D1B2A', '#1B263B', '#415A77', '#778DA9']],
    celestial: [['#03071E', '#370617', '#6A040F', '#9D0208'], ['#10002B', '#240046', '#3C096C', '#7B2CBF'], ['#0D1B2A', '#1B263B', '#415A77', '#E0E1DD']],
    'ocean-water': [['#03045E', '#0077B6', '#00B4D8', '#90E0EF'], ['#005F73', '#0A9396', '#94D2BD', '#E9D8A6'], ['#184E77', '#1E6091', '#1A759F', '#76C893']],
    minimalist: [['#F5F5F5', '#E0E0E0', '#333333', '#FFFFFF'], ['#FAF9F6', '#C4A77D', '#000000', '#F0EAD6'], ['#FEFEFE', '#9B9B9B', '#2C2C2C', '#F5F5F0']],
    texture: [['#A68A64', '#936639', '#7F5539', '#582F0E'], ['#D5C6B0', '#B7B09C', '#8C8474', '#5E574D'], ['#DEB887', '#D2B48C', '#BC8F8F', '#8B7355']],
    surreal: [['#FF006E', '#8338EC', '#3A86FF', '#FFBE0B'], ['#7400B8', '#6930C3', '#5390D9', '#48BFE3'], ['#F72585', '#B5179E', '#7209B7', '#560BAD']],
  };
  const options = palettes[styleSlug] || palettes.abstract;
  return pickRandom(options);
}

async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const contentType = response.headers.get('content-type') || 'image/png';
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return { data: base64, mimeType: contentType };
  } catch { return null; }
}

function buildGenerationPrompt(req: GenerationRequest): string {
  const styleSlug = req.style_name.toLowerCase().replace(/[^a-z-]/g, '').replace(/\s+/g, '-');
  const enhancers = STYLE_ENHANCERS[styleSlug] || STYLE_ENHANCERS.abstract;
  const enhancer = pickRandom(enhancers);
  const orientationGuide = {
    portrait: 'vertical composition, taller than wide, portrait orientation, aspect ratio 2:3',
    landscape: 'horizontal composition, wider than tall, landscape orientation, aspect ratio 3:2',
    square: 'square composition, equal width and height, aspect ratio 1:1',
  };
  const basePrompt = req.base_prompt || DEFAULT_BASE_PROMPT;
  const parts = [
    basePrompt,
    `\nStyle direction: ${req.prompt_prefix}`,
    `Visual approach: ${enhancer}`,
    req.custom_prompt ? `Additional direction: ${req.custom_prompt}` : '',
    `Composition: ${orientationGuide[req.orientation || 'portrait']}`,
    req.reference_notes || '',
  ];
  if ((req.reference_images && req.reference_images.length > 0) || (req.inspiration_images && req.inspiration_images.length > 0)) {
    parts.push('Use the provided reference images as style and mood inspiration. Create a new original artwork inspired by the aesthetic qualities, color palette, and artistic techniques shown in the references.');
  }
  return parts.filter(Boolean).join('\n');
}

async function callGemini(prompt: string, imageParts: any[], apiKey: string) {
  const parts: any[] = [{ text: prompt }, ...imageParts];
  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseModalities: ['TEXT', 'IMAGE'] } }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }
  return response.json();
}

// Load the persisted base prompt from site_settings, falling back to DEFAULT_BASE_PROMPT
export async function getPersistedBasePrompt(): Promise<string> {
  try {
    const { data } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'base_prompt')
      .single();
    return data?.value || DEFAULT_BASE_PROMPT;
  } catch {
    return DEFAULT_BASE_PROMPT;
  }
}

export async function previewArtwork(
  styleId: string,
  options: { customPrompt?: string; orientation?: 'portrait' | 'landscape' | 'square'; referenceNotes?: string; basePromptOverride?: string; inspirationImages?: string[]; } = {}
): Promise<{ success: boolean; image_data_url?: string; prompt?: string; error?: string }> {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) return { success: false, error: 'GOOGLE_API_KEY environment variable not set' };
    const { data: style, error: styleError } = await supabaseAdmin.from('art_styles').select('*').eq('id', styleId).single();
    if (styleError || !style) return { success: false, error: `Style not found: ${styleId}` };
    const orientation = options.orientation || 'square';

    // Load persisted base prompt if no override provided
    const basePrompt = options.basePromptOverride || await getPersistedBasePrompt();

    // Use style's persistent reference images (moodboard)
    const referenceImageUrls: string[] = style.reference_images || [];

    const prompt = buildGenerationPrompt({
      style_id: styleId, style_name: style.name,
      prompt_prefix: style.prompt_prefix || `Create a ${style.name.toLowerCase()} artwork`,
      custom_prompt: options.customPrompt, orientation, reference_notes: options.referenceNotes,
      reference_images: referenceImageUrls,
      base_prompt: basePrompt, inspiration_images: options.inspirationImages,
    });
    const imageParts: any[] = [];

    // Include style's persistent reference images (moodboard)
    for (const imgUrl of referenceImageUrls.slice(0, 3)) {
      const imgData = await fetchImageAsBase64(imgUrl);
      if (imgData) imageParts.push({ inline_data: { mime_type: imgData.mimeType, data: imgData.data } });
    }

    // Include any per-session inspiration images
    if (options.inspirationImages) {
      for (const imgDataUrl of options.inspirationImages.slice(0, 3)) {
        const match = imgDataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (match) imageParts.push({ inline_data: { mime_type: match[1], data: match[2] } });
      }
    }
    const result = await callGemini(prompt, imageParts, apiKey);
    const candidates = result.candidates;
    if (!candidates || candidates.length === 0) {
      const blockReason = result.promptFeedback?.blockReason;
      return { success: false, error: blockReason ? `Generation blocked: ${blockReason}` : 'No candidates in response' };
    }
    const responseParts = candidates[0].content?.parts || [];
    const imagePart = responseParts.find((p: any) => p.inlineData);
    if (!imagePart?.inlineData) {
      const textPart = responseParts.find((p: any) => p.text);
      return { success: false, error: `No image in response. Model said: ${(textPart?.text || 'unknown').substring(0, 200)}` };
    }
    const mediaType = imagePart.inlineData.mime_type || 'image/png';
    return { success: true, image_data_url: `data:${mediaType};base64,${imagePart.inlineData.data}`, prompt };
  } catch (err: any) { return { success: false, error: err.message || 'Unknown preview error' }; }
}

export async function generateArtwork(
  styleId: string,
  options: { customPrompt?: string; orientation?: 'portrait' | 'landscape' | 'square'; referenceNotes?: string; autoPublish?: boolean; basePromptOverride?: string; inspirationImages?: string[]; } = {}
): Promise<GenerationResult> {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) return { success: false, error: 'GOOGLE_API_KEY environment variable not set' };
    const { data: style, error: styleError } = await supabaseAdmin.from('art_styles').select('*').eq('id', styleId).single();
    if (styleError || !style) return { success: false, error: `Style not found: ${styleId}` };
    const styleSlug = style.slug;
    const orientation = options.orientation || pickRandom(['portrait', 'landscape', 'square'] as const);
    const referenceImageUrls: string[] = style.reference_images || [];

    // Load persisted base prompt if no override provided
    const basePrompt = options.basePromptOverride || await getPersistedBasePrompt();

    const prompt = buildGenerationPrompt({
      style_id: styleId, style_name: style.name,
      prompt_prefix: style.prompt_prefix || `Create a ${style.name.toLowerCase()} artwork`,
      custom_prompt: options.customPrompt, orientation, reference_images: referenceImageUrls,
      base_prompt: basePrompt, inspiration_images: options.inspirationImages,
    });
    const imageParts: any[] = [];
    for (const imgUrl of referenceImageUrls.slice(0, 3)) {
      const imgData = await fetchImageAsBase64(imgUrl);
      if (imgData) imageParts.push({ inline_data: { mime_type: imgData.mimeType, data: imgData.data } });
    }
    if (options.inspirationImages) {
      for (const imgDataUrl of options.inspirationImages.slice(0, 3)) {
        const match = imgDataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (match) imageParts.push({ inline_data: { mime_type: match[1], data: match[2] } });
      }
    }
    const result = await callGemini(prompt, imageParts, apiKey);
    const candidates = result.candidates;
    if (!candidates || candidates.length === 0) {
      const blockReason = result.promptFeedback?.blockReason;
      return { success: false, error: blockReason ? `Generation blocked: ${blockReason}` : 'No candidates in response' };
    }
    const responseParts = candidates[0].content?.parts || [];
    const imagePart = responseParts.find((p: any) => p.inlineData);
    if (!imagePart?.inlineData) {
      const textPart = responseParts.find((p: any) => p.text);
      return { success: false, error: `No image in response. Model said: ${(textPart?.text || 'unknown').substring(0, 200)}` };
    }
    const imageBase64 = imagePart.inlineData.data;
    const mediaType = imagePart.inlineData.mime_type || 'image/png';
    const timestamp = Date.now();
    const ext = mediaType.includes('jpeg') || mediaType.includes('jpg') ? 'jpg' : 'png';
    const fileName = `${styleSlug}/${timestamp}.${ext}`;
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    const { error: uploadError } = await supabaseAdmin.storage.from('artworks').upload(fileName, imageBuffer, { contentType: mediaType, upsert: false });
    if (uploadError) return { success: false, error: `Upload failed: ${uploadError.message}` };
    const { data: urlData } = supabaseAdmin.storage.from('artworks').getPublicUrl(fileName);
    const imageUrl = urlData.publicUrl;
    const title = generateTitle(styleSlug);
    const description = generateDescription(styleSlug, title);
    const tags = generateTags(styleSlug);
    const colors = generateColors(styleSlug);
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + timestamp.toString(36);
    const status = options.autoPublish ? 'published' : 'review';
    const { data: artwork, error: insertError } = await supabaseAdmin.from('artworks').insert({
      title, slug, description, image_url: imageUrl, image_4k_url: imageUrl, thumbnail_url: imageUrl,
      style_id: styleId, tags, colors, orientation,
      width_px: orientation === 'landscape' ? 3840 : orientation === 'square' ? 3840 : 2560,
      height_px: orientation === 'landscape' ? 2560 : orientation === 'square' ? 3840 : 3840,
      generation_prompt: prompt, generation_model: GEMINI_MODEL, status,
      published_at: status === 'published' ? new Date().toISOString() : null,
    }).select().single();
    if (insertError) return { success: false, error: `Database insert failed: ${insertError.message}` };
    return { success: true, artwork_id: artwork.id, title: artwork.title, slug: artwork.slug, image_url: imageUrl };
  } catch (err: any) { return { success: false, error: err.message || 'Unknown generation error' }; }
}

export async function batchGenerate(
  count: number,
  options: { styleId?: string; orientation?: 'portrait' | 'landscape' | 'square'; autoPublish?: boolean; basePromptOverride?: string; } = {}
): Promise<{ results: GenerationResult[]; summary: { success: number; failed: number } }> {
  let styleIds: string[] = [];
  if (options.styleId) { styleIds = [options.styleId]; }
  else {
    const { data: styles } = await supabaseAdmin.from('art_styles').select('id').eq('is_active', true);
    styleIds = (styles || []).map((s: any) => s.id);
  }
  if (styleIds.length === 0) return { results: [], summary: { success: 0, failed: 0 } };
  const results: GenerationResult[] = [];
  let success = 0; let failed = 0;
  for (let i = 0; i < count; i++) {
    const styleId = styleIds[i % styleIds.length];
    const orientation = options.orientation || pickRandom(['portrait', 'landscape', 'square'] as const);
    const result = await generateArtwork(styleId, { orientation, autoPublish: options.autoPublish || false, basePromptOverride: options.basePromptOverride });
    results.push(result);
    if (result.success) success++; else failed++;
    if (i < count - 1) await new Promise(resolve => setTimeout(resolve, 2000));
  }
  return { results, summary: { success, failed } };
}

export async function getGenerationStyles(): Promise<ArtStyle[]> {
  const { data } = await supabaseAdmin.from('art_styles').select('*').eq('is_active', true).order('sort_order');
  return data || [];
}
