import type { Metadata } from 'next';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';
import './globals.css';

const display = Cormorant_Garamond({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

const sans = DM_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? (
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000'
);

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Luna — A Simple Lunar Calendar',
  description: 'Follow moon phases, meteor showers, eclipses and the cosmic moments worth looking up for.',
  openGraph: {
    title: 'Luna — A Simple Lunar Calendar',
    description: 'Follow the moon. Notice the sky.',
    images: [{ url: '/og.png', width: 1728, height: 904, alt: 'Luna lunar calendar' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Luna — A Simple Lunar Calendar',
    description: 'Follow the moon. Notice the sky.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable}`}>{children}</body>
    </html>
  );
}
