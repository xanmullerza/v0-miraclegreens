import type React from 'react';
import { DM_Sans, Playfair_Display } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import { ThemeProvider } from '@/components/ux/theme-provider';
import { UserPreferencesProvider } from '@/lib/context/user-preferences-context';

const _dmSans = DM_Sans({ subsets: ['latin'] });
const _playfair = Playfair_Display({ subsets: ['latin'] });

export const metadata = {
  title: 'Vitala | Biological Nutrition Protocol',
  description:
    'A professional nutrition platform focused on helping you make better biological choices through optimized protocols and healthy eating.',
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

import { Toaster } from 'sonner';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                (function() {
                  try {
                    var stored = localStorage.getItem('theme');
                    var themes = ['material', 'neon', 'free'];
                    themes.forEach(function(theme) {
                      document.documentElement.classList.remove(theme);
                    });

                    if (themes.includes(stored)) {
                      document.documentElement.classList.add(stored);
                    } else {
                      document.documentElement.classList.add('material');
                      localStorage.setItem('theme', 'material');
                    }
                  } catch (e) { }
                })();
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`${_dmSans.className} ${_playfair.className} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="material"
          themes={['material', 'neon', 'free']}
          disableTransitionOnChange
        >
          <UserPreferencesProvider>{children}</UserPreferencesProvider>
          <Toaster richColors position="top-center" />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
