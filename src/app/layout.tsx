import type { Metadata, Viewport } from 'next';
import './globals.css';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'https://snapbooth.id');

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0a0a0f',
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Snapbooth - Photobooth Online Aesthetic & Seru',
    template: '%s | Snapbooth',
  },
  description:
    'Website Photo Booth online kekinian dengan beragam template estetik (Twin Strip, Y2K Digicam, Koran Vintage, Spotify Playlist, Story 9:16), filter real-time, live camera countdown, dan download photostrip, animated GIF & foto raw secara instan.',
  applicationName: 'Snapbooth',
  authors: [{ name: 'Snapbooth' }],
  generator: 'Next.js',
  keywords: [
    'Photo Booth',
    'Photobooth Online',
    'Korean Photobooth',
    'Photostrip',
    'Vintage Photobooth',
    'Animated GIF',
    'Snapbooth',
    'Self Photo Studio Online',
    'Aesthetic Photo Strip',
  ],
  icons: {
    icon: [
      { url: '/images/favico.ico', sizes: 'any' },
      { url: '/images/favicon.ico', sizes: 'any' },
      { url: '/favico.ico', sizes: 'any' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: ['/images/favico.ico', '/images/favicon.ico'],
    apple: [
      { url: '/images/logo.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Snapbooth - Photobooth Online Aesthetic & Seru',
    description:
      'Foto seru ala Photobooth Korea online! Beragam template aesthetic, filter real-time, countdown kamera, dan download photostrip gratis langsung di browser kamu.',
    url: siteUrl,
    siteName: 'Snapbooth',
    images: [
      {
        url: '/images/logo.png',
        width: 1200,
        height: 800,
        type: 'image/png',
        alt: 'Snapbooth Logo & Preview',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Snapbooth - Photobooth Online Aesthetic & Seru',
    description:
      'Foto seru ala Photobooth Korea online! Beragam template aesthetic, filter real-time, countdown kamera, dan download photostrip gratis langsung di browser kamu.',
    images: ['/images/logo.png'],
    creator: '@snapbooth',
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
        <link rel="icon" href="/images/favico.ico" sizes="any" />
        <link rel="icon" href="/images/favicon.ico" sizes="any" />
        <link rel="shortcut icon" href="/images/favico.ico" />
        <link rel="apple-touch-icon" href="/images/logo.png" />
      </head>
      <body>
        <AntiDevTools />
        {children}
      </body>
    </html>
  );
}

