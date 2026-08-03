/**
 * Einmaliger Umzug der vorhandenen Fotos in die Datenbank.
 *
 *   npm run fotos:import
 *
 * Quelle ist `public/fotos/` mit je zwei Fassungen pro Bild: `name.jpg` und
 * `name_klein.jpg`. Die Zuordnung zur Pflanze kommt aus dem Feld `foto` in
 * `daten/pflanzen.json`.
 *
 * Das Aufnahmedatum lässt sich nur aus dem Dateinamen ablesen — EXIF-Angaben
 * fehlen in diesen Dateien. Wo der Name kein Datum trägt, bleibt es leer.
 * Erfundene Daten wären schlimmer als gar keine: der Wachstumsverlauf würde
 * eine Reihenfolge behaupten, die nicht stimmt.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { sql } from 'drizzle-orm';
import { db } from '../lib/db';
import { fotos } from '../lib/db/schema';

const ORDNER = join(process.cwd(), 'public', 'fotos');

/** „20260716_…" und „PXL_20260630_…" tragen das Datum im Namen. */
function datumAus(name: string): string | null {
  const m = name.match(/(?:^|_)(\d{4})(\d{2})(\d{2})(?:_|$)/);
  if (!m) return null;
  const [, j, mo, t] = m;
  const jahr = Number(j);
  const monat = Number(mo);
  const tag = Number(t);
  if (jahr < 2000 || jahr > 2100 || monat < 1 || monat > 12 || tag < 1 || tag > 31) return null;
  return `${j}-${mo}-${t}`;
}

async function main() {
  const stamm = JSON.parse(readFileSync(join(process.cwd(), 'daten', 'pflanzen.json'), 'utf8'));

  // Ein Foto kann bei mehreren Pflanzen hängen (Habanero und Paprika teilen
  // sich eins). Dann bekommt jede Pflanze ihren eigenen Eintrag.
  const zuordnung: Record<string, string[]> = {};
  for (const p of stamm.pflanzen) {
    if (p.foto) (zuordnung[p.foto] ??= []).push(p.id);
  }

  await db.delete(fotos);

  let angelegt = 0;
  let ohneDatum = 0;
  const fehlend: string[] = [];

  for (const [name, pflanzenIds] of Object.entries(zuordnung)) {
    const gross = join(ORDNER, `${name}.jpg`);
    const klein = join(ORDNER, `${name}_klein.jpg`);
    if (!existsSync(gross)) {
      fehlend.push(name);
      continue;
    }

    const daten = readFileSync(gross);
    const vorschau = existsSync(klein) ? readFileSync(klein) : null;
    const aufgenommenAm = datumAus(name);
    if (!aufgenommenAm) ohneDatum++;

    for (const pflanzeId of pflanzenIds) {
      await db.insert(fotos).values({
        pflanzeId,
        daten,
        vorschau,
        typ: 'image/jpeg',
        aufgenommenAm,
        notiz: null,
      });
      angelegt++;
    }
  }

  console.log(`Bilddateien gefunden : ${Object.keys(zuordnung).length - fehlend.length}`);
  console.log(`Einträge angelegt    : ${angelegt}`);
  console.log(`ohne Aufnahmedatum   : ${ohneDatum} (Dateiname trägt keines)`);
  if (fehlend.length) console.log(`FEHLENDE Dateien     : ${fehlend.join(', ')}`);

  const belegt = await db.execute<{ platz: string }>(sql`
    select pg_size_pretty(sum(octet_length(daten) + coalesce(octet_length(vorschau), 0))) as platz
    from ${fotos}`);
  console.log(`Belegter Platz       : ${belegt[0]?.platz ?? 'unbekannt'}`);
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error('FEHLGESCHLAGEN:', e);
    process.exit(1);
  },
);
