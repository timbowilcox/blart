import { NextRequest, NextResponse } from 'next/server';
import { generateArtwork, batchGenerate, getGenerationStyles, previewArtwork, DEFAULT_BASE_PROMPT } from '@/lib/generate';

function isAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  const adminSecret = process.env.ADMIN_SECRET;
  return !!adminSecret && authHeader === `Bearer ${adminSecret}`;
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const styles = await getGenerationStyles();
  return NextResponse.json({ styles, default_base_prompt: DEFAULT_BASE_PROMPT });
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const {
    mode = 'single',
    style_id,
    orientation,
    custom_prompt,
    reference_notes,
    auto_publish = false,
    count = 10,
    base_prompt_override,
    inspiration_images,
  } = body;

  // Preview mode: generate image but don't save to DB or storage
  if (mode === 'preview') {
    if (!style_id) {
      return NextResponse.json({ error: 'style_id required for preview' }, { status: 400 });
    }

    const result = await previewArtwork(style_id, {
      customPrompt: custom_prompt,
      orientation,
      referenceNotes: reference_notes,
      basePromptOverride: base_prompt_override,
      inspirationImages: inspiration_images,
    });

    return NextResponse.json(result);
  }

  if (mode === 'single') {
    if (!style_id) {
      return NextResponse.json({ error: 'style_id required for single generation' }, { status: 400 });
    }

    const result = await generateArtwork(style_id, {
      customPrompt: custom_prompt,
      orientation,
      referenceNotes: reference_notes,
      autoPublish: auto_publish,
      basePromptOverride: base_prompt_override,
      inspirationImages: inspiration_images,
    });

    return NextResponse.json(result);
  }

  if (mode === 'batch') {
    const batchCount = Math.min(Math.max(1, count), 50);

    const { results, summary } = await batchGenerate(batchCount, {
      styleId: style_id,
      orientation,
      autoPublish: auto_publish,
      basePromptOverride: base_prompt_override,
    });

    return NextResponse.json({ results, summary });
  }

  return NextResponse.json({ error: 'Invalid mode. Use "single", "batch", or "preview".' }, { status: 400 });
}