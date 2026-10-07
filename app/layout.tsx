import type { Metadata } from 'next';
import './globals.css';

const SITE_URL = 'https://shivankthakur.com';

export const metadata: Metadata = {
  title: 'Sanvox AI — Next-Gen AI Text Humanizer & Detection Forensics | by Shivank Thakur',
  description:
    'Transform AI-generated text into 100% natural, expressive, human-quality writing with Sanvox AI. Bypass GPTZero, Turnitin, Copyleaks, and AI detectors. Developed by Shivank Thakur.',
  keywords: [
    'Sanvox AI', 'AI humanizer', 'Shivank Thakur', 'text humanizer', 'humanize AI text',
    'AI text converter', 'bypass AI detection', 'undetectable AI', 'AI detector bypass',
    'humanize ChatGPT', 'rewrite AI text', 'free AI humanizer', 'GPTZero bypass',
    'humanize AI essay', 'AI writing tool', 'text rewriter', 'AI content humanizer'
  ],
  authors: [{ name: 'Shivank Thakur', url: 'https://shivankthakur.com/' }],
  creator: 'Shivank Thakur',
  publisher: 'Sanvox AI',
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: 'Sanvox AI — Next-Gen AI Text Humanizer & Detector',
    description:
      'Transform AI text into authentic human writing. Bypass GPTZero & modern AI detectors. Developed by Shivank Thakur.',
    url: SITE_URL,
    siteName: 'Sanvox AI',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Sanvox AI — Developed by Shivank Thakur',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sanvox AI — Next-Gen AI Text Humanizer & Detector',
    description:
      'Transform AI text into authentic human writing. Bypass GPTZero & modern AI detectors. Developed by Shivank Thakur.',
    creator: '@shivankthakur',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/sanvox-logo.png?v=3', type: 'image/png' },
      { url: '/favicon.ico?v=3' },
    ],
    apple: '/sanvox-logo.png?v=3',
  },
  category: 'technology',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Sanvox AI',
  url: SITE_URL,
  description:
    'Advanced AI text humanizer and forensic detector created by Shivank Thakur. Converts synthetic AI text into authentic human-like writing that bypasses detection.',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  author: { '@type': 'Person', name: 'Shivank Thakur', url: 'https://shivankthakur.com/' },
  publisher: {
    '@type': 'Organization',
    name: 'Sanvox AI',
    url: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#0a0a0f" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
