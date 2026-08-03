import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    'DATABASE_URL fehlt. Lokal steht sie in .env.local, auf Vercel in den Projekt-Einstellungen.',
  );
}

/**
 * Im Entwicklungsmodus lädt Next.js Module bei jeder Änderung neu. Ohne diesen
 * Zwischenspeicher entstünde bei jedem Neuladen ein neuer Verbindungspool, bis
 * Postgres keine Verbindungen mehr annimmt.
 */
const global_ = globalThis as unknown as { __pg?: ReturnType<typeof postgres> };

const client =
  global_.__pg ??
  postgres(url, {
    max: process.env.NODE_ENV === 'production' ? 5 : 2,
    prepare: false, // verträgt sich mit Verbindungs-Poolern wie dem von Neon
  });

if (process.env.NODE_ENV !== 'production') global_.__pg = client;

export const db = drizzle(client, { schema });
export { schema };
