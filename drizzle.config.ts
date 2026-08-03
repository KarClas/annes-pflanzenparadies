import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Next.js liest .env.local von selbst — die Kommandozeilenwerkzeuge nicht.
config({ path: '.env.local' });

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './lib/db/migrationen',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
