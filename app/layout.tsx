import type { Metadata } from 'next';
import { Fraunces, Cormorant_Garamond, Karla } from 'next/font/google';
import './globals.css';

/**
 * Die drei Schriften des Artefakts. Next.js liefert sie mit, statt sie bei
 * jedem Aufruf von Google zu holen — dadurch flackert beim Laden nichts, und
 * Besucher des Gartens landen nicht nebenbei in Googles Protokollen.
 *
 * SOFT und WONK sind die Achsen, mit denen Fraunces in den Themen verstellt
 * wird (`font-variation-settings` im CSS).
 */
const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['SOFT', 'WONK', 'opsz'],
  style: ['normal', 'italic'],
  variable: '--fraunces',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  style: ['normal', 'italic'],
  variable: '--cormorant',
  display: 'swap',
});

const karla = Karla({
  subsets: ['latin'],
  variable: '--karla',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Annes Pflanzenparadies',
  description:
    'Balkon- und Zimmerpflanzen: Gießplan, Düngeplan, Erntetagebuch und ein Beet, das mit der Pflege wächst.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="de"
      className={`${fraunces.variable} ${cormorant.variable} ${karla.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
