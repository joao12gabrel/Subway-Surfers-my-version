import type { Metadata } from 'next';
import { Bricolage_Grotesque, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const displayFont = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
});

const bodyFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-body',
});

const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Rail Rushers — Endless 3D Runner',
  description:
    'Desvia-te dos comboios, salta barreiras, ativa hoverboards e foge do Inspetor em cenários 3D dinâmicos.',
  openGraph: {
    title: 'Rail Rushers — Endless 3D Runner',
    description:
      'Desvia-te dos comboios, salta barreiras, ativa hoverboards e foge do Inspetor em cenários 3D dinâmicos.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rail Rushers — Endless 3D Runner',
    description:
      'Desvia-te dos comboios, salta barreiras, ativa hoverboards e foge do Inspetor em cenários 3D dinâmicos.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt"
      className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}
    >
      <body data-state="title" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
