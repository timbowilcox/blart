'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Artwork } from '@/lib/types'

export default function Home() {
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [sort, setSort] = useState('newest')

  const styles = ['abstract', 'landscape', 'portrait', 'surrealism', 'minimalist']

  useEffect(() => {
    fetchArtworks()
  }, [page, selectedStyle, sort])

  async function fetchArtworks() {
    setLoading(true)
    setError(null)
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sort,
        ...(selectedStyle && { style: selectedStyle }),
      })

      const response = await fetch(`/api/artworks?${query}`)
      if (!response.ok) throw new Error('Failed to fetch artworks')

      const { data } = await response.json()
      setArtworks(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setArtworks([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">blart.ai</h1>
            <div className="flex gap-4">
              <button className="text-sm hover:text-zinc-300">Login</button>
              <button className="rounded-md bg-white px-4 py-2 text-black hover:bg-zinc-100">
                Sign Up
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setSelectedStyle(null)
                  setPage(0)
                }}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  selectedStyle === null
                    ? 'bg-white text-black'
                    : 'border border-zinc-600 hover:border-zinc-400'
                }`}
              >
                All
              </button>
              {styles.map((style) => (
                <button
                  key={style}
                  onClick={() => {
                    setSelectedStyle(style)
                    setPage(0)
                  }}
                  className={`rounded-full px-4 py-2 text-sm transition capitalize ${
                    selectedStyle === style
                      ? 'bg-white text-black'
                      : 'border border-zinc-600 hover:border-zinc-400'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>

            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value)
                setPage(0)
              }}
              className="rounded-md border border-zinc-600 bg-zinc-900 px-4 py-2 text-sm"
            >
              <option value="newest">Newest</option>
              <option value="trending">Most Downloaded</option>
              <option value="revenue">Top Revenue</option>
            </select>
          </div>
        </div>
      </header>

      {/* Gallery */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-8 rounded-lg bg-red-500/10 p-4 text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full border-4 border-zinc-800 border-t-white h-8 w-8"></div>
          </div>
        ) : artworks.length === 0 ? (
          <div className="py-12 text-center text-zinc-400">
            No artworks found. Check back soon!
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {artworks.map((artwork) => (
                <div
                  key={artwork.id}
                  className="group relative overflow-hidden rounded-lg bg-zinc-900 cursor-pointer transition hover:scale-105"
                >
                  {/* Placeholder with blur hash would go here */}
                  <div className="aspect-square bg-zinc-800 flex items-center justify-center">
                    {artwork.image_thumbnail_url ? (
                      <Image
                        src={artwork.image_thumbnail_url}
                        alt={artwork.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="text-zinc-500">No image</div>
                    )}
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-end p-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm line-clamp-2">
                        {artwork.title}
                      </h3>
                      <p className="text-xs text-zinc-300 capitalize">
                        {artwork.style}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-12 flex items-center justify-center gap-4">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="rounded-md border border-zinc-600 px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-zinc-400"
              >
                Previous
              </button>
              <span className="text-sm text-zinc-400">Page {page + 1}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={artworks.length < 20}
                className="rounded-md border border-zinc-600 px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-zinc-400"
              >
                Next
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
