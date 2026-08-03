import {
  pgTable,
  text,
  integer,
  boolean,
  bigint,
  serial,
  date,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';

/**
 * Die Stammdaten einer Pflanze — was sie ist und was sie braucht.
 *
 * Die `id` ist Annes ursprünglicher Slug ('tomaten', 'basilikum-2', …) und wird
 * niemals geändert: sämtliche Aktivitäten und Ernten hängen daran.
 */
export const pflanzen = pgTable('pflanzen', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  emoji: text('emoji'),

  standort: text('standort').notNull(),          // 'draussen' | 'drinnen'
  kategorie: text('kategorie').notNull(),
  anzahl: integer('anzahl').notNull().default(1),

  // Pflege — treibt Gieß- und Düngeplan
  giessen: text('giessen'),                       // 'viel' | 'mittel' | 'wenig' | 'hydro'
  giessIntervallTage: integer('giess_intervall_tage'),
  giessHinweis: text('giess_hinweis'),

  duengen: text('duengen'),                       // 'ja' | 'kaum' | 'selten' | 'nein'
  duenger: text('duenger'),
  duengeIntervallTage: integer('duenge_intervall_tage'),   // null = taucht im Düngeplan nicht auf
  duengeHinweis: text('duenge_hinweis'),

  // Standortbedingungen
  licht: text('licht'),
  erde: text('erde'),

  mehrjaehrig: boolean('mehrjaehrig').notNull().default(false),
  winterhart: boolean('winterhart').notNull().default(false),

  /**
   * Persönliches: Herkunft, Besonderheiten, was schon passiert ist.
   * Wird beim Bearbeiten ergänzt, nie überschrieben.
   */
  notizen: text('notizen'),

  foto: text('foto'),                             // Dateiname ohne Endung

  /**
   * Rein zeichnerische Parameter für das Pflanzenporträt:
   * mindeststufe, wuchshoehe, dichte, blatt_bonus, trieb_kuerzen,
   * sonderfrucht, bluete_groesse, blueht, verzweigt, pflanzen_im_topf, topf_mit.
   *
   * Bewusst als ein Feld: sie beschreiben die Darstellung, nicht die Pflanze,
   * sind dünn besetzt und kommen im Lauf der Zeit neue dazu.
   */
  darstellung: jsonb('darstellung').$type<Darstellung>().notNull().default({}),

  /** Ausgeräumte Pflanzen werden nicht gelöscht — die Historie soll bleiben. */
  aktiv: boolean('aktiv').notNull().default(true),

  angelegtAm: timestamp('angelegt_am', { withTimezone: true }).notNull().defaultNow(),
  geaendertAm: timestamp('geaendert_am', { withTimezone: true }).notNull().defaultNow(),
});

export type Darstellung = {
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

/**
 * Jede einzelne Pflegehandlung — ein Datensatz pro Gießen oder Düngen.
 *
 * Das Artefakt speicherte nur den letzten Termin plus einen Zähler. Einzelne
 * Ereignisse machen den Unterschied: Auswertungen werden möglich, und ein
 * versehentlicher Eintrag lässt sich zurücknehmen, statt einen Zähler zu
 * verfälschen.
 */
export const aktivitaeten = pgTable(
  'aktivitaeten',
  {
    id: serial('id').primaryKey(),
    pflanzeId: text('pflanze_id')
      .notNull()
      .references(() => pflanzen.id, { onDelete: 'cascade' }),
    art: text('art').notNull(),                   // 'gegossen' | 'geduengt'
    zeitpunkt: timestamp('zeitpunkt', { withTimezone: true }).notNull(),
    notiz: text('notiz'),
    erfasstAm: timestamp('erfasst_am', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('aktivitaeten_pflanze_art_idx').on(t.pflanzeId, t.art, t.zeitpunkt)],
);

/**
 * Übernommene Zählerstände aus dem Artefakt.
 *
 * Dort wurden nur Summen geführt, keine Einzeltermine — die 125 Gießvorgänge
 * und 31 Düngerunden aus Annes Sicherung lassen sich nicht in echte Ereignisse
 * zurückverwandeln. Statt sie zu verwerfen (womit jede Pflanze wieder bei
 * "Sämling" stünde) oder zu erfinden, stehen sie hier als ehrlicher Sockel.
 *
 * Die Wuchsstufe rechnet: Sockel + Anzahl echter Ereignisse.
 */
export const basisPflege = pgTable('basis_pflege', {
  pflanzeId: text('pflanze_id')
    .primaryKey()
    .references(() => pflanzen.id, { onDelete: 'cascade' }),
  nGegossen: integer('n_gegossen').notNull().default(0),
  nGeduengt: integer('n_geduengt').notNull().default(0),
  quelle: text('quelle').notNull(),
});

/**
 * Das Erntetagebuch.
 *
 * Die `id` ist die ursprüngliche `eid` aus dem Artefakt — beibehalten, damit
 * ältere Sicherungen sich weiterhin zuordnen lassen und keine Dubletten
 * entstehen.
 */
export const ernten = pgTable(
  'ernten',
  {
    id: bigint('id', { mode: 'number' }).primaryKey(),
    pflanzeId: text('pflanze_id')
      .notNull()
      .references(() => pflanzen.id, { onDelete: 'cascade' }),
    datum: date('datum').notNull(),
    menge: text('menge'),
    notiz: text('notiz'),
    erfasstAm: timestamp('erfasst_am', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('ernten_datum_idx').on(t.datum)],
);

/** Kleinkram: gewähltes Thema und Ähnliches. */
export const einstellungen = pgTable('einstellungen', {
  schluessel: text('schluessel').primaryKey(),
  wert: jsonb('wert').notNull(),
  geaendertAm: timestamp('geaendert_am', { withTimezone: true }).notNull().defaultNow(),
});

export type Pflanze = typeof pflanzen.$inferSelect;
export type NeuePflanze = typeof pflanzen.$inferInsert;
export type Aktivitaet = typeof aktivitaeten.$inferSelect;
export type Ernte = typeof ernten.$inferSelect;
