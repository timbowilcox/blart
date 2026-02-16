'use client'

import { useEffect, useState } from 'react'

export default function Home() {
  const [artworks, setArtworks] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)

  useEffect(() => {
    fetch(`/api/artworks?page=${page}&limit=20`)
      .then(r => r.json())
      .then(d => setArtworks(d.data || []))
      .catch(() => setArtworks([]))
      .finally(() => setLoading(false))
  }, [page])

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#0A0A0A',
      color: '#F5F5F5',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    header: {
      position: 'sticky' as const,
      top: 0,
      zIndex: 40,
      borderBottom: '1px solid #2A2A2A',
      backgroundColor: 'rgba(10, 10, 10, 0.8)',
      padding: '24px',
    },
    headerContent: {
      maxWidth: '1280px',
      margin: '0 auto',
      display: 'flex' as const,
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontSize: '32px',
      fontWeight: 'bold',
      margin: 0,
    },
    main: {
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '48px 16px',
    },
    grid: {
      display: 'grid' as const,
      gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
      gap: '16px',
    },
    card: {
      position: 'relative' as const,
      overflow: 'hidden',
      borderRadius: '8px',
      backgroundColor: '#141414',
      cursor: 'pointer',
      aspectRatio: '1',
    },
    image: {
      width: '100%',
      height: '100%',
      objectFit: 'cover' as const,
    },
    empty: {
      textAlign: 'center' as const,
      color: '#A0A0A0',
      padding: '48px 0',
    },
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>blart.ai</h1>
        </div>
      </header>

      <main style={styles.main}>
        {loading ? (
          <div style={styles.empty}>Loading...</div>
        ) : artworks.length === 0 ? (
          <div style={styles.empty}>No artworks found yet. Check back soon!</div>
        ) : (
          <>
            <div style={styles.grid}>
              {artworks.map((art: any) => (
                <div key={art.id} style={styles.card}>
                  {art.image_thumbnail_url ? (
                    <img src={art.image_thumbnail_url} alt={art.title} style={styles.image} />
                  ) : (
                    <div style={{ ...styles.image, backgroundColor: '#1E1E1E' }} />
                  )}
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '48px' }}>
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                style={{
                  padding: '8px 16px',
                  marginRight: '16px',
                  backgroundColor: '#2A2A2A',
                  color: '#F5F5F5',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: page === 0 ? 'not-allowed' : 'pointer',
                  opacity: page === 0 ? 0.5 : 1,
                }}
              >
                Previous
              </button>
              <span style={{ marginRight: '16px' }}>Page {page + 1}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={artworks.length < 20}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#2A2A2A',
                  color: '#F5F5F5',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: artworks.length < 20 ? 'not-allowed' : 'pointer',
                  opacity: artworks.length < 20 ? 0.5 : 1,
                }}
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
