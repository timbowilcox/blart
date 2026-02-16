'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import '../app/auth.css'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signUp, signIn } = useAuth()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isSignUp) {
        await signUp(email, password)
        alert('Account created! Check your email to confirm.')
      } else {
        await signIn(email, password)
        alert('Signed in!')
        onClose()
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="auth-backdrop" onClick={onClose} />
      <div className="auth-modal">
        <div className="auth-header">
          <h2 className="auth-title">{isSignUp ? 'Create Account' : 'Sign In'}</h2>
          <button className="auth-close" onClick={onClose}>✕</button>
        </div>

        <div className="auth-content">
          {error && <div className="auth-error">{error}</div>}
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-group">
              <label className="auth-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="auth-input"
                required
              />
            </div>

            <div className="auth-group">
              <label className="auth-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="auth-input"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary auth-submit">
              {loading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <div className="auth-toggle">
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="auth-toggle-link"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
