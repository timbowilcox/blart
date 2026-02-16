import { supabaseServer } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '0')
    const limit = parseInt(searchParams.get('limit') || '20')
    const style = searchParams.get('style')
    const sort = searchParams.get('sort') || 'newest'

    let query = supabaseServer
      .from('artworks')
      .select('*', { count: 'exact' })
      .eq('status', 'published')

    // Filter by style if provided
    if (style) {
      query = query.eq('style', style)
    }

    // Sort
    if (sort === 'trending') {
      query = query.order('download_count_free', { ascending: false })
    } else if (sort === 'revenue') {
      query = query.order('revenue_cents', { ascending: false })
    } else {
      // Default: newest
      query = query.order('published_at', { ascending: false })
    }

    // Pagination
    const from = page * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      data,
      count,
      page,
      limit,
    })
  } catch (error) {
    console.error('Error fetching artworks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
