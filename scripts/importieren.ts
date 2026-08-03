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
import { db } from '../lib/db';
import {
  pflanzen,
  aktivitaeten,
  basisPflege,
  ernten,
  einstellungen,
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

async function main() {
  const stamm = JSON.parse(readFileSync(join(DATEN, 'pflanzen.json'), 'utf8'));
  const { datei, inhalt: sicherung } = neuesteSicherung();

  console.log(`Stammdaten : daten/pflanzen.json (Stand ${stamm.aktualisiert})`);
  console.log(`Sicherung  : daten/${datei} (${sicherung.gesichert})\n`);

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
