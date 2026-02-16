import { supabaseServer } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const { title } = body

    // Fetch artwork
    const { data: artwork, error: fetchError } = await supabaseServer
      .from('artworks')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !artwork) {
      return NextResponse.json({ error: 'Artwork not found' }, { status: 404 })
    }

    // Create slug from title
    const slug = (title || artwork.title || 'artwork')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Publish
    const { error: updateError } = await supabaseServer
      .from('artworks')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        title: title || artwork.title,
        slug: slug || artwork.slug,
      })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Artwork published!' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
