import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function isAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  const adminSecret = process.env.ADMIN_SECRET;
  return authHeader === `Bearer ${adminSecret}`;
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const status = request.nextUrl.searchParams.get('status') || 'review';
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');
  const { data, error } = await supabaseAdmin
    .from('artworks')
    .select('*, art_styles(name, slug)')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ artworks: data });
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  const { title, description, image_url, image_4k_url, thumbnail_url, style_id, tags = [], colors = [], orientation = 'portrait', width_px, height_px, generation_prompt, generation_model, status = 'review' } = body;
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
  const { data, error } = await supabaseAdmin
    .from('artworks')
    .insert({ title, slug, description, image_url, image_4k_url, thumbnail_url, style_id, tags, colors, orientation, width_px, height_px, generation_prompt, generation_model, status, published_at: status === 'published' ? new Date().toISOString() : null })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ artwork: data });
}

export async function PATCH(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  const { id, ...updates } = body;
  if (!id) {
    return NextResponse.json({ error: 'Missing artwork id' }, { status: 400 });
  }
  if (updates.status === 'published') {
    updates.published_at = new Date().toISOString();
  }
  const { data, error } = await supabaseAdmin
    .from('artworks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ artwork: data });
}

export async function PUT(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  const { ids, updates } = body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'Missing ids array' }, { status: 400 });
  }
  if (updates.status === 'published') {
    updates.published_at = new Date().toISOString();
  }
  const { error } = await supabaseAdmin
    .from('artworks')
    .update(updates)
    .in('id', ids);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ updated: ids.length });
}

export async function DELETE(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  const { ids } = body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'Missing ids array' }, { status: 400 });
  }
  const { data: toDelete } = await supabaseAdmin
    .from('artworks')
    .select('id, status, image_url')
    .in('id', ids);
  const nonArchived = toDelete?.filter(a => a.status !== 'archived') || [];
  if (nonArchived.length > 0) {
    return NextResponse.json({ error: 'Can only delete archived artworks' }, { status: 400 });
  }
  for (const artwork of toDelete || []) {
    if (artwork.image_url) {
      try {
        const path = artwork.image_url.split('/artworks/').pop();
        if (path) await supabaseAdmin.storage.from('artworks').remove([path]);
      } catch {}
    }
  }
  const { error } = await supabaseAdmin
    .from('artworks')
    .delete()
    .in('id', ids);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ deleted: ids.length });
}