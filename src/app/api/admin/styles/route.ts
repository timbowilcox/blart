import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function isAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  const adminSecret = process.env.ADMIN_SECRET;
  return !!adminSecret && authHeader === `Bearer ${adminSecret}`;
}

// GET /api/admin/styles - List all styles with reference images
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('art_styles')
    .select('*')
    .order('sort_order');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ styles: data });
}

// PATCH /api/admin/styles - Update a style (including reference_images)
export async function PATCH(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'Missing style id' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('art_styles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ style: data });
}

// POST /api/admin/styles/upload - Upload a reference image for a style
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { style_id, image_data_url } = body;

  if (!style_id || !image_data_url) {
    return NextResponse.json({ error: 'Missing style_id or image_data_url' }, { status: 400 });
  }

  // Parse data URL
  const match = image_data_url.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return NextResponse.json({ error: 'Invalid image data URL' }, { status: 400 });
  }

  const mimeType = match[1];
  const base64Data = match[2];
  const ext = mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : 'png';
  const fileName = `reference-images/${style_id}/${Date.now()}.${ext}`;
  const imageBuffer = Buffer.from(base64Data, 'base64');

  // Upload to Supabase Storage
  const { error: uploadError } = await supabaseAdmin.storage
    .from('artworks')
    .upload(fileName, imageBuffer, { contentType: mimeType, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
  }

  const { data: urlData } = supabaseAdmin.storage.from('artworks').getPublicUrl(fileName);
  const imageUrl = urlData.publicUrl;

  // Add URL to style's reference_images array
  const { data: style } = await supabaseAdmin
    .from('art_styles')
    .select('reference_images')
    .eq('id', style_id)
    .single();

  const currentImages: string[] = style?.reference_images || [];
  const updatedImages = [...currentImages, imageUrl];

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('art_styles')
    .update({ reference_images: updatedImages })
    .eq('id', style_id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ style: updated, uploaded_url: imageUrl });
}