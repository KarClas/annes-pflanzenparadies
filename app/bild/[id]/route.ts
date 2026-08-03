import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { fotos } from '@/lib/db/schema';

/**
 * Liefert ein Foto aus der Datenbank aus.
 *
 *   /bild/12          das ganze Bild
 *   /bild/12?klein    die kleine Fassung für Listen
 *
 * Bewusst nicht unter /fotos: dort liegen die Bilddateien aus der
 * Artefakt-Zeit, die als Archiv im Projekt bleiben.
 *
 * Fotos ändern sich nie — einmal hochgeladen, bleiben sie wie sie sind.
 * Deshalb darf der Browser sie dauerhaft behalten und muss nicht bei jedem
 * Blättern nachfragen.
 */
export async function GET(
  anfrage: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const nummer = Number(id);
  if (!Number.isInteger(nummer) || nummer < 1) {
    return new Response('Ungültige Bildnummer', { status: 400 });
  }

  const [bild] = await db.select().from(fotos).where(eq(fotos.id, nummer)).limit(1);
  if (!bild) return new Response('Nicht gefunden', { status: 404 });

  const klein = new URL(anfrage.url).searchParams.has('klein');
  const bytes = (klein && bild.vorschau) || bild.daten;

  return new Response(new Uint8Array(bytes), {
    headers: {
      'Content-Type': bild.typ,
      'Content-Length': String(bytes.length),
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
