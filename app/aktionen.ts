'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { aktivitaeten, ernten, einstellungen, fotos } from '@/lib/db/schema';
import { darfSchreiben } from '@/lib/auth';
import { gartenLaden } from '@/lib/garten/laden';
import { faelligAm, PLAENE, type PlanArt } from '@/lib/garten/regeln';

/**
 * Server-Aktionen sind über POST direkt erreichbar — die Prüfung muss hier
 * stehen, nicht nur an den Knöpfen in der Oberfläche.
 */
async function schreibrechtPruefen() {
  if (!(await darfSchreiben())) {
    throw new Error('Nur Anne darf Einträge machen.');
  }
}

/** Ein Datum aus der Oberfläche („2026-08-03") auf die Tagesmitte legen. */
function zeitpunktAus(datum?: string) {
  return datum ? new Date(datum + 'T12:00:00') : new Date();
}

const ARTEN = ['gegossen', 'geduengt'] as const;
type Art = (typeof ARTEN)[number];

function artPruefen(art: string): Art {
  if (!ARTEN.includes(art as Art)) throw new Error(`Unbekannte Pflegeart: ${art}`);
  return art as Art;
}

/** Eine einzelne Pflanze gegossen oder gedüngt. */
export async function pflegeEintragen(pflanzeId: string, art: string, datum?: string) {
  await schreibrechtPruefen();
  await db.insert(aktivitaeten).values({
    pflanzeId,
    art: artPruefen(art),
    zeitpunkt: zeitpunktAus(datum),
  });
  revalidatePath('/');
}

/** Einen versehentlichen Eintrag zurücknehmen — den jüngsten dieser Art. */
export async function pflegeZuruecknehmen(pflanzeId: string, art: string) {
  await schreibrechtPruefen();
  await db.delete(aktivitaeten).where(
    and(
      eq(aktivitaeten.pflanzeId, pflanzeId),
      eq(aktivitaeten.art, artPruefen(art)),
      eq(
        aktivitaeten.id,
        sql`(select id from ${aktivitaeten} where pflanze_id = ${pflanzeId}
             and art = ${art} order by zeitpunkt desc limit 1)`,
      ),
    ),
  );
  revalidatePath('/');
}

/**
 * Eine ganze Runde eintragen — wahlweise nur die an diesem Tag fälligen
 * Pflanzen oder wirklich alle. Ein späterer Eintrag wird nie überschrieben.
 */
export async function sammelPflege(art: PlanArt, datum: string, nurFaellige: boolean) {
  await schreibrechtPruefen();

  const garten = await gartenLaden();
  const P = PLAENE[art];
  const zeitpunkt = zeitpunktAus(datum);

  const dran = garten.pflanzen.filter((p) => {
    if (!P.gilt(p)) return false;
    if (nurFaellige && !faelligAm(p, art, datum, garten.pflege)) return false;
    // Späteren Eintrag nicht überholen
    const letzt = garten.pflege[p.id]?.[P.feld];
    return !letzt || new Date(letzt) <= zeitpunkt;
  });

  if (dran.length) {
    await db
      .insert(aktivitaeten)
      .values(dran.map((p) => ({ pflanzeId: p.id, art: P.feld, zeitpunkt })));
  }

  revalidatePath('/');
  return dran.length;
}

export async function ernteEintragen(
  pflanzeId: string,
  datum: string,
  menge: string,
  notiz: string,
) {
  await schreibrechtPruefen();
  await db.insert(ernten).values({
    // Zeitstempel als Kennung — dieselbe Konvention wie im Artefakt (`eid`),
    // damit ältere Sicherungen sich weiterhin zuordnen lassen.
    id: Date.now(),
    pflanzeId,
    datum,
    menge: menge.trim() || null,
    notiz: notiz.trim() || null,
  });
  revalidatePath('/');
}

export async function ernteLoeschen(id: number) {
  await schreibrechtPruefen();
  await db.delete(ernten).where(eq(ernten.id, id));
  revalidatePath('/');
}

// ── Fotos ───────────────────────────────────────────────────

/** Nach dem Verkleinern im Browser sind es rund 300 KB. 4 MB ist reichlich Luft. */
const MAX_BYTES = 4 * 1024 * 1024;

/**
 * Erkennt das Bildformat an den ersten Bytes, statt dem Browser zu glauben.
 * Was hier hereinkommt, wird später mit genau diesem Typ wieder ausgeliefert —
 * eine falsche Angabe wäre also nicht nur unordentlich, sondern eine Lücke.
 */
function bildformat(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  )
    return 'image/png';
  // WebP: "RIFF" … "WEBP"
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  )
    return 'image/webp';
  return null;
}

export async function fotoHochladen(formular: FormData) {
  await schreibrechtPruefen();

  const bild = formular.get('bild');
  if (!(bild instanceof File) || bild.size === 0) throw new Error('Kein Bild empfangen.');
  if (bild.size > MAX_BYTES) throw new Error('Das Bild ist zu groß.');

  const daten = Buffer.from(await bild.arrayBuffer());
  const typ = bildformat(daten);
  if (!typ) throw new Error('Das ist keine Bilddatei, die ich anzeigen kann.');

  let vorschau: Buffer | null = null;
  const klein = formular.get('vorschau');
  if (klein instanceof File && klein.size > 0 && klein.size <= MAX_BYTES) {
    const kleinDaten = Buffer.from(await klein.arrayBuffer());
    if (bildformat(kleinDaten) === typ) vorschau = kleinDaten;
  }

  const pflanzeId = String(formular.get('pflanzeId') ?? '').trim() || null;
  const aufgenommenAm = String(formular.get('datum') ?? '').trim() || null;
  const notiz = String(formular.get('notiz') ?? '').trim() || null;

  await db.insert(fotos).values({
    pflanzeId,
    daten,
    vorschau,
    typ,
    breite: Number(formular.get('breite')) || null,
    hoehe: Number(formular.get('hoehe')) || null,
    aufgenommenAm,
    notiz,
  });

  revalidatePath('/');
}

export async function fotoLoeschen(id: number) {
  await schreibrechtPruefen();
  await db.delete(fotos).where(eq(fotos.id, id));
  revalidatePath('/');
}

/** Aufnahmedatum nachtragen — bei den Altbeständen fehlt es. */
export async function fotoDatumSetzen(id: number, datum: string) {
  await schreibrechtPruefen();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) throw new Error('Datum unverständlich.');
  await db.update(fotos).set({ aufgenommenAm: datum }).where(eq(fotos.id, id));
  revalidatePath('/');
}

export async function themaSetzen(thema: string) {
  await schreibrechtPruefen();
  if (!['herbarium', 'nacht', 'jugendstil'].includes(thema)) {
    throw new Error(`Unbekanntes Thema: ${thema}`);
  }
  await db
    .insert(einstellungen)
    .values({ schluessel: 'thema', wert: thema })
    .onConflictDoUpdate({
      target: einstellungen.schluessel,
      set: { wert: thema, geaendertAm: new Date() },
    });
  revalidatePath('/');
}
