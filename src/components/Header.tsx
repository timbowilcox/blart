'use client';

import Link from 'next/link';
import { useState } from 'react';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-blart-white/90 backdrop-blur-md border-b border-blart-stone/50">
      <nav className="max-w-[1800px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-display text-2xl font-light tracking-tight">
          blart<span className="text-blart-ash">.ai</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/gallery"
            className="text-sm tracking-wider uppercase text-blart-dim hover:text-blart-black transition-colors"
          >
            Gallery
          </Link>
          <Link
            href="/gallery?filter=featured"
            className="text-sm tracking-wider uppercase text-blart-dim hover:text-blart-black transition-colors"
          >
            Featured
          </Link>
          <Link
            href="/about"
            className="text-sm tracking-wider uppercase text-blart-dim hover:text-blart-black transition-colors"
          >
            About
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden w-8 h-8 flex flex-col items-center justify-center gap-1.5"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block w-5 h-px bg-blart-black transition-all ${menuOpen ? 'rotate-45 translate-y-[3px]' : ''}`} />
          <span className={`block w-5 h-px bg-blart-black transition-all ${menuOpen ? '-rotate-45 -translate-y-[3px]' : ''}`} />
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-blart-white border-b border-blart-stone/50 px-6 pb-6 pt-2 animate-fade-in">
          <div className="flex flex-col gap-4">
            <Link
              href="/gallery"
              className="text-sm tracking-wider uppercase text-blart-dim"
              onClick={() => setMenuOpen(false)}
            >
              Gallery
            </Link>
            <Link
              href="/gallery?filter=featured"
              className="text-sm tracking-wider uppercase text-blart-dim"
              onClick={() => setMenuOpen(false)}
            >
              Featured
            </Link>
            <Link
              href="/about"
              className="text-sm tracking-wider uppercase text-blart-dim"
              onClick={() => setMenuOpen(false)}
            >
              About
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
