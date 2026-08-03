'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { aktivitaeten, ernten, einstellungen } from '@/lib/db/schema';
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
