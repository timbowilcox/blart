'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import '../admin.css'

interface DraftArtwork {
  id: string
  title: string
  style: string
  image_thumbnail_url: string | null
  image_original_url: string | null
  generation_prompt: string | null
  status: string
  created_at: string
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth()
  const [artworks, setArtworks] = useState<DraftArtwork[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<DraftArtwork | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [publishing, setPublishing] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      alert('You must be logged in to access admin')
      window.location.href = '/'
      return
    }
    fetchDrafts()
  }, [user, authLoading])

  async function fetchDrafts() {
    try {
      const response = await fetch('/api/admin/staging')
      const { data } = await response.json()
      setArtworks(data || [])
    } catch (err) {
      console.error('Error:', err)
      alert('Failed to load artworks')
    } finally {
      setLoading(false)
    }
  }

  async function handlePublish(artwork: DraftArtwork) {
    if (!editingTitle.trim()) {
      alert('Please enter a title')
      return
    }

    setPublishing(true)
    try {
      const response = await fetch(`/api/admin/artworks/${artwork.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editingTitle }),
      })

      if (!response.ok) throw new Error('Publish failed')

      alert('✓ Published!')
      setSelected(null)
      setEditingTitle('')
      fetchDrafts()
    } catch (err) {
      alert('Failed to publish')
    } finally {
      setPublishing(false)
    }
  }

  async function handleReject(artwork: DraftArtwork) {
    if (!confirm('Reject this artwork? This cannot be undone.')) return

    try {
      const response = await fetch(`/api/admin/artworks/${artwork.id}/reject`, {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Reject failed')

      alert('✓ Rejected')
      setSelected(null)
      fetchDrafts()
    } catch (err) {
      alert('Failed to reject')
    }
  }

  if (authLoading || loading) {
    return (
      <div className="admin-container">
        <div className="admin-loading">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1 className="admin-title">Admin Dashboard</h1>
        <p className="admin-subtitle">Review and publish artworks</p>
      </div>

      <div className="admin-content">
        <div className="admin-sidebar">
          {artworks.length === 0 ? (
            <div className="admin-empty">No artworks to review</div>
          ) : (
            <div className="artwork-list">
              {artworks.map((artwork) => (
                <div
                  key={artwork.id}
                  className={`artwork-card ${selected?.id === artwork.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelected(artwork)
                    setEditingTitle(artwork.title || '')
                  }}
                >
                  {artwork.image_thumbnail_url && (
                    <img src={artwork.image_thumbnail_url} alt={artwork.title} className="card-thumb" />
                  )}
                  <h3 className="card-title">{artwork.title || 'Untitled'}</h3>
                  <p className="card-style">{artwork.style}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="admin-preview">
          {selected ? (
            <>
              {selected.image_original_url && (
                <img src={selected.image_original_url} alt={selected.title} className="preview-image" />
              )}

              <h2 className="preview-title">{selected.title || 'Untitled'}</h2>
              <p className="preview-style">{selected.style}</p>

              {selected.generation_prompt && (
                <div className="preview-prompt">
                  <label className="prompt-label">Generation Prompt:</label>
                  <p className="prompt-text">{selected.generation_prompt}</p>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="actions">
                <button
                  className="btn-primary btn-publish"
                  onClick={() => handlePublish(selected)}
                  disabled={publishing}
                >
                  {publishing ? 'Publishing...' : '✓ Publish'}
                </button>
                <button
                  className="btn-secondary btn-reject"
                  onClick={() => handleReject(selected)}
                >
                  ✕ Reject
                </button>
              </div>
            </>
          ) : (
            <div className="admin-empty">Select an artwork to review</div>
          )}
        </div>
      </div>
    </div>
  )
}
