import type { Metadata } from 'next';
import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sos.sanvox.in';

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
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Sanvox AI — Next-Gen AI Text Humanizer & Detector',
    description:
      'Transform AI-generated text into 100% natural, expressive, human-quality writing with Sanvox AI. Bypass GPTZero, Turnitin, and modern AI detectors. Developed by Shivank Thakur.',
    url: SITE_URL,
    siteName: 'Sanvox AI',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Sanvox AI — Next-Gen AI Text Humanizer & Detector by Shivank Thakur',
        type: 'image/jpeg',
      },
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Sanvox AI — Next-Gen AI Text Humanizer & Detector by Shivank Thakur',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sanvox AI — Next-Gen AI Text Humanizer & Detector',
    description:
      'Transform AI-generated text into authentic, undetectable human prose with Sanvox AI. Developed by Shivank Thakur.',
    creator: '@shivankthakur',
    images: [`${SITE_URL}/og-image.jpg`],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/sanvox-logo.png?v=5', type: 'image/png' },
      { url: '/favicon.ico?v=5' },
    ],
    apple: '/sanvox-logo.png?v=5',
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
        <meta name="theme-color" content="#080c16" />
        
        {/* Primary OpenGraph metadata for WhatsApp, Telegram, Facebook */}
        <meta property="og:title" content="Sanvox AI — Next-Gen AI Text Humanizer & Detector" />
        <meta property="og:description" content="Transform AI-generated text into 100% natural, expressive, human-quality writing with Sanvox AI. Developed by Shivank Thakur." />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Sanvox AI" />
        <meta property="og:image" content={`${SITE_URL}/og-image.jpg`} />
        <meta property="og:image:secure_url" content={`${SITE_URL}/og-image.jpg`} />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Sanvox AI - AI Text Humanizer by Shivank Thakur" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Sanvox AI — Next-Gen AI Text Humanizer & Detector" />
        <meta name="twitter:description" content="Transform AI-generated text into authentic, undetectable human prose with Sanvox AI. Developed by Shivank Thakur." />
        <meta name="twitter:image" content={`${SITE_URL}/og-image.jpg`} />

        {/* WhatsApp & Legacy crawlers fallback */}
        <link rel="image_src" href={`${SITE_URL}/og-image.jpg`} />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
