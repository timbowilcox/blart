import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function isAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  const adminSecret = process.env.ADMIN_SECRET;
  return !!adminSecret && authHeader === `Bearer ${adminSecret}`;
}

// GET /api/admin/settings - Get all settings or a specific key
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const key = request.nextUrl.searchParams.get('key');
  
  if (key) {
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('*')
      .eq('key', key)
      .single();
    
    if (error) {
      return NextResponse.json({ key, value: null });
    }
    return NextResponse.json(data);
  }

  const { data, error } = await supabaseAdmin
    .from('site_settings')
    .select('*')
    .order('key');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: data });
}

// PUT /api/admin/settings - Upsert a setting
export async function PUT(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { key, value } = body;

  if (!key) {
    return NextResponse.json({ error: 'Missing key' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('site_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}