import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'Snapbooth',
  description: 'Website Photo Booth online kekinian dengan 10 template strip Korea, filter estetik real-time, live camera countdown, dan download Photostrip, Animated GIF & Raw Photos.',
  applicationName: 'Snapbooth',
  keywords: ['Photo Booth', 'Photobooth Online', 'Korean Photobooth', 'Photostrip', 'Vintage Photobooth', 'Animated GIF', 'Snapbooth'],
  icons: {
    icon: [
      { url: '/images/favicon.ico' },
      { url: '/favicon.ico' },
    ],
    shortcut: '/images/favicon.ico',
    apple: '/images/logo.png',
  },
  openGraph: {
    title: 'Snapbooth',
    description: 'Foto seru dengan 12 template aesthetic (Twin Strip, Y2K Digicam, Koran Vintage, Spotify Playlist, Story 9:16, & Minimalist), filter live kamera, animated GIF, dan download photostrip langsung!',
    url: '/',
    siteName: 'Snapbooth',
    images: [
      {
        url: '/images/logo.png',
        width: 1536,
        height: 1024,
        alt: 'Snapbooth Photo Booth Logo',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Snapbooth',
    description: 'Foto seru dengan 12 template aesthetic (Twin Strip, Y2K Digicam, Koran Vintage, Spotify Playlist, Story 9:16, & Minimalist), filter live kamera, animated GIF, dan download photostrip langsung!',
    images: ['/images/logo.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <link rel="icon" href="/images/favicon.ico" sizes="any" />
        <link rel="shortcut icon" href="/images/favicon.ico" />
        <link rel="apple-touch-icon" href="/images/logo.png" />
        <meta property="og:image" content="/images/logo.png" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1536" />
        <meta property="og:image:height" content="1024" />
        <meta name="twitter:image" content="/images/logo.png" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
