import type React from 'react';
import { DM_Sans, Playfair_Display } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

const _dmSans = DM_Sans({ subsets: ['latin'] });
const _playfair = Playfair_Display({ subsets: ['latin'] });

export const metadata = {
  title: 'Miracle Greens | Growing Hope Through Moringa',
  description:
    'A nonprofit organization growing moringa trees to produce nutrient-rich moringa capsules for distribution to communities in need.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${_dmSans.className} ${_playfair.className} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
