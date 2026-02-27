import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { artwork_id, action } = await request.json();

    if (!artwork_id || !['view', 'download', 'order'].includes(action)) {
      return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
    }

    await supabaseAdmin.rpc('increment_artwork_stat', {
      artwork_uuid: artwork_id,
      stat_name: action,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to track' }, { status: 500 });
  }
}
