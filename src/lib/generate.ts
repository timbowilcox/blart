import { supabaseAdmin } from './supabase';
import type { ArtStyle } from './supabase';

// --- Google Gemini (Nano Banana) Image Generation ---

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent';

interface GenerationRequest {
  style_id: string;
  style_name: string;
  prompt_prefix: string;
  custom_prompt?: string;
  orientation?: 'portrait' | 'landscape' | 'square';
  reference_notes?: string;
  reference_images?: string[];
}

interface GenerationResult {
  success: boolean;
  artwork_id?: string;
  title?: string;
  slug?: string;
  error?: string;
}

const STYLE_ENHANCERS: Record<string, string[]> = {
  abstract: [
    'bold color fields and organic shapes',
    'layered textures with dripping paint effects',
    'geometric fragments dissolving into chaos',
    'vibrant acrylic splashes on raw canvas',
    'meditative color gradients with subtle texture',
  ],
  geometric: [
    'precise tessellations in warm earth tones',
    'overlapping translucent polygons',
    'isometric impossible architecture',
    'sacred geometry with gold leaf accents',
    'minimalist line compositions with negative space',
  ],
  landscapes: [
    'misty mountain valley at golden hour',
    'vast desert dunes under starlight',
    'tropical coast with turquoise water',
    'snow-covered forest in soft morning light',
    'rolling hills with dramatic storm clouds',
  ],
  botanical: [
    'oversized tropical leaves in close-up detail',
    'delicate wildflower arrangement on dark background',
    'lush monstera and palm fronds',
    'dried flower still life in muted palette',
    'intricate fern patterns with dew drops',
  ],
  portraits: [
    'ethereal figure emerging from abstract color',
    'silhouette with double exposure landscape',
    'contemporary portrait with bold color blocking',
    'dreamlike face composed of natural elements',
    'fragmented figure in cubist style',
  ],
  celestial: [
    'deep space nebula in vivid ultraviolet',
    'ringed planet rising over alien terrain',
    'cosmic dust clouds in gold and teal',
    'star field with bioluminescent auroras',
    'eclipse casting light through crystalline structures',
  ],
  'ocean-water': [
    'deep underwater bioluminescence',
    'crashing wave frozen in crystal detail',
    'abstract ocean currents in blue and silver',
    'coral reef teeming with color',
    'calm tide pool reflections at sunset',
  ],
  minimalist: [
    'single line drawing on textured paper',
    'two-tone composition with subtle gradient',
    'negative space study with one focal point',
    'simple circle and shadow on warm background',
    'thin horizontal bands in muted palette',
  ],
  texture: [
    'cracked earth with golden veins',
    'weathered wood grain in extreme close-up',
    'marble surface with dramatic veining',
    'rust and patina on aged metal',
    'layered paper torn to reveal colors beneath',
  ],
  surreal: [
    'melting clocks in a desert landscape',
    'floating islands connected by waterfalls',
    'rooms defying gravity with impossible stairs',
    'objects scaled absurdly large in normal settings',
    'dreamscape merging ocean floor with sky',
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
  if (Math.random() > 0.4) {
    return `${base} ${pickRandom(suffixes)}`;
  }
  return base;
}

function generateDescription(styleSlug: string, title: string): string {
  const descriptions: Record<string, string[]> = {
    abstract: [
      'A study in form and colour that invites contemplation.',
      'Bold gestural marks create a dialogue between chaos and order.',
      'Layers of pigment build a rich, textural surface that rewards close viewing.',
    ],
    geometric: [
      'Precise mathematical forms create a harmonious visual rhythm.',
      'Clean lines and careful proportions produce a meditative composition.',
      'An exploration of symmetry and balance through geometric abstraction.',
    ],
    landscapes: [
      'A dreamlike vista that captures the essence of untouched wilderness.',
      'Light and atmosphere converge in this sweeping natural panorama.',
      "An AI interpretation of nature's grandeur, both familiar and otherworldly.",
    ],
    botanical: [
      'Intricate organic forms reveal the hidden beauty of the natural world.',
      'A celebration of botanical elegance rendered in vivid detail.',
      "Nature's patterns and textures take centre stage in this intimate study.",
    ],
    portraits: [
      'A contemporary figure study that blurs the line between identity and abstraction.',
      'Human presence emerges from and dissolves into the surrounding composition.',
      'An exploration of the self through the lens of algorithmic creativity.',
    ],
    celestial: [
      'Cosmic phenomena rendered with otherworldly beauty and scale.',
      'The vastness of space distilled into a mesmerising visual experience.',
      'Stellar formations and celestial light create an immersive cosmic portrait.',
    ],
    'ocean-water': [
      'The fluid dynamics of water captured in a single transcendent moment.',
      'Deep marine blues and aquatic light create an immersive underwater world.',
      'Ocean energy and tranquility coexist in this aquatic composition.',
    ],
    minimalist: [
      'Restrained elegance — every element exists with deliberate purpose.',
      'A meditation on negative space and the beauty of simplicity.',
      'Stripped to its essence, the composition speaks through what it leaves out.',
    ],
    texture: [
      'Surface, material, and light interact to create a tactile visual experience.',
      'Macro-scale textures reveal hidden landscapes within everyday materials.',
      'An intimate exploration of surface and substance.',
    ],
    surreal: [
      'Reality bends and transforms in this dreamlike visual narrative.',
      'Familiar elements are reimagined in impossible, captivating arrangements.',
      'A window into a world where the laws of physics are merely suggestions.',
    ],
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
    geometric: [['#003049', '#D62828', '#F77F00', '#FCBF49'], ['#2B2D42', '#8D99AE', '#EDF2F4', '#EF233C'], ['#606C38', '#283618', '#FEFAE0', '#DDA15E']],
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
  } catch {
    return null;
  }
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

  const parts = [
    'Generate an original fine art image.',
    req.prompt_prefix,
    enhancer,
    req.custom_prompt || '',
    orientationGuide[req.orientation || 'portrait'],
    req.reference_notes || '',
    'Fine art quality, suitable for large format printing. High resolution, rich detail, museum-worthy. No text, watermarks, signatures, or borders.',
  ];

  if (req.reference_images && req.reference_images.length > 0) {
    parts.push('Use the provided reference images as style and mood inspiration. Create a new original artwork inspired by the aesthetic qualities shown.');
  }

  return parts.filter(Boolean).join('. ');
}

export async function generateArtwork(
  styleId: string,
  options: {
    customPrompt?: string;
    orientation?: 'portrait' | 'landscape' | 'square';
    referenceNotes?: string;
    autoPublish?: boolean;
  } = {}
): Promise<GenerationResult> {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return { success: false, error: 'GOOGLE_API_KEY environment variable not set' };
    }

    const { data: style, error: styleError } = await supabaseAdmin
      .from('art_styles')
      .select('*')
      .eq('id', styleId)
      .single();

    if (styleError || !style) {
      return { success: false, error: `Style not found: ${styleId}` };
    }

    const styleSlug = style.slug;
    const orientation = options.orientation || pickRandom(['portrait', 'landscape', 'square'] as const);

    const referenceImageUrls: string[] = style.reference_images || [];

    const prompt = buildGenerationPrompt({
      style_id: styleId,
      style_name: style.name,
      prompt_prefix: style.prompt_prefix || `Create a ${style.name.toLowerCase()} artwork`,
      custom_prompt: options.customPrompt,
      orientation,
      reference_notes: options.referenceNotes,
      reference_images: referenceImageUrls,
    });

    const parts: any[] = [{ text: prompt }];

    for (const imgUrl of referenceImageUrls.slice(0, 3)) {
      const imgData = await fetchImageAsBase64(imgUrl);
      if (imgData) {
        parts.push({
          inline_data: {
            mime_type: imgData.mimeType,
            data: imgData.data,
          },
        });
      }
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Gemini API error: ${response.status} - ${errorText}` };
    }

    const result = await response.json();

    const candidates = result.candidates;
    if (!candidates || candidates.length === 0) {
      const blockReason = result.promptFeedback?.blockReason;
      return { success: false, error: blockReason ? `Generation blocked: ${blockReason}` : 'No candidates in response' };
    }

    const responseParts = candidates[0].content?.parts || [];
    const imagePart = responseParts.find((p: any) => p.inlineData);

    if (!imagePart || !imagePart.inlineData) {
      const textPart = responseParts.find((p: any) => p.text);
      const debugText = textPart?.text || 'unknown';
      return { success: false, error: `No image in response. Model said: ${debugText.substring(0, 200)}` };
    }

    const imageBase64 = imagePart.inlineData.data;
    const mediaType = imagePart.inlineData.mimeType || 'image/png';

    if (!imageBase64) {
      return { success: false, error: 'No image data in response' };
    }

    const timestamp = Date.now();
    const ext = mediaType.includes('jpeg') || mediaType.includes('jpg') ? 'jpg' : 'png';
    const fileName = `${styleSlug}/${timestamp}.${ext}`;

    const imageBuffer = Buffer.from(imageBase64, 'base64');
    const { error: uploadError } = await supabaseAdmin.storage
      .from('artworks')
      .upload(fileName, imageBuffer, {
        contentType: mediaType,
        upsert: false,
      });

    if (uploadError) {
      return { success: false, error: `Upload failed: ${uploadError.message}` };
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('artworks')
      .getPublicUrl(fileName);

    const imageUrl = urlData.publicUrl;

    const title = generateTitle(styleSlug);
    const description = generateDescription(styleSlug, title);
    const tags = generateTags(styleSlug);
    const colors = generateColors(styleSlug);

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      + '-' + timestamp.toString(36);

    const status = options.autoPublish ? 'published' : 'review';

    const { data: artwork, error: insertError } = await supabaseAdmin
      .from('artworks')
      .insert({
        title,
        slug,
        description,
        image_url: imageUrl,
        image_4k_url: imageUrl,
        thumbnail_url: imageUrl,
        style_id: styleId,
        tags,
        colors,
        orientation,
        width_px: orientation === 'landscape' ? 3840 : orientation === 'square' ? 3840 : 2560,
        height_px: orientation === 'landscape' ? 2560 : orientation === 'square' ? 3840 : 3840,
        generation_prompt: prompt,
        generation_model: 'gemini-2.5-flash-image',
        status,
        published_at: status === 'published' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (insertError) {
      return { success: false, error: `Database insert failed: ${insertError.message}` };
    }

    return {
      success: true,
      artwork_id: artwork.id,
      title: artwork.title,
      slug: artwork.slug,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown generation error' };
  }
}

export async function batchGenerate(
  count: number,
  options: {
    styleId?: string;
    orientation?: 'portrait' | 'landscape' | 'square';
    autoPublish?: boolean;
  } = {}
): Promise<{ results: GenerationResult[]; summary: { success: number; failed: number } }> {
  let styleIds: string[] = [];

  if (options.styleId) {
    styleIds = [options.styleId];
  } else {
    const { data: styles } = await supabaseAdmin
      .from('art_styles')
      .select('id')
      .eq('is_active', true);
    styleIds = (styles || []).map((s: any) => s.id);
  }

  if (styleIds.length === 0) {
    return { results: [], summary: { success: 0, failed: 0 } };
  }

  const results: GenerationResult[] = [];
  let success = 0;
  let failed = 0;

  for (let i = 0; i < count; i++) {
    const styleId = styleIds[i % styleIds.length];
    const orientation = options.orientation || pickRandom(['portrait', 'landscape', 'square'] as const);

    const result = await generateArtwork(styleId, {
      orientation,
      autoPublish: options.autoPublish || false,
    });

    results.push(result);
    if (result.success) success++;
    else failed++;

    if (i < count - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return { results, summary: { success, failed } };
}

export async function getGenerationStyles(): Promise<ArtStyle[]> {
  const { data } = await supabaseAdmin
    .from('art_styles')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  return data || [];
}