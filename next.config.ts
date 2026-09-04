import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * Baut die Anwendung so, dass sie ohne Next.js-Werkzeuge startet: ein Ordner
   * mit allem Nötigen und einer `server.js`, die mit `node server.js` läuft.
   *
   * Das ist der Unterschied zwischen „läuft bei Vercel" und „läuft überall" —
   * auf einem gemieteten Server, in einem Container, auf einem Rechner im
   * eigenen Flur. Vercel stört sich nicht daran.
   */
  output: 'standalone',
};

export default nextConfig;
