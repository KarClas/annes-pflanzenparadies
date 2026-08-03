/**
 * Sicherung der Datenbank als Textdatei.
 *
 *   npm run daten:sichern
 *
 * Schreibt `daten/sicherung-<zeitpunkt>.json` im selben Format wie das alte
 * Artefakt. Damit lässt sich der Stand jederzeit über `npm run daten:import`
 * wiederherstellen — und die Datei landet mit im Repository, ist also auch
 * versioniert und bei GitHub abgelegt.
 *
 * Der Dateiname trägt die Uhrzeit, damit eine zweite Sicherung am selben Tag
 * die erste nicht überschreibt. Die ursprüngliche Artefakt-Sicherung liegt
 * unter `daten/archiv/` und wird nie angerührt.
 *
 * Fotos sind nicht enthalten: sie liegen als Bytes in der Datenbank und würden
 * die Textdatei unlesbar aufblähen. Für sie ist `pg_dump` das richtige Werkzeug.
 */
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { asc, desc, sql } from 'drizzle-orm';
import { db } from '../lib/db';
import { aktivitaeten, basisPflege, ernten, einstellungen, fotos } from '../lib/db/schema';

async function main() {
  const [pflegeReihen, sockelReihen, ernteReihen, einstellungReihen, fotoAnzahl] =
    await Promise.all([
      db
        .select({
          pflanzeId: aktivitaeten.pflanzeId,
          art: aktivitaeten.art,
          letzter: sql<string>`max(${aktivitaeten.zeitpunkt})`,
          anzahl: sql<number>`count(*)::int`,
        })
        .from(aktivitaeten)
        .groupBy(aktivitaeten.pflanzeId, aktivitaeten.art),
      db.select().from(basisPflege),
      db.select().from(ernten).orderBy(desc(ernten.datum), desc(ernten.id)),
      db.select().from(einstellungen).orderBy(asc(einstellungen.schluessel)),
      db.select({ n: sql<number>`count(*)::int` }).from(fotos),
    ]);

  // Zurück in die Form, die das Artefakt und das Importskript verstehen:
  // letzter Termin plus Gesamtzahl je Pflanze.
  const aktivitaet: Record<string, Record<string, string | number>> = {};
  for (const s of sockelReihen) {
    const e = (aktivitaet[s.pflanzeId] ??= {});
    if (s.nGegossen) e.n_gegossen = s.nGegossen;
    if (s.nGeduengt) e.n_geduengt = s.nGeduengt;
  }
  for (const r of pflegeReihen) {
    const e = (aktivitaet[r.pflanzeId] ??= {});
    e[r.art] = new Date(r.letzter).toISOString();
    const zaehler = `n_${r.art}`;
    e[zaehler] = ((e[zaehler] as number) ?? 0) + r.anzahl;
  }

  const thema =
    (einstellungReihen.find((e) => e.schluessel === 'thema')?.wert as string) ?? 'herbarium';

  /**
   * Welche Ernten aus dem Grundstock fehlen in der Datenbank? Genau die hat
   * Anne gelöscht. Abgeleitet statt fortgeschrieben — so bleibt die Angabe
   * auch dann richtig, wenn später weitere gelöscht werden.
   */
  const stamm = JSON.parse(
    readFileSync(join(process.cwd(), 'daten', 'pflanzen.json'), 'utf8'),
  );
  const vorhanden = new Set(ernteReihen.map((e) => e.id));
  const geloescht: number[] = (stamm.grundstock?.ernte ?? [])
    .map((e: { eid: number }) => e.eid)
    .filter((eid: number) => !vorhanden.has(eid));

  const inhalt = {
    format: 'balkon-garten-sicherung',
    version: 1,
    gesichert: new Date().toISOString(),
    daten: {
      'garten:aktivitaet': aktivitaet,
      'garten:ernte': ernteReihen.map((e) => ({
        eid: e.id,
        pflanzeId: e.pflanzeId,
        datum: e.datum,
        menge: e.menge ?? undefined,
        notiz: e.notiz ?? undefined,
      })),
      'garten:eigene': [],
      'garten:geloescht': geloescht,
      'garten:thema': thema,
    },
  };

  // z. B. sicherung-2026-08-03T2224.json — Uhrzeit im Namen, damit nichts
  // überschrieben wird und die neueste Datei zugleich die alphabetisch letzte ist.
  const jetzt = new Date().toISOString();
  const name = `sicherung-${jetzt.slice(0, 13).replace(':', '')}${jetzt.slice(14, 16)}.json`;
  const pfad = join(process.cwd(), 'daten', name);
  writeFileSync(pfad, JSON.stringify(inhalt, null, 1) + '\n');

  const giessen = Object.values(aktivitaet).reduce(
    (s, x) => s + ((x.n_gegossen as number) ?? 0),
    0,
  );
  const duengen = Object.values(aktivitaet).reduce(
    (s, x) => s + ((x.n_geduengt as number) ?? 0),
    0,
  );

  console.log(`Geschrieben: daten/${name}`);
  console.log(`  Pflanzen mit Historie : ${Object.keys(aktivitaet).length}`);
  console.log(`  Gießvorgänge          : ${giessen}`);
  console.log(`  Düngerunden           : ${duengen}`);
  console.log(`  Ernten                : ${ernteReihen.length}`);
  console.log(`  gelöschte Ernten      : ${geloescht.length}`);
  console.log(`  Fotos                 : ${fotoAnzahl[0].n} (nicht in dieser Datei)`);
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error('FEHLGESCHLAGEN:', e);
    process.exit(1);
  },
);
