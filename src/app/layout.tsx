import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Blart — AI Generated Art',
  description: 'Unique AI-generated art prints. Free 4K downloads. Museum-quality framed prints delivered worldwide.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://blart.ai'),
  openGraph: {
    title: 'Blart — AI Generated Art',
    description: 'Unique AI-generated art prints. Free 4K downloads. Museum-quality framed prints delivered worldwide.',
    siteName: 'Blart',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blart — AI Generated Art',
    description: 'Unique AI-generated art prints. Free 4K downloads. Museum-quality framed prints delivered worldwide.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

// JSON-LD Structured Data for agentic compatibility
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Store',
  name: 'Blart',
  url: 'https://blart.ai',
  description: 'AI-generated art gallery offering free 4K digital downloads and museum-quality framed prints shipped worldwide via Prodigi print network.',
  image: 'https://blart.ai/og-image.jpg',
  priceRange: '$52 - $180 AUD',
  currenciesAccepted: 'AUD',
  paymentAccepted: 'Credit Card',
  areaServed: 'Worldwide',
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'AI Art Prints',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Product',
          name: 'Framed AI Art Print',
          category: 'Wall Art',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'DigitalDocument',
          name: 'Free 4K Digital Download',
          description: 'High-resolution 4K digital art file',
        },
        price: '0',
        priceCurrency: 'AUD',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
