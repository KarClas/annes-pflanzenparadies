/**
 * Einmaliger Umzug: Artefakt-Daten → Datenbank.
 *
 *   npm run daten:import
 *
 * Das Skript räumt die Tabellen vorher leer und baut sie neu auf. Es ist als
 * Umzugswerkzeug gedacht, nicht als laufender Abgleich — wer es auf einer
 * Datenbank mit neuen Einträgen laufen lässt, verliert diese.
 *
 * Zwei Quellen werden zusammengeführt, nach genau den Regeln, die im Artefakt
 * galten (siehe wissen/dashboard.md):
 *   - daten/pflanzen.json           → Stammdaten + `grundstock`
 *   - daten/sicherung-*.json        → Annes Browser-Stand
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { sql } from 'drizzle-orm';
import { db } from '../lib/db';
import {
  pflanzen,
  aktivitaeten,
  basisPflege,
  ernten,
  einstellungen,
  fotos,
  type Darstellung,
} from '../lib/db/schema';

const DATEN = join(process.cwd(), 'daten');

type RohPflanze = Record<string, unknown>;
type Pflegestand = {
  gegossen?: string;
  geduengt?: string;
  n_gegossen?: number;
  n_geduengt?: number;
};
type RohErnte = {
  eid: number;
  pflanzeId: string;
  datum: string;
  menge?: string;
  notiz?: string;
  korrigiert?: boolean;
};

/** Die jüngste Sicherungsdatei im Datenordner. */
function neuesteSicherung() {
  const dateien = readdirSync(DATEN)
    .filter((d) => d.startsWith('sicherung-') && d.endsWith('.json'))
    .sort();
  if (!dateien.length) throw new Error('Keine Sicherungsdatei in daten/ gefunden.');
  const datei = dateien[dateien.length - 1];
  return { datei, inhalt: JSON.parse(readFileSync(join(DATEN, datei), 'utf8')) };
}

const DARSTELLUNGSFELDER = [
  'mindeststufe',
  'wuchshoehe',
  'dichte',
  'blatt_bonus',
  'trieb_kuerzen',
  'sonderfrucht',
  'bluete_groesse',
  'blueht',
  'verzweigt',
  'pflanzen_im_topf',
  'topf_mit',
] as const;

function darstellungAus(p: RohPflanze): Darstellung {
  const d: Record<string, unknown> = {};
  for (const feld of DARSTELLUNGSFELDER) {
    if (p[feld] !== undefined && p[feld] !== null) d[feld] = p[feld];
  }
  return d as Darstellung;
}

/**
 * Grundstock und Browser-Stand vereinigen.
 * Späteres Datum gewinnt, höherer Zähler gewinnt — nie addieren.
 */
function pflegeVereinen(
  grund: Record<string, Pflegestand>,
  browser: Record<string, Pflegestand>,
) {
  const zusammen: Record<string, Pflegestand> = {};
  for (const id of new Set([...Object.keys(grund), ...Object.keys(browser)])) {
    const g = grund[id] ?? {};
    const b = browser[id] ?? {};
    const eintrag: Pflegestand = {};
    for (const feld of ['gegossen', 'geduengt'] as const) {
      const kandidaten = [g[feld], b[feld]].filter(Boolean) as string[];
      if (kandidaten.length) {
        eintrag[feld] = kandidaten.sort((x, y) => +new Date(y) - +new Date(x))[0];
      }
    }
    for (const feld of ['n_gegossen', 'n_geduengt'] as const) {
      const m = Math.max(g[feld] ?? 0, b[feld] ?? 0);
      if (m) eintrag[feld] = m;
    }
    zusammen[id] = eintrag;
  }
  return zusammen;
}

/** Ernten vereinigen: Browser gewinnt, außer der Grundstock ist als korrigiert markiert. */
function erntenVereinen(grund: RohErnte[], browser: RohErnte[], geloescht: Set<number>) {
  const nachEid = new Map<number, RohErnte>();
  for (const e of grund) if (!geloescht.has(e.eid)) nachEid.set(e.eid, e);
  for (const e of browser) {
    if (geloescht.has(e.eid)) continue;
    if (!nachEid.get(e.eid)?.korrigiert) nachEid.set(e.eid, e);
  }
  return [...nachEid.values()];
}

/**
 * Notbremse: läuft der Import gegen eine Datenbank, in der schon etwas steht?
 *
 * Das Skript ist ein Umzugswerkzeug für eine leere Datenbank. Es räumt alle
 * Tabellen leer — und weil die Fotos an den Pflanzen hängen, verschwinden sie
 * gleich mit. Deshalb die harte Regel: **enthält die Datenbank irgendetwas,
 * wird nicht importiert.**
 *
 * Eine frühere Fassung verglich nur Zeitstempel gegen die Sicherung. Das war
 * zu weich: direkt nach einer frischen Sicherung war nichts mehr „neuer" — und
 * der Import lief durch. Genau so sind am 3.8.2026 die Fotos verschwunden.
 */
async function leereDatenbankPruefen() {
  const bestand: [string, number][] = [];
  for (const [name, tabelle] of [
    ['Pflanzen', pflanzen],
    ['Pflegetermine', aktivitaeten],
    ['Ernten', ernten],
    ['Fotos', fotos],
  ] as const) {
    const [{ anzahl }] = await db
      .select({ anzahl: sql<number>`count(*)::int` })
      .from(tabelle);
    if (anzahl > 0) bestand.push([name, anzahl]);
  }

  if (bestand.length && !process.argv.includes('--wirklich')) {
    console.error(
      `\nABGEBROCHEN: In der Datenbank steht bereits etwas.\n\n` +
        bestand.map(([n, z]) => `    ${n.padEnd(16)} ${z}`).join('\n') +
        `\n\nDieses Skript räumt alle Tabellen leer und baut sie aus daten/ neu auf.\n` +
        `Fotos hängen an den Pflanzen und verschwänden mit — sie stehen in keiner\n` +
        `Sicherungsdatei und wären nur über "npm run fotos:import" wiederzubekommen,\n` +
        `soweit die Bilddateien noch in public/fotos/ liegen.\n\n` +
        `Wenn der Neuaufbau wirklich gewollt ist: --wirklich anhängen.`,
    );
    process.exit(1);
  }
}

async function main() {
  const stamm = JSON.parse(readFileSync(join(DATEN, 'pflanzen.json'), 'utf8'));
  const { datei, inhalt: sicherung } = neuesteSicherung();

  console.log(`Stammdaten : daten/pflanzen.json (Stand ${stamm.aktualisiert})`);
  console.log(`Sicherung  : daten/${datei} (${sicherung.gesichert})\n`);

  await leereDatenbankPruefen();

  const grundstock = stamm.grundstock ?? {};
  const browserDaten = sicherung.daten ?? {};

  // ── Leeren. Reihenfolge wegen der Fremdschlüssel.
  await db.delete(aktivitaeten);
  await db.delete(basisPflege);
  await db.delete(ernten);
  await db.delete(pflanzen);
  await db.delete(einstellungen);

  // ── Stammdaten
  const eigene: RohPflanze[] = browserDaten['garten:eigene'] ?? [];
  const alle: RohPflanze[] = [...stamm.pflanzen, ...eigene];

  await db.insert(pflanzen).values(
    alle.map((p) => ({
      id: String(p.id),
      name: String(p.name),
      emoji: (p.emoji as string) ?? null,
      standort: String(p.standort),
      kategorie: String(p.kategorie),
      anzahl: (p.anzahl as number) ?? 1,
      giessen: (p.giessen as string) ?? null,
      giessIntervallTage: (p.giess_intervall_tage as number) ?? null,
      giessHinweis: (p.giess_hinweis as string) ?? null,
      duengen: (p.duengen as string) ?? null,
      duenger: (p.duenger as string) ?? null,
      duengeIntervallTage: (p.duenge_intervall_tage as number) ?? null,
      duengeHinweis: (p.duenge_hinweis as string) ?? null,
      licht: (p.licht as string) ?? null,
      erde: (p.erde as string) ?? null,
      mehrjaehrig: Boolean(p.mehrjaehrig),
      winterhart: Boolean(p.winterhart),
      notizen: (p.notizen as string) ?? null,
      foto: (p.foto as string) ?? null,
      darstellung: darstellungAus(p),
    })),
  );
  console.log(`Pflanzen        : ${alle.length}`);

  // ── Pflegehistorie
  const pflege = pflegeVereinen(
    grundstock.aktivitaet ?? {},
    browserDaten['garten:aktivitaet'] ?? {},
  );
  const bekannteIds = new Set(alle.map((p) => String(p.id)));

  const ereignisse: (typeof aktivitaeten.$inferInsert)[] = [];
  const sockel: (typeof basisPflege.$inferInsert)[] = [];

  for (const [id, stand] of Object.entries(pflege)) {
    if (!bekannteIds.has(id)) {
      console.warn(`  ! Historie für unbekannte Pflanze "${id}" übersprungen`);
      continue;
    }
    const rest = { nGegossen: 0, nGeduengt: 0 };

    for (const [feld, art, zaehler, ziel] of [
      ['gegossen', 'gegossen', 'n_gegossen', 'nGegossen'],
      ['geduengt', 'geduengt', 'n_geduengt', 'nGeduengt'],
    ] as const) {
      const datum = stand[feld];
      const n = stand[zaehler] ?? 0;

      if (datum) {
        // Der letzte Termin ist als echtes Ereignis bekannt.
        ereignisse.push({ pflanzeId: id, art, zeitpunkt: new Date(datum) });
        // Alles davor kennt nur der Zähler — Datum unbekannt, also Sockel.
        rest[ziel] = Math.max(0, (n || 1) - 1);
      } else {
        rest[ziel] = n;
      }
    }

    if (rest.nGegossen || rest.nGeduengt) {
      sockel.push({
        pflanzeId: id,
        nGegossen: rest.nGegossen,
        nGeduengt: rest.nGeduengt,
        quelle: `artefakt/${datei}`,
      });
    }
  }

  if (ereignisse.length) await db.insert(aktivitaeten).values(ereignisse);
  if (sockel.length) await db.insert(basisPflege).values(sockel);

  const sockelGiessen = sockel.reduce((s, x) => s + x.nGegossen!, 0);
  const sockelDuengen = sockel.reduce((s, x) => s + x.nGeduengt!, 0);
  console.log(
    `Pflegetermine   : ${ereignisse.length} mit bekanntem Datum` +
      ` + ${sockelGiessen + sockelDuengen} als Sockel ohne Datum`,
  );

  // ── Ernten
  const geloescht = new Set<number>([
    ...(grundstock.geloescht ?? []),
    ...(browserDaten['garten:geloescht'] ?? []),
  ]);
  const alleErnten = erntenVereinen(
    grundstock.ernte ?? [],
    browserDaten['garten:ernte'] ?? [],
    geloescht,
  ).filter((e) => {
    if (bekannteIds.has(e.pflanzeId)) return true;
    console.warn(`  ! Ernte für unbekannte Pflanze "${e.pflanzeId}" übersprungen`);
    return false;
  });

  if (alleErnten.length) {
    await db.insert(ernten).values(
      alleErnten.map((e) => ({
        id: e.eid,
        pflanzeId: e.pflanzeId,
        datum: e.datum,
        menge: e.menge ?? null,
        notiz: e.notiz ?? null,
      })),
    );
  }
  console.log(`Ernten          : ${alleErnten.length} (${geloescht.size} gelöschte ausgelassen)`);

  // ── Einstellungen und alles, was sonst nirgends hinpasst
  await db.insert(einstellungen).values([
    { schluessel: 'thema', wert: browserDaten['garten:thema'] ?? 'herbarium' },
    { schluessel: 'standort_info', wert: stamm.standort_info ?? {} },
    { schluessel: 'geplant', wert: stamm.geplant ?? [] },
  ]);
  console.log(`Einstellungen   : Thema "${browserDaten['garten:thema'] ?? 'herbarium'}", Standortinfo, geplante Projekte\n`);

  // ── Gegenprobe: stimmen die Summen mit der Sicherung überein?
  const erwartetGiessen = Object.values(
    browserDaten['garten:aktivitaet'] ?? {},
  ).reduce((s: number, x) => s + ((x as Pflegestand).n_gegossen ?? 0), 0);
  const tatsaechlichGiessen =
    sockelGiessen + ereignisse.filter((e) => e.art === 'gegossen').length;

  console.log('Gegenprobe:');
  console.log(`  Gießvorgänge laut Sicherung : ${erwartetGiessen}`);
  console.log(`  Gießvorgänge in der Datenbank: ${tatsaechlichGiessen}`);
  if (erwartetGiessen !== tatsaechlichGiessen) {
    throw new Error('Summen stimmen nicht überein — Import abgebrochen.');
  }
  console.log('  ✓ stimmt überein\n');
}

main()
  .then(() => {
    console.log('Umzug abgeschlossen.');
    process.exit(0);
  })
  .catch((e) => {
    console.error('\nFEHLGESCHLAGEN:', e);
    process.exit(1);
  });
