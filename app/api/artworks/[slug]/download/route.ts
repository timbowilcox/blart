import { supabaseServer } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

const RATE_LIMIT = 20
const RATE_WINDOW = 24 * 60 * 60 * 1000

const downloadCounts = new Map<string, { count: number; resetTime: number }>()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || 'unknown'
    
    // Rate limiting
    const now = Date.now()
    const ipKey = `${ip}-${Math.floor(now / RATE_WINDOW)}`
    const current = downloadCounts.get(ipKey) || { count: 0, resetTime: now + RATE_WINDOW }
    
    if (current.count >= RATE_LIMIT) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Max 20 downloads per day.' },
        { status: 429 }
      )
    }

    current.count++
    downloadCounts.set(ipKey, current)

    // Fetch artwork
    const { data: artwork, error } = await supabaseServer
      .from('artworks')
      .select('id, image_1080p_url, title')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (error || !artwork) {
      return NextResponse.json(
        { error: 'Artwork not found' },
        { status: 404 }
      )
    }

    // Log download
    supabaseServer
      .from('downloads')
      .insert({
        artwork_id: artwork.id,
        resolution: '1080p',
        is_paid: false,
        ip_address: ip,
        user_agent: request.headers.get('user-agent'),
      })
      .then()

    return NextResponse.json({
      success: true,
      downloadUrl: artwork.image_1080p_url,
      filename: `${slug}-1080p.jpg`,
      title: artwork.title,
    })
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
