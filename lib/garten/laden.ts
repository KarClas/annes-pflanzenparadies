import { sql, eq, desc, asc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { pflanzen, aktivitaeten, basisPflege, ernten, einstellungen } from '@/lib/db/schema';
import type { Darstellung } from '@/lib/db/schema';
import type { Garten, Pflanze, Pflegestand } from './regeln';

/**
 * Die zeichnerischen Parameter landen als Zahlen direkt im erzeugten SVG.
 * Damit sich darüber nichts einschleusen lässt, werden sie hier auf ihren
 * erwarteten Typ festgenagelt — Zahl bleibt Zahl, alles Unbrauchbare fällt weg.
 *
 * Solange die Werte aus dem Import stammen, ist das reine Vorsorge. Sobald Anne
 * Pflanzen über ein Formular anlegt, ist es die eigentliche Absicherung.
 */
const ZAHLENFELDER = [
  'mindeststufe', 'wuchshoehe', 'dichte', 'blatt_bonus',
  'trieb_kuerzen', 'bluete_groesse', 'pflanzen_im_topf',
] as const;
const SONDERFRUECHTE = ['kaese', 'biene'];

function darstellungPruefen(roh: Darstellung): Darstellung {
  const sauber: Record<string, unknown> = {};
  for (const feld of ZAHLENFELDER) {
    const wert = Number(roh[feld]);
    if (Number.isFinite(wert)) sauber[feld] = wert;
  }
  if (typeof roh.blueht === 'boolean') sauber.blueht = roh.blueht;
  if (typeof roh.verzweigt === 'boolean') sauber.verzweigt = roh.verzweigt;
  if (roh.sonderfrucht && SONDERFRUECHTE.includes(roh.sonderfrucht)) {
    sauber.sonderfrucht = roh.sonderfrucht;
  }
  // `topf_mit` verweist auf eine andere Pflanze und wird nur verglichen,
  // nie gezeichnet — es darf so bleiben, wie es ist.
  if (typeof roh.topf_mit === 'string') sauber.topf_mit = roh.topf_mit;
  return sauber as Darstellung;
}

/**
 * Den gesamten Garten laden.
 *
 * Der Pflegestand wird aus zwei Quellen berechnet: den einzelnen Terminen in
 * `aktivitaeten` und dem übernommenen Sockel aus `basis_pflege` (siehe dort,
 * warum es ihn gibt). Beides zusammen ergibt die Zahlen, die das Wachstum
 * treiben.
 */
export type StandortInfo = { balkon?: string; besonderheiten?: string };

export async function gartenLaden(): Promise<
  Garten & { thema: string; standort: StandortInfo }
> {
  const [reihen, pflegeReihen, sockelReihen, ernteReihen, einstellungReihen] = await Promise.all([
    db.select().from(pflanzen).where(eq(pflanzen.aktiv, true)).orderBy(asc(pflanzen.name)),
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
    db.select().from(einstellungen),
  ]);

  const einstellung = <T,>(schluessel: string, ersatz: T): T =>
    (einstellungReihen.find((e) => e.schluessel === schluessel)?.wert as T) ?? ersatz;

  const pflege: Record<string, Pflegestand> = {};
  const holen = (id: string) =>
    (pflege[id] ??= { n_gegossen: 0, n_geduengt: 0 });

  for (const s of sockelReihen) {
    const e = holen(s.pflanzeId);
    e.n_gegossen += s.nGegossen;
    e.n_geduengt += s.nGeduengt;
  }
  for (const r of pflegeReihen) {
    const e = holen(r.pflanzeId);
    if (r.art === 'gegossen') {
      e.gegossen = new Date(r.letzter).toISOString();
      e.n_gegossen += r.anzahl;
    } else if (r.art === 'geduengt') {
      e.geduengt = new Date(r.letzter).toISOString();
      e.n_geduengt += r.anzahl;
    }
  }

  return {
    // Die zeichnerischen Parameter flach dazulegen, damit die aus dem Artefakt
    // übernommene Zeichenlogik unverändert damit arbeiten kann.
    pflanzen: reihen.map(
      (r): Pflanze => ({
        id: r.id,
        name: r.name,
        emoji: r.emoji,
        standort: r.standort,
        kategorie: r.kategorie,
        anzahl: r.anzahl,
        giessen: r.giessen,
        giess_intervall_tage: r.giessIntervallTage,
        giess_hinweis: r.giessHinweis,
        duengen: r.duengen,
        duenger: r.duenger,
        duenge_intervall_tage: r.duengeIntervallTage,
        duenge_hinweis: r.duengeHinweis,
        licht: r.licht,
        erde: r.erde,
        mehrjaehrig: r.mehrjaehrig,
        winterhart: r.winterhart,
        notizen: r.notizen,
        foto: r.foto,
        ...darstellungPruefen(r.darstellung),
      }),
    ),
    pflege,
    ernten: ernteReihen.map((e) => ({
      id: e.id,
      pflanzeId: e.pflanzeId,
      datum: e.datum,
      menge: e.menge,
      notiz: e.notiz,
    })),
    thema: einstellung<string>('thema', 'herbarium'),
    standort: einstellung<StandortInfo>('standort_info', {}),
  };
}
