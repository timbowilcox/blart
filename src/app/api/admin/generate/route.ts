import { NextRequest, NextResponse } from 'next/server';
import { generateArtwork, batchGenerate, getGenerationStyles } from '@/lib/generate';

function isAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  const adminSecret = process.env.ADMIN_SECRET;
  return !!adminSecret && authHeader === `Bearer ${adminSecret}`;
}

/**
 * POST /api/admin/generate
 * 
 * Generate artwork(s) using the AI engine.
 * 
 * Body:
 *   mode: "single" | "batch"
 *   style_id: string (optional — rotates all styles if omitted)
 *   orientation: "portrait" | "landscape" | "square" (optional — random if omitted)
 *   custom_prompt: string (optional — additional prompt guidance)
 *   reference_notes: string (optional — reference image description)
 *   auto_publish: boolean (default false — sends to review)
 *   count: number (batch mode only, default 10, max 50)
 * 
 * GET /api/admin/generate
 * 
 * Returns available styles for generation.
 */
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const styles = await getGenerationStyles();
  return NextResponse.json({ styles });
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
  } = body;

  if (mode === 'single') {
    if (!style_id) {
      return NextResponse.json({ error: 'style_id required for single generation' }, { status: 400 });
    }

    const result = await generateArtwork(style_id, {
      customPrompt: custom_prompt,
      orientation,
      referenceNotes: reference_notes,
      autoPublish: auto_publish,
    });

    return NextResponse.json(result);
  }

  if (mode === 'batch') {
    const batchCount = Math.min(Math.max(1, count), 50);

    const { results, summary } = await batchGenerate(batchCount, {
      styleId: style_id,
      orientation,
      autoPublish: auto_publish,
    });

    return NextResponse.json({ results, summary });
  }

  return NextResponse.json({ error: 'Invalid mode. Use "single" or "batch".' }, { status: 400 });
}
