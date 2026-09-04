'use client';

import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from 'react';
import { portraet } from '@/lib/garten/portraet';
import { verkleinern, groesse } from '@/lib/garten/bild-verkleinern';
import { fruchtFuer } from '@/lib/garten/fruechte';
import { rankeSVG, rankenHoehe, rankenWachsen } from '@/lib/garten/ranken';
import {
  MAX_STUFE,
  PLAENE,
  STUFEN,
  anzahlAus,
  faelligAm,
  fotosVon,
  haeufigkeit,
  heute,
  letzteInteraktion,
  mitTopf,
  naechstes,
  relText,
  status,
  wachstum,
  wuchsStufe,
  type Ernte,
  type FotoInfo,
  type Garten,
  type Pflanze,
  type PlanArt,
} from '@/lib/garten/regeln';
import {
  ernteEintragen,
  ernteLoeschen,
  fotoDatumSetzen,
  fotoHochladen,
  fotoLoeschen,
  pflegeEintragen,
  sammelPflege,
  themaSetzen,
} from './aktionen';

type Eigenschaften = {
  garten: Garten;
  thema: string;
  standort: { balkon?: string; besonderheiten?: string };
  darfSchreiben: boolean;
};

/** Was gerade groß angezeigt wird. */
type Lupenbild = { foto: FotoInfo; pflanze: Pflanze | null };

const REITER = [
  ['pflanzen', 'Pflanzen'],
  ['giessplan', 'Gießplan'],
  ['duengeplan', 'Düngeplan'],
  ['ernte', 'Ernte'],
] as const;

const ESSBAR = ['Gemüse', 'Obst', 'Kraut', 'Salat'];

/** SVG-Zeichenketten der Zeichenlogik einbetten. */
const svg = (inhalt: string) => ({ dangerouslySetInnerHTML: { __html: inhalt } });

/**
 * Wird mit dem Finger bedient? Am Handy lohnt ein eigener Kamera-Knopf, am
 * Laptop nicht — dort führte er nur zum selben Dateidialog.
 *
 * Auf dem Server ist die Frage nicht beantwortbar; dort gilt „nein", damit die
 * erste Darstellung im Browser dazu passt und nichts nachträglich umspringt.
 */
function useBeruehrung() {
  return useSyncExternalStore(
    (melden) => {
      const abfrage = window.matchMedia('(pointer: coarse)');
      abfrage.addEventListener('change', melden);
      return () => abfrage.removeEventListener('change', melden);
    },
    () => window.matchMedia('(pointer: coarse)').matches,
    () => false,
  );
}

export default function GartenAnsicht({
  garten,
  thema: themaAnfang,
  standort,
  darfSchreiben,
}: Eigenschaften) {
  const [tab, setTab] = useState<string>('pflanzen');
  const [filter, setFilter] = useState('alle');
  const [offen, setOffen] = useState<string | null>(null);
  const [thema, setThema] = useState(themaAnfang);
  const [lupe, setLupe] = useState<Lupenbild | null>(null);
  const [, uebergang] = useTransition();

  // ── Ranken ──────────────────────────────────────────────
  const linksRef = useRef<HTMLDivElement>(null);
  const rechtsRef = useRef<HTMLDivElement>(null);
  const anteil = wachstum(garten.ernten);

  useEffect(() => {
    const zeichnen = () => {
      const hoehe = rankenHoehe();
      if (linksRef.current) linksRef.current.innerHTML = rankeSVG(0, hoehe);
      if (rechtsRef.current) rechtsRef.current.innerHTML = rankeSVG(1, hoehe);
      // Erst im nächsten Bild wachsen lassen, sonst springt die Ranke auf ihre
      // Endlänge statt hineinzuwachsen.
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          rankenWachsen([linksRef.current, rechtsRef.current], anteil),
        ),
      );
    };
    zeichnen();
    window.addEventListener('resize', zeichnen);
    return () => window.removeEventListener('resize', zeichnen);
  }, [anteil]);

  // ── Kennzahlen ──────────────────────────────────────────
  const zuTun = garten.pflanzen.filter((p) => status(p, garten.pflege).irgendwas).length;
  const draussen = garten.pflanzen.filter((p) => p.standort === 'draussen').length;

  function themaWaehlen(t: string) {
    setThema(t);
    if (darfSchreiben) uebergang(() => void themaSetzen(t));
  }

  return (
    <div id="garten" data-thema={thema}>
      <div className="themen">
        {(['herbarium', 'nacht', 'jugendstil'] as const).map((t) => (
          <div
            key={t}
            className={`tupfen${thema === t ? ' aktiv' : ''}`}
            data-t={t}
            title={{ herbarium: 'Herbarium', nacht: 'Nachtgarten', jugendstil: 'Jugendstil' }[t]}
            onClick={() => themaWaehlen(t)}
          />
        ))}
      </div>

      {lupe && (
        <Lupe bild={lupe} schliessen={() => setLupe(null)} darfSchreiben={darfSchreiben} />
      )}

      <div className="ranke links" ref={linksRef} />
      <div className="ranke rechts" ref={rechtsRef} />

      <div className="huelle">
        <div className="kopf">
          <div>
            <h1>
              Balkonpflanzen <em>&amp;</em> Zimmerpflanzen
            </h1>
            <div className="zierlinie">
              <i />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                <path d="M12 21V9" />
                <path d="M12 12C12 12 5 11 5 5C11 5 12 12 12 12Z" fill="currentColor" fillOpacity=".2" />
                <path d="M12 15C12 15 19 14 19 8C13 8 12 15 12 15Z" fill="currentColor" fillOpacity=".2" />
              </svg>
              <i />
            </div>
            <div className="untertitel">{standort.balkon}</div>
          </div>
          <div className="zahlen">
            <Zahl wert={garten.pflanzen.length} name="Pflanzen" />
            <Zahl wert={draussen} name="draußen" />
            <Zahl wert={zuTun} name="zu tun" warnen={zuTun > 0} />
            <Zahl wert={garten.ernten.length} name="Ernten" />
          </div>
        </div>

        <div className="beet-huelle">
          <Beet garten={garten} />
        </div>

        <div className="vitrine-huelle">
          <Vitrine garten={garten} anteil={anteil} />
        </div>

        <div className="reiter">
          {REITER.map(([k, t]) => (
            <button key={k} className={tab === k ? 'aktiv' : ''} onClick={() => setTab(k)}>
              {t}
            </button>
          ))}
        </div>

        <div className="inhalt">
          {tab === 'ernte' ? (
            <ErnteAnsicht garten={garten} darfSchreiben={darfSchreiben} />
          ) : tab === 'giessplan' || tab === 'duengeplan' ? (
            <PlanAnsicht art={tab} garten={garten} darfSchreiben={darfSchreiben} />
          ) : (
            <ListenAnsicht
              garten={garten}
              filter={filter}
              setFilter={setFilter}
              offen={offen}
              setOffen={setOffen}
              setLupe={setLupe}
              darfSchreiben={darfSchreiben}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Foto groß ─────────────────────────────────────────────

function Lupe({
  bild,
  schliessen,
  darfSchreiben,
}: {
  bild: Lupenbild;
  schliessen: () => void;
  darfSchreiben: boolean;
}) {
  const { foto, pflanze } = bild;
  const [datum, setDatum] = useState(foto.aufgenommenAm ?? heute());
  const [läuft, uebergang] = useTransition();

  // Mit Escape schließen — schneller als zum Rand zu zielen.
  useEffect(() => {
    const taste = (e: KeyboardEvent) => e.key === 'Escape' && schliessen();
    window.addEventListener('keydown', taste);
    return () => window.removeEventListener('keydown', taste);
  }, [schliessen]);

  return (
    <div className="lupe" onClick={schliessen}>
      {/* Innerhalb nicht schließen — sonst verschwindet das Bild beim Tippen
          ins Datumsfeld. */}
      <figure onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/bild/${foto.id}`} alt={pflanze?.name ?? 'Gartenfoto'} />
        <figcaption>
          {pflanze?.name ?? 'Gartenfoto'}
          <small>
            {foto.aufgenommenAm
              ? new Date(foto.aufgenommenAm + 'T12:00:00').toLocaleDateString('de-DE', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })
              : 'Aufnahmedatum unbekannt'}
          </small>
          {foto.notiz && <small>{foto.notiz}</small>}
        </figcaption>

        {darfSchreiben && (
          <div className="lupe-werkzeug">
            <input
              type="date"
              value={datum}
              onChange={(e) => setDatum(e.target.value)}
              aria-label="Aufnahmedatum"
            />
            <button
              className="knopf"
              disabled={läuft || datum === foto.aufgenommenAm}
              onClick={() => uebergang(async () => void (await fotoDatumSetzen(foto.id, datum)))}
            >
              {foto.aufgenommenAm ? 'Datum ändern' : 'Datum eintragen'}
            </button>
            <button
              className="knopf zweit"
              disabled={läuft}
              onClick={() =>
                uebergang(async () => {
                  await fotoLoeschen(foto.id);
                  schliessen();
                })
              }
            >
              Foto entfernen
            </button>
          </div>
        )}
      </figure>
    </div>
  );
}

function Zahl({ wert, name, warnen }: { wert: number; name: string; warnen?: boolean }) {
  return (
    <div className={`zahl${warnen ? ' warn' : ''}`}>
      <b>{wert}</b>
      <span>{name}</span>
    </div>
  );
}

// ── Beet ──────────────────────────────────────────────────

function Beet({ garten }: { garten: Garten }) {
  // Zuletzt Gepflegtes steht links; noch nie Angefasstes sortiert sich
  // dahinter nach Wuchsstufe ein.
  const liste = garten.pflanzen
    .filter((p) => !p.topf_mit)
    .sort(
      (a, b) =>
        letzteInteraktion(b, garten) - letzteInteraktion(a, garten) ||
        wuchsStufe(b, garten) - wuchsStufe(a, garten),
    );
  const gesamt = liste.reduce((s, p) => s + wuchsStufe(p, garten), 0);
  const schnitt = (gesamt / (liste.length || 1)).toFixed(1);

  return (
    <div className="beet">
      <div className="beet-kopf">
        <span className="beet-titel">Mein Beet</span>
        <span className="beet-zahl">Ø Stufe {schnitt}</span>
        <span className="beet-hinweis">
          Zuletzt gepflegt steht links — Gießen, Düngen und Ernten lassen sie wachsen
        </span>
      </div>
      <div className="brett">
        {liste.map((p, i) => {
          const gast = mitTopf(p, garten.pflanzen);
          const stufe = wuchsStufe(p, garten);
          return (
            <div
              key={p.id}
              className="topf"
              style={{ animationDelay: `${Math.min(i * 32, 900)}ms` }}
              title={`${p.name}${gast ? ' + ' + gast.name : ''} — ${STUFEN[stufe - 1]} (Stufe ${stufe} von ${MAX_STUFE})`}
            >
              <div {...svg(portraet(p, garten))} />
              <div className="topf-name">
                {p.name.split(' (')[0]}
                {gast ? ' +1' : ''}
              </div>
            </div>
          );
        })}
      </div>
      <div className="erdlinie" />
    </div>
  );
}

// ── Ernte-Vitrine ─────────────────────────────────────────

function Vitrine({ garten, anteil }: { garten: Garten; anteil: number }) {
  const sorten = new Set(garten.ernten.map((e) => e.pflanzeId)).size;

  let stuecke: { id: string; titel: string }[] = [];
  for (const e of garten.ernten) {
    const p = garten.pflanzen.find((x) => x.id === e.pflanzeId);
    const dat = new Date(e.datum + 'T00:00:00').toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'long',
    });
    const titel = `${p ? p.name : 'unbekannt'} · ${dat}${e.menge ? ' · ' + e.menge : ''}${e.notiz ? ' — ' + e.notiz : ''}`;
    for (let i = 0; i < anzahlAus(e.menge); i++) stuecke.push({ id: e.pflanzeId, titel });
  }
  stuecke.reverse(); // älteste zuerst, wächst nach rechts
  const rest = Math.max(0, stuecke.length - 120);
  stuecke = stuecke.slice(-120);

  return (
    <div className="vitrine">
      <div className="vitrine-kopf">
        <span className="vitrine-titel">Ernte-Vitrine</span>
        <span className="vitrine-zahl">
          {garten.ernten.length} Ernten · {sorten} Sorten
        </span>
        <span className="vitrine-wachstum">
          Die Ranke ist zu {Math.round(anteil * 100)} % gewachsen
        </span>
      </div>
      {stuecke.length ? (
        <div className="regal">
          {stuecke.map((s, i) => (
            <div
              key={i}
              className="frucht"
              style={{ animationDelay: `${Math.min(i * 22, 1400)}ms` }}
              title={s.titel}
            >
              <svg viewBox="0 0 30 30" {...svg(fruchtFuer(s.id))} />
            </div>
          ))}
          {rest > 0 && <span className="mehr">+{rest}</span>}
        </div>
      ) : (
        <div className="vitrine-leer">
          Noch leer. Was du im Reiter „Ernte“ einträgst, erscheint hier — und lässt die Ranken
          am Rand weiterwachsen.
        </div>
      )}
    </div>
  );
}

// ── Pflanzenliste ─────────────────────────────────────────

function ListenAnsicht({
  garten,
  filter,
  setFilter,
  offen,
  setOffen,
  setLupe,
  darfSchreiben,
}: {
  garten: Garten;
  filter: string;
  setFilter: (f: string) => void;
  offen: string | null;
  setOffen: (id: string | null) => void;
  setLupe: (b: Lupenbild | null) => void;
  darfSchreiben: boolean;
}) {
  let liste = garten.pflanzen;
  if (filter === 'draussen') liste = liste.filter((p) => p.standort === 'draussen');
  if (filter === 'drinnen') liste = liste.filter((p) => p.standort === 'drinnen');
  if (filter === 'essbar') liste = liste.filter((p) => ESSBAR.includes(p.kategorie));

  return (
    <>
      <div className="filter">
        {[
          ['alle', 'Alle'],
          ['draussen', 'Balkon'],
          ['drinnen', 'Drinnen'],
          ['essbar', 'Essbar'],
        ].map(([k, t]) => (
          <button
            key={k}
            className={`chip${filter === k ? ' aktiv' : ''}`}
            onClick={() => setFilter(k)}
          >
            {t}
          </button>
        ))}
      </div>

      {liste.length ? (
        liste.map((p) => {
          const stufe = wuchsStufe(p, garten);
          const bilder = fotosVon(p.id, garten.fotos);
          // In der Zeile das jüngste Bild — das zeigt den heutigen Zustand.
          const neustes = bilder[bilder.length - 1];
          return (
            <div key={p.id}>
              <div className="zeile" onClick={() => setOffen(offen === p.id ? null : p.id)}>
                <div className="mini" title={STUFEN[stufe - 1]} {...svg(portraet(p, garten, true))} />
                <div>
                  <div className="titelzeile">
                    <span className="pname">
                      {p.emoji || '🌿'} {p.name}
                    </span>
                    {p.anzahl > 1 && <span className="marke">{p.anzahl}×</span>}
                    <span className="marke">
                      {p.standort === 'draussen' ? 'Balkon' : 'drinnen'}
                    </span>
                    <span className="marke">{STUFEN[stufe - 1]}</span>
                  </div>
                </div>
                {neustes ? (
                  <div
                    className="foto"
                    title={`Foto vergrößern${bilder.length > 1 ? ` (${bilder.length} insgesamt)` : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setLupe({ foto: neustes, pflanze: p });
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/bild/${neustes.id}${neustes.hatVorschau ? '?klein' : ''}`}
                      alt={p.name}
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="foto-leer" title="noch kein Foto" />
                )}
              </div>
              {offen === p.id && (
                <Detail
                  p={p}
                  garten={garten}
                  setLupe={setLupe}
                  darfSchreiben={darfSchreiben}
                />
              )}
            </div>
          );
        })
      ) : (
        <div className="leer">Keine Pflanzen in dieser Auswahl.</div>
      )}

      <div className="fussnote">
        Ein Klick auf eine Zeile öffnet Erdmischung, Licht, Rhythmen und Notizen. Ein Klick
        aufs Foto zeigt es groß.
      </div>
    </>
  );
}

function Detail({
  p,
  garten,
  setLupe,
  darfSchreiben,
}: {
  p: Pflanze;
  garten: Garten;
  setLupe: (b: Lupenbild | null) => void;
  darfSchreiben: boolean;
}) {
  const stufe = wuchsStufe(p, garten);
  const ernten = garten.ernten.filter((e) => e.pflanzeId === p.id).length;
  const zeile = (t: string, w?: string | null) =>
    w ? (
      <div className="dz" key={t}>
        <dt>{t}</dt>
        <dd>{w}</dd>
      </div>
    ) : null;

  return (
    <div className="detail">
      {zeile(
        'Gießen',
        `${haeufigkeit(PLAENE.giessplan.intervall(p))}${p.giess_hinweis ? ' — ' + p.giess_hinweis : ''}`,
      )}
      {zeile('Erde', p.erde)}
      {zeile('Licht', p.licht)}
      {zeile('Dünger', p.duenge_hinweis)}
      {zeile(
        'Art',
        [
          p.kategorie,
          p.mehrjaehrig ? 'mehrjährig' : 'einjährig',
          p.winterhart ? 'winterhart' : null,
        ]
          .filter(Boolean)
          .join(' · '),
      )}
      {p.notizen && (
        <div className="dz">
          <dt>Notiz</dt>
          <dd className="notiz">{p.notizen}</dd>
        </div>
      )}
      {ernten > 0 && zeile('Geerntet', `${ernten}× bisher`)}
      {zeile('Wuchs', `Stufe ${stufe} von ${MAX_STUFE} — ${STUFEN[stufe - 1]}`)}
      <Verlauf p={p} garten={garten} setLupe={setLupe} darfSchreiben={darfSchreiben} />
    </div>
  );
}

// ── Wachstumsverlauf ──────────────────────────────────────

function Verlauf({
  p,
  garten,
  setLupe,
  darfSchreiben,
}: {
  p: Pflanze;
  garten: Garten;
  setLupe: (b: Lupenbild | null) => void;
  darfSchreiben: boolean;
}) {
  const bilder = fotosVon(p.id, garten.fotos);
  const dateiwahl = useRef<HTMLInputElement>(null);
  const kamerawahl = useRef<HTMLInputElement>(null);
  const amHandy = useBeruehrung();
  const [arbeitet, setArbeitet] = useState(false);
  const [fehler, setFehler] = useState('');
  const [bilanz, setBilanz] = useState('');
  const [, uebergang] = useTransition();

  async function ausgewaehlt(e: React.ChangeEvent<HTMLInputElement>) {
    const dateien = Array.from(e.target.files ?? []);
    e.target.value = ''; // damit dasselbe Bild erneut gewählt werden kann
    if (!dateien.length) return;

    setFehler('');
    setBilanz('');
    setArbeitet(true);
    let vorher = 0;
    let nachher = 0;
    try {
      for (const datei of dateien) {
        const { gross, klein, breite, hoehe } = await verkleinern(datei);
        vorher += datei.size;
        nachher += gross.size + klein.size;

        const formular = new FormData();
        formular.set('pflanzeId', p.id);
        // Der Server erkennt das Format an den ersten Bytes; der Name dient
        // nur der Lesbarkeit im Netzwerkprotokoll.
        const endung = gross.type === 'image/webp' ? 'webp' : 'jpg';
        formular.set('bild', gross, `foto.${endung}`);
        formular.set('vorschau', klein, `vorschau.${endung}`);
        formular.set('breite', String(breite));
        formular.set('hoehe', String(hoehe));
        // Das Änderungsdatum der Datei ist bei Handyfotos der Aufnahmetag.
        formular.set(
          'datum',
          new Date(datei.lastModified || Date.now()).toISOString().slice(0, 10),
        );
        await fotoHochladen(formular);
      }
      setBilanz(
        `${dateien.length === 1 ? 'Foto' : `${dateien.length} Fotos`} gespeichert — ` +
          `aus ${groesse(vorher)} wurden ${groesse(nachher)}.`,
      );
      uebergang(() => {});
    } catch (e) {
      setFehler(e instanceof Error ? e.message : 'Das Hochladen hat nicht geklappt.');
    } finally {
      setArbeitet(false);
    }
  }

  if (!bilder.length && !darfSchreiben) return null;

  return (
    <div className="verlauf">
      <div className="verlauf-kopf">
        <span className="verlauf-titel">Wachstumsverlauf</span>
        {bilder.length > 0 && (
          <span className="verlauf-zahl">
            {bilder.length === 1 ? '1 Foto' : `${bilder.length} Fotos`}
            {bilder.some((f) => !f.aufgenommenAm) && ' · manche ohne Datum'}
          </span>
        )}
      </div>

      <div className="streifen">
        {bilder.map((f, i) => (
          <figure
            key={f.id}
            className={`verlauf-bild${f.aufgenommenAm ? '' : ' undatiert'}`}
            style={{ animationDelay: `${Math.min(i * 40, 500)}ms` }}
            onClick={() => setLupe({ foto: f, pflanze: p })}
            title={f.notiz ?? 'Foto vergrößern'}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/bild/${f.id}${f.hatVorschau ? '?klein' : ''}`}
              alt={p.name}
              loading="lazy"
            />
            <figcaption>
              {f.aufgenommenAm
                ? new Date(f.aufgenommenAm + 'T12:00:00').toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: 'short',
                  })
                : 'Datum fehlt'}
            </figcaption>
          </figure>
        ))}

        {darfSchreiben && (
          <>
            {amHandy && (
              <>
                <button
                  type="button"
                  className="foto-hinzu kamera"
                  disabled={arbeitet}
                  onClick={() => kamerawahl.current?.click()}
                >
                  <b>◉</b>
                  {arbeitet ? 'lädt …' : 'Kamera'}
                </button>
                {/* `capture="environment"` öffnet direkt die Rückkamera,
                    ohne den Umweg über die Auswahl Kamera/Galerie/Dateien. */}
                <input
                  ref={kamerawahl}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  hidden
                  onChange={ausgewaehlt}
                />
              </>
            )}
            <button
              type="button"
              className="foto-hinzu"
              disabled={arbeitet}
              onClick={() => dateiwahl.current?.click()}
            >
              <b>+</b>
              {arbeitet ? 'lädt …' : amHandy ? 'Galerie' : 'Foto'}
            </button>
            <input
              ref={dateiwahl}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={ausgewaehlt}
            />
          </>
        )}
      </div>

      {!bilder.length && darfSchreiben && (
        <div className="verlauf-leer">
          Noch kein Foto. Ab dem zweiten sieht man, wie sie sich macht.
        </div>
      )}
      {bilanz && <div className="verlauf-bilanz">{bilanz}</div>}
      {fehler && <div className="verlauf-fehler">{fehler}</div>}
    </div>
  );
}

// ── Gieß- und Düngeplan ───────────────────────────────────

function PlanAnsicht({
  art,
  garten,
  darfSchreiben,
}: {
  art: PlanArt;
  garten: Garten;
  darfSchreiben: boolean;
}) {
  const P = PLAENE[art];
  const [datum, setDatum] = useState(heute());
  const [läuft, uebergang] = useTransition();
  const [meldung, setMeldung] = useState('');

  const relevant = garten.pflanzen.filter(P.gilt);
  const nie = relevant.filter((p) => !naechstes(p, art, garten.pflege));
  const geplant = relevant.filter((p) => naechstes(p, art, garten.pflege));

  const nachDatum: Record<string, Pflanze[]> = {};
  for (const p of geplant) {
    const d = naechstes(p, art, garten.pflege)!;
    (nachDatum[d] ??= []).push(p);
  }

  const anzFaellig = garten.pflanzen.filter((p) =>
    faelligAm(p, art, datum, garten.pflege),
  ).length;

  const zeile = (p: Pflanze) => {
    const letzt = garten.pflege[p.id]?.[P.feld];
    const zusatz = P.hinweis(p);
    return (
      <div className="plan-zeile" key={p.id}>
        <button
          className="haken"
          title={darfSchreiben ? 'Heute erledigt' : 'Nur Anne kann eintragen'}
          disabled={!darfSchreiben || läuft}
          onClick={() =>
            uebergang(async () => {
              await pflegeEintragen(p.id, P.feld);
            })
          }
        >
          ✓
        </button>
        <span className="plan-name">
          {p.emoji || '🌿'} {p.name}
        </span>
        <span className="plan-info">
          <b>{haeufigkeit(P.intervall(p))}</b>
          {zusatz ? ` · ${zusatz}` : ''}
          <br />
          {letzt
            ? `zuletzt ${new Date(letzt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}`
            : 'noch nicht eingetragen'}
        </span>
      </div>
    );
  };

  function runde(nurFaellige: boolean) {
    uebergang(async () => {
      const n = await sammelPflege(art, datum, nurFaellige);
      setMeldung(`${n} ${n === 1 ? 'Pflanze' : 'Pflanzen'} eingetragen`);
    });
  }

  return (
    <>
      <div className="sammelaktion">
        <p>
          Eine Runde {P.verb}? Datum wählen und eintragen — auch rückwirkend. Erfasst werden nur
          die Pflanzen, die an diesem Tag fällig waren, und zwar mit genau diesem Datum. Der Plan
          rechnet die nächsten Termine daraus.
        </p>
        <div className="feld">
          <label>Datum</label>
          <input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} />
        </div>
        <button className="knopf" disabled={!darfSchreiben || läuft} onClick={() => runde(true)}>
          Fällige eintragen
        </button>
        <button
          className="knopf zweit"
          disabled={!darfSchreiben || läuft}
          onClick={() => runde(false)}
        >
          Wirklich alle
        </button>
        <span className="sammel-info">
          {meldung ||
            `${anzFaellig} ${anzFaellig === 1 ? 'Pflanze war' : 'Pflanzen waren'} an diesem Tag fällig`}
        </span>
      </div>

      {nie.length > 0 && (
        <div className="gruppe ueberfaellig">
          <div className="gruppe-kopf">
            <span className="gruppe-datum">Noch nicht eingetragen</span>
            <span className="gruppe-rel">{nie.length} Pflanzen</span>
          </div>
          {nie.map(zeile)}
        </div>
      )}

      {Object.keys(nachDatum)
        .sort()
        .map((d) => {
          const dat = new Date(d + 'T12:00:00');
          const diff = Math.round(
            (dat.getTime() - new Date(heute() + 'T12:00:00').getTime()) / 864e5,
          );
          return (
            <div
              key={d}
              className={`gruppe ${diff < 0 ? 'ueberfaellig' : diff === 0 ? 'heute' : ''}`}
            >
              <div className="gruppe-kopf">
                <span className="gruppe-datum">
                  {dat.toLocaleDateString('de-DE', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </span>
                <span className="gruppe-rel">{relText(d)}</span>
              </div>
              {nachDatum[d].map(zeile)}
            </div>
          );
        })}

      {!nie.length && !Object.keys(nachDatum).length && (
        <div className="leer">Keine Pflanze auf dem Plan.</div>
      )}

      <div className="fussnote">{P.fuss}</div>
    </>
  );
}

// ── Erntetagebuch ─────────────────────────────────────────

function ErnteAnsicht({ garten, darfSchreiben }: { garten: Garten; darfSchreiben: boolean }) {
  const essbar = garten.pflanzen.filter((p) => ESSBAR.includes(p.kategorie));
  const [pflanzeId, setPflanzeId] = useState(essbar[0]?.id ?? '');
  const [datum, setDatum] = useState(heute());
  const [menge, setMenge] = useState('');
  const [notiz, setNotiz] = useState('');
  const [läuft, uebergang] = useTransition();

  function eintragen() {
    if (!pflanzeId) return;
    uebergang(async () => {
      await ernteEintragen(pflanzeId, datum, menge, notiz);
      setMenge('');
      setNotiz('');
    });
  }

  return (
    <>
      <div className="formular">
        <div className="feld">
          <label>Pflanze</label>
          <select value={pflanzeId} onChange={(e) => setPflanzeId(e.target.value)}>
            {essbar.map((p) => (
              <option key={p.id} value={p.id}>
                {p.emoji || ''} {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="feld">
          <label>Datum</label>
          <input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} />
        </div>
        <div className="feld">
          <label>Menge</label>
          <input
            type="text"
            placeholder="6 Stück, 120 g …"
            value={menge}
            onChange={(e) => setMenge(e.target.value)}
          />
        </div>
        <div className="feld" style={{ flex: 1 }}>
          <label>Notiz</label>
          <input
            type="text"
            placeholder="Wie war's?"
            style={{ width: '100%' }}
            value={notiz}
            onChange={(e) => setNotiz(e.target.value)}
          />
        </div>
        <button className="knopf" disabled={!darfSchreiben || läuft} onClick={eintragen}>
          Eintragen
        </button>
      </div>

      {garten.ernten.length ? (
        garten.ernten.map((e) => (
          <ErnteZeile
            key={e.id}
            e={e}
            garten={garten}
            darfSchreiben={darfSchreiben}
            uebergang={uebergang}
            läuft={läuft}
          />
        ))
      ) : (
        <div className="leer">Noch keine Ernte eingetragen. Die erste Tomate zählt! 🍅</div>
      )}

      <div className="fussnote">
        Alle Einträge liegen in der Datenbank — sie bleiben erhalten, egal von welchem Gerät du
        schaust.
      </div>
    </>
  );
}

function ErnteZeile({
  e,
  garten,
  darfSchreiben,
  uebergang,
  läuft,
}: {
  e: Ernte;
  garten: Garten;
  darfSchreiben: boolean;
  uebergang: (f: () => void) => void;
  läuft: boolean;
}) {
  const p = garten.pflanzen.find((x) => x.id === e.pflanzeId);
  const d = new Date(e.datum + 'T00:00:00');
  return (
    <div className="ernte-zeile">
      <span className="ernte-datum">
        {d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: '2-digit' })}
      </span>
      <span className="ernte-was">{p ? `${p.emoji || ''} ${p.name}` : '—'}</span>
      {e.menge && <span className="ernte-menge">{e.menge}</span>}
      {e.notiz && <span className="ernte-notiz">{e.notiz}</span>}
      {darfSchreiben && (
        <button
          className="weg"
          title="Löschen"
          disabled={läuft}
          onClick={() =>
            uebergang(async () => {
              await ernteLoeschen(e.id);
            })
          }
        >
          ×
        </button>
      )}
    </div>
  );
}
