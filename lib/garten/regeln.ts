/**
 * Die Spielregeln des Gartens — Wuchsstufen, Gieß- und Düngepläne, Fälligkeiten.
 *
 * Übernommen aus dem ursprünglichen Artefakt (daten/dashboard-original.html).
 * Reine Berechnung ohne Zustand: dieselben Eingaben ergeben immer dasselbe
 * Ergebnis, egal ob auf dem Server oder im Browser gerechnet wird.
 */

/** Wie oft gegossen wird, wenn die Pflanze kein eigenes Intervall mitbringt. */
export const GIESS_STANDARD: Record<string, number> = {
  viel: 2,
  mittel: 4,
  wenig: 10,
  hydro: 10,
};

export const STUFEN = [
  'Sämling',
  'Jungpflanze',
  'kräftig',
  'üppig',
  'ausgewachsen',
  'Prachtstück',
  'Riese',
] as const;
export const MAX_STUFE = STUFEN.length;

/** Ab so vielen geernteten Stücken hat die Ranke den oberen Bildrand erreicht. */
export const ZIEL_ERNTEN = 36;

export type Pflanze = {
  id: string;
  name: string;
  emoji: string | null;
  standort: string;
  kategorie: string;
  anzahl: number;
  giessen: string | null;
  giess_intervall_tage: number | null;
  giess_hinweis: string | null;
  duengen: string | null;
  duenger: string | null;
  duenge_intervall_tage: number | null;
  duenge_hinweis: string | null;
  licht: string | null;
  erde: string | null;
  mehrjaehrig: boolean;
  winterhart: boolean;
  notizen: string | null;
  foto: string | null;
  // Zeichnerische Parameter — im Datenmodell unter `darstellung` gebündelt,
  // hier flach, damit die Zeichenlogik unverändert aus dem Artefakt passt.
  mindeststufe?: number;
  wuchshoehe?: number;
  dichte?: number;
  blatt_bonus?: number;
  trieb_kuerzen?: number;
  sonderfrucht?: string;
  bluete_groesse?: number;
  blueht?: boolean;
  verzweigt?: boolean;
  pflanzen_im_topf?: number;
  topf_mit?: string;
};

/** Zusammengefasster Pflegestand: letzte Termine plus Gesamtzahlen. */
export type Pflegestand = {
  gegossen?: string;
  geduengt?: string;
  n_gegossen: number;
  n_geduengt: number;
};

export type Ernte = {
  id: number;
  pflanzeId: string;
  datum: string;
  menge: string | null;
  notiz: string | null;
};

export type Garten = {
  pflanzen: Pflanze[];
  pflege: Record<string, Pflegestand>;
  ernten: Ernte[];
};

// ── Zeit ────────────────────────────────────────────────────

export const heute = () => new Date().toISOString().slice(0, 10);

export const tageSeit = (iso?: string | null) =>
  iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 864e5) : null;

export function seitText(iso?: string | null) {
  const t = tageSeit(iso);
  if (t === null) return 'noch nie';
  if (t === 0) return 'heute';
  if (t === 1) return 'gestern';
  return `vor ${t} Tagen`;
}

export function haeufigkeit(tage?: number | null) {
  if (!tage) return '—';
  if (tage === 1) return 'täglich';
  if (tage === 2) return 'alle 2 Tage';
  if (tage === 7) return 'wöchentlich';
  if (tage === 14) return 'alle 2 Wochen';
  if (tage >= 28 && tage % 7 === 0) return `alle ${tage / 7} Wochen`;
  return `alle ${tage} Tage`;
}

export function relText(iso: string) {
  const t = Math.round(
    (new Date(iso + 'T12:00:00').getTime() - new Date(heute() + 'T12:00:00').getTime()) / 864e5,
  );
  if (t < -1) return `${Math.abs(t)} Tage überfällig`;
  if (t === -1) return 'seit gestern fällig';
  if (t === 0) return 'heute';
  if (t === 1) return 'morgen';
  if (t <= 13) return `in ${t} Tagen`;
  return `in ${Math.round(t / 7)} Wochen`;
}

// ── Die beiden Pläne ────────────────────────────────────────
// Gießen und Düngen funktionieren gleich; nur Feld, Intervall und Text
// unterscheiden sich.

export type PlanArt = 'giessplan' | 'duengeplan';

export const PLAENE = {
  giessplan: {
    feld: 'gegossen' as const,
    verb: 'gegossen',
    intervall: (p: Pflanze) =>
      p.giess_intervall_tage || GIESS_STANDARD[p.giessen ?? ''] || 4,
    gilt: () => true,
    hinweis: (): string | null => null,
    fuss:
      'Das sind Sommer-Richtwerte für heiße Tage. Bei Regen, Bewölkung oder im Herbst darf alles deutlich länger warten — ' +
      'die Fingerprobe schlägt jeden Kalender. Zwei, drei Zentimeter tief fühlen: ist es dort noch feucht, warte noch.',
  },
  duengeplan: {
    feld: 'geduengt' as const,
    verb: 'gedüngt',
    intervall: (p: Pflanze) => p.duenge_intervall_tage ?? 0,
    gilt: (p: Pflanze) => !!p.duenge_intervall_tage,
    hinweis: (p: Pflanze) => (p.duenger && p.duenger !== '—' ? p.duenger : null),
    fuss:
      'Pflanzen ohne Düngebedarf stehen hier nicht — Rosmarin, Zitronenthymian, Käsekraut und die Krähen-Zwiebeln ' +
      'kommen ohne aus. Von Oktober bis Februar gilt der Plan nicht, dann ist Düngepause.',
  },
} satisfies Record<PlanArt, unknown> as {
  giessplan: {
    feld: 'gegossen';
    verb: string;
    intervall: (p: Pflanze) => number;
    gilt: (p: Pflanze) => boolean;
    hinweis: (p: Pflanze) => string | null;
    fuss: string;
  };
  duengeplan: {
    feld: 'geduengt';
    verb: string;
    intervall: (p: Pflanze) => number;
    gilt: (p: Pflanze) => boolean;
    hinweis: (p: Pflanze) => string | null;
    fuss: string;
  };
};

/** Wann ist diese Pflanze das nächste Mal dran? `null` = noch nie eingetragen. */
export function naechstes(p: Pflanze, art: PlanArt, pflege: Record<string, Pflegestand>) {
  const letzt = pflege[p.id]?.[PLAENE[art].feld];
  if (!letzt) return null;
  const d = new Date(letzt);
  d.setDate(d.getDate() + PLAENE[art].intervall(p));
  return d.toISOString().slice(0, 10);
}

export function status(p: Pflanze, pflege: Record<string, Pflegestand>) {
  const a = pflege[p.id];
  const gSoll = PLAENE.giessplan.intervall(p);
  const dSoll = p.duenge_intervall_tage;
  const gT = tageSeit(a?.gegossen);
  const dT = tageSeit(a?.geduengt);
  const giessFaellig = gT === null || gT >= gSoll;
  const duengFaellig = !!dSoll && (dT === null || dT >= dSoll);
  return {
    gT,
    dT,
    gSoll,
    dSoll,
    giessFaellig,
    duengFaellig,
    giessBald: !giessFaellig && gT !== null && gT >= gSoll - 1,
    irgendwas: giessFaellig || duengFaellig,
  };
}

/** War die Pflanze an diesem Datum schon fällig? Ohne bisherigen Eintrag: ja. */
export function faelligAm(
  p: Pflanze,
  art: PlanArt,
  datum: string,
  pflege: Record<string, Pflegestand>,
) {
  if (!PLAENE[art].gilt(p)) return false;
  const n = naechstes(p, art, pflege);
  return !n || n <= datum;
}

// ── Wachstum ────────────────────────────────────────────────

/** Aus „6 Stück" wird sechsmal dasselbe Symbol — aber gedeckelt. */
export function anzahlAus(menge?: string | null) {
  const m = String(menge ?? '').match(/(\d+)/);
  const n = m ? parseInt(m[1], 10) : 1;
  return n >= 1 && n <= 15 ? n : 1;
}

/**
 * Pflege zahlt auf das Wachstum ein: Düngen zählt doppelt, Ernten vierfach.
 * Die Gewichtung stammt aus dem Artefakt und bleibt, damit Annes Pflanzen
 * nicht über Nacht die Stufe wechseln.
 */
export function wuchsPunkte(p: Pflanze, garten: Garten) {
  const a = garten.pflege[p.id];
  const ernten = garten.ernten
    .filter((e) => e.pflanzeId === p.id)
    .reduce((s, e) => s + anzahlAus(e.menge), 0);
  return (a?.n_gegossen ?? 0) + 2 * (a?.n_geduengt ?? 0) + 4 * ernten;
}

export function wuchsStufe(p: Pflanze, garten: Garten) {
  // `mindeststufe` hebt Pflanzen an, die draußen längst ausgewachsen sind
  return Math.max(
    p.mindeststufe || 1,
    1 + Math.min(MAX_STUFE - 1, Math.floor(wuchsPunkte(p, garten) / 4)),
  );
}

/** Wie weit ist die Ranke am Bildschirmrand gewachsen? 0 … 1 */
export function wachstum(ernten: Ernte[]) {
  const n = ernten.reduce((s, e) => s + anzahlAus(e.menge), 0);
  return Math.min(1, 0.16 + 0.84 * (n / ZIEL_ERNTEN));
}

/** Teilt sich eine andere Pflanze den Topf mit dieser? */
export function mitTopf(p: Pflanze, pflanzen: Pflanze[]) {
  return pflanzen.find((x) => x.topf_mit === p.id);
}

/**
 * Wann wurde diese Pflanze zuletzt angefasst? Gießen, Düngen und Ernten zählen
 * gleichermaßen. Wer sich einen Topf teilt, rückt gemeinsam nach vorn.
 */
export function letzteInteraktion(p: Pflanze, garten: Garten, tiefe = 0): number {
  const a = garten.pflege[p.id];
  let neuste = 0;
  for (const feld of ['gegossen', 'geduengt'] as const) {
    if (a?.[feld]) neuste = Math.max(neuste, new Date(a[feld]!).getTime());
  }
  for (const e of garten.ernten) {
    if (e.pflanzeId === p.id) neuste = Math.max(neuste, e.id || 0);
  }
  // Schutz gegen zwei Pflanzen, die sich gegenseitig als Topfpartner eintragen
  if (tiefe < 2) {
    const gast = mitTopf(p, garten.pflanzen);
    if (gast) neuste = Math.max(neuste, letzteInteraktion(gast, garten, tiefe + 1));
  }
  return neuste;
}
