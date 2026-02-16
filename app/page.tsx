'use client'

import { useEffect, useState } from 'react'
import { AuthModal } from '@/components/auth-modal'
import { useAuth } from '@/lib/auth-context'
import './gallery.css'

interface Artwork {
  id: string
  title: string
  style: string
  slug: string
  image_thumbnail_url: string | null
  download_count_free: number
  download_count_paid: number
}

export default function Home() {
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    fetchArtworks()
  }, [page])

  async function fetchArtworks() {
    setLoading(true)
    try {
      const response = await fetch(`/api/artworks?page=${page}&limit=20`)
      const { data } = await response.json()
      setArtworks(data || [])
    } catch (err) {
      console.error('Error:', err)
      setArtworks([])
    } finally {
      setLoading(false)
    }
  }

  async function handleDownload(artwork: Artwork) {
    if (!artwork.slug) return
    setDownloading(true)
    try {
      const response = await fetch(`/api/artworks/${artwork.slug}/download`)
      if (!response.ok) throw new Error('Download failed')
      
      const { downloadUrl, filename } = await response.json()
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename || 'artwork.jpg'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      setSelectedArtwork(null)
    } catch (err) {
      alert('Download failed. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="gallery-container">
      <header className="gallery-header">
        <div className="header-content">
          <img src="https://i.postimg.cc/QtBh00fC/logo.png" alt="blart.ai" className="header-logo" />
          <div className="header-buttons">
            {user ? (
              <>
                <span className="user-email">{user.email}</span>
              </>
            ) : (
              <>
                <button className="btn-text" onClick={() => setAuthOpen(true)}>Login</button>
                <button className="btn-primary" onClick={() => setAuthOpen(true)}>Sign Up</button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="gallery-main">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : artworks.length === 0 ? (
          <div className="empty">No artworks found. Check back soon!</div>
        ) : (
          <>
            <div className="gallery-grid">
              {artworks.map((art) => (
                <div
                  key={art.id}
                  className="gallery-card"
                  onClick={() => setSelectedArtwork(art)}
                >
                  {art.image_thumbnail_url && (
                    <img
                      src={art.image_thumbnail_url}
                      alt={art.title}
                      className="card-image"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="pagination">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="btn-secondary"
              >
                Previous
              </button>
              <span className="page-info">Page {page + 1}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={artworks.length < 20}
                className="btn-secondary"
              >
                Next
              </button>
            </div>
          </>
        )}
      </main>

      {/* Lightbox Modal */}
      {selectedArtwork && (
        <div className="modal-overlay" onClick={() => setSelectedArtwork(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setSelectedArtwork(null)}
            >
              ✕
            </button>

            <img
              src={selectedArtwork.image_thumbnail_url || ''}
              alt={selectedArtwork.title}
              className="modal-image"
            />

            <div className="modal-info">
              <h2 className="modal-title">{selectedArtwork.title}</h2>
              <p className="modal-style">{selectedArtwork.style}</p>

              <div className="modal-buttons">
                <button
                  className="btn-primary"
                  onClick={() => handleDownload(selectedArtwork)}
                  disabled={downloading}
                >
                  {downloading ? 'Downloading...' : '↓ Download Free (1080p)'}
                </button>
                <button className="btn-secondary" disabled>
                  💳 4K Download — $5 (coming soon)
                </button>
              </div>

              <div className="modal-stats">
                ❤️ Downloaded {selectedArtwork.download_count_free + selectedArtwork.download_count_paid} times
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  )
}
