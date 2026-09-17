import type { Metadata, Viewport } from 'next';
import './globals.css';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'https://pearlyphotobooth.com');

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#ffffff',
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Pearly Photobooth - Self Photo Studio Online Aesthetic',
    template: '%s | Pearly Photobooth',
  },
  description:
    'Pearly Photobooth - Website Photo Booth online aesthetic dengan beragam frame template eksklusif, filter glowing studio, live countdown, animated GIF, dan download photostrip instan.',
  applicationName: 'Pearly Photobooth',
  authors: [{ name: 'Pearly Photobooth' }],
  generator: 'Next.js',
  keywords: [
    'Pearly Photobooth',
    'Photo Booth',
    'Photobooth Online',
    'Korean Photobooth',
    'Photostrip',
    'Self Photo Studio Online',
    'Aesthetic Photo Strip',
    'Animated GIF',
  ],
  icons: {
    icon: [
      { url: '/images/favicon.ico', sizes: 'any' },
      { url: '/images/favico.ico', sizes: 'any' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favico.ico', sizes: 'any' },
    ],
    shortcut: ['/images/favicon.ico', '/images/favico.ico'],
    apple: [
      { url: '/images/logo.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Pearly Photobooth - Self Photo Studio Online Aesthetic',
    description:
      'Foto seru ala Photobooth aesthetic online! Beragam template aesthetic, filter glowing studio, countdown kamera, animated GIF, dan download photostrip gratis langsung di browser kamu.',
    url: siteUrl,
    siteName: 'Pearly Photobooth',
    images: [
      {
        url: '/images/logo.png',
        width: 1200,
        height: 800,
        type: 'image/png',
        alt: 'Pearly Photobooth Logo',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pearly Photobooth - Self Photo Studio Online Aesthetic',
    description:
      'Foto seru ala Photobooth aesthetic online! Beragam template aesthetic, filter glowing studio, countdown kamera, animated GIF, dan download photostrip gratis langsung di browser kamu.',
    images: ['/images/logo.png'],
    creator: '@pearlyphotobooth',
  },
  robots: {
    index: true,
    follow: true,
  },
};

import { AntiDevTools } from '@/components/AntiDevTools';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" href="/images/favicon.ico" sizes="any" />
        <link rel="icon" href="/images/favico.ico" sizes="any" />
        <link rel="shortcut icon" href="/images/favicon.ico" />
        <link rel="apple-touch-icon" href="/images/logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Cinzel:wght@400;600;700;900&family=Great+Vibes&family=MonteCarlo&family=Outfit:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400;1,700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Pinyon+Script&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AntiDevTools />
        {children}
      </body>
    </html>
  );
}

