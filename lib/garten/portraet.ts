/**
 * Pflanzenporträts — Topf unten, darüber die Pflanze, Größe folgt der Wuchsstufe.
 *
 * Unverändert aus dem Artefakt übernommen (daten/dashboard-original.html).
 * Einziger Unterschied: statt auf einen globalen Zustand zuzugreifen, bekommt
 * die Funktion den Garten übergeben.
 *
 * Alles, was erst mit höheren Stufen dazukommt, trägt die Klasse `.wuchs` und
 * blendet sanft ein statt zu erscheinen.
 */
import { MAX_STUFE, wuchsStufe, type Garten, type Pflanze } from './regeln';

const BLATT = '#6E9B53';
const STIEL = '#4F7038';
const HELL = '#87B268';

const FRUCHTFARBE: Record<string, string> = {
  tomaten: '#C4482F',
  'tomaten-2': '#C4482F',
  paprika: '#B8443A',
  habanero: '#E08A2E',
  erdbeeren: '#C8394B',
  stachelbeere: '#9BB84A',
};

/** Bunt blühende Pflanzen — die Liste entscheidet, ob Blüten gezeichnet werden. */
const BLUETENFARBE: Record<string, string[]> = {
  calibrachoa: ['#D4569A', '#E8B33C', '#E0762F', '#8E5AA8', '#C8394B'],
  celosia: ['#B8397A', '#D4569A'],
  strauchbasilikum: ['#D4569A', '#C0508E', '#E07AB0'],
  orchidee: ['#EBBBD4', '#E4A6C6', '#EBBBD4', '#E4A6C6'],
};

/** Welche Silhouette bekommt diese Pflanze? */
export function familie(p: Pflanze) {
  const id = p.id;
  if (id === 'ufopflanze') return 'pilea';
  if (id === 'zimmerpalme') return 'drachenbaum'; // id historisch, ist ein Drachenbaum
  if (id === 'geldbaum') return 'geldbaum';
  if (id === 'weihnachtskaktus') return 'weihnachtskaktus';
  if (id === 'orchidee') return 'orchidee';
  if (id === 'monstera') return 'monstera';
  if (id === 'bogenhanf') return 'schwert';
  if (id === 'celosia') return 'bluete';
  if (['rosmarin', 'zitronenthymian'].includes(id)) return 'nadel';
  if (['wasserlilien'].includes(id)) return 'schwert';
  if (
    [
      'tomaten', 'tomaten-2', 'paprika', 'habanero', 'stachelbeere', 'erdbeeren',
      'avocados', 'avocado-saemlinge', 'kartoffeln', 'kartoffeln-2',
    ].includes(id)
  )
    return 'frucht';
  if (
    ['suesskartoffel', 'efeututen', 'minze', 'grapefruitminze', 'erdbeerminze',
     'kaesekraut', 'calibrachoa'].includes(id)
  )
    return 'haenger';
  return 'busch';
}

/**
 * Reihenfolge des Einblendens: von der Mitte nach außen, damit die Pflanze
 * symmetrisch auffüllt statt einseitig von links zu wachsen.
 */
function mitteZuerst(winkel: number[]) {
  const platz: Record<number, number> = {};
  winkel
    .map((w, i) => ({ w, i }))
    .sort((a, b) => Math.abs(a.w) - Math.abs(b.w))
    .forEach((o, r) => {
      platz[o.i] = r;
    });
  return platz;
}

/** Fünfblättrige Blüte mit hellem Auge. */
function bluete(x: number, y: number, farbe: string, gr: number) {
  const bl = Array.from(
    { length: 5 },
    (_, i) =>
      `<ellipse cx="0" cy="-3.1" rx="2.05" ry="3.1" fill="${farbe}" transform="rotate(${i * 72})"/>`,
  ).join('');
  return `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${gr})">${bl}
    <circle r="1.25" fill="#FFE9A8"/></g>`;
}

/** Orchideenblüte: fünf Blätter und eine dunklere Lippe. */
function orchidbluete(x: number, y: number, gr: number, farbe: string, lippe: string) {
  const bl = [0, 72, 144, 216, 288]
    .map(
      (a) =>
        `<ellipse cx="0" cy="-4" rx="2.5" ry="4" fill="${farbe}" transform="rotate(${a})"/>`,
    )
    .join('');
  return `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${gr})">${bl}
    <path d="M0 1.6 c -2.6 0 -3.6 2 -2.6 3.6 c 1 1.6 4.2 1.6 5.2 0 c 1 -1.6 0 -3.6 -2.6 -3.6Z" fill="${lippe}"/>
    <circle r="1.2" fill="#FFF3D0"/></g>`;
}

/** Eine kleine Biene für das Strauchbasilikum. */
function biene(x: number, y: number, gr: number, dreh: number) {
  return `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${dreh}) scale(${gr})">
    <ellipse cx="-1.4" cy="-2.6" rx="3.1" ry="1.9" fill="#F2F6FF" opacity=".8" transform="rotate(-24 -1.4 -2.6)"/>
    <ellipse cx="1.6" cy="-2.8" rx="2.7" ry="1.7" fill="#F2F6FF" opacity=".8" transform="rotate(20 1.6 -2.8)"/>
    <ellipse rx="3.6" ry="2.5" fill="#E8B33C"/>
    <path d="M-1.1 -2.3 v4.6 M1.1 -2.1 v4.2" stroke="#3A2E12" stroke-width="1.1" stroke-linecap="round"/>
    <circle cx="-3.2" cy="-.4" r="1.1" fill="#3A2E12"/>
  </g>`;
}

/** Ein Käsestückchen für das Käsekraut — Ecke mit zwei Löchern. */
function kaese(x: number, y: number, gr: number, dreh: number) {
  return `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${dreh}) scale(${gr})">
    <path d="M-5 3.4 L4.6 3.4 L4.6 -1 Q-0.6 -4.2 -5 -1 Z" fill="#E8C34A" stroke="#C9A02E" stroke-width=".8" stroke-linejoin="round"/>
    <circle cx="-1.6" cy="1.4" r="1.15" fill="#C9A02E" opacity=".75"/>
    <circle cx="2.2" cy="0.2" r=".8" fill="#C9A02E" opacity=".75"/>
  </g>`;
}

export function portraet(
  p: Pflanze,
  garten: Garten,
  mini = false,
  nurPflanze = false,
): string {
  const st = wuchsStufe(p, garten);
  const B = 74,
    HB = 112,
    ERDE = 78; // Erdlinie
  const h = (27 + (44 * (st - 1)) / (MAX_STUFE - 1)) * (p.wuchshoehe || 1);
  const oben = ERDE - h;
  const mitte = B / 2;
  const f = familie(p);

  const teil = (stufe: number, inhalt: string) =>
    `<g class="wuchs${st < stufe ? ' zu' : ''}">${inhalt}</g>`;
  const teilWenn = (da: boolean, inhalt: string) =>
    `<g class="wuchs${da ? '' : ' zu'}">${inhalt}</g>`;

  /**
   * Jede Silhouette kann mit einem Startwert leicht anders ausfallen —
   * gleiche Sorte, aber nicht dieselbe Zeichnung achtmal nebeneinander.
   */
  const silhouette = (saat: number): string => {
    const streu = saat ? 1 : 0; // Einzelpflanzen bleiben unverändert
    const zuf = (n: number) => {
      const x = Math.sin(n * 127.1 + saat * 311.7) * 43758.5453;
      return x - Math.floor(x);
    };
    let pflanze = '';

    if (f === 'frucht') {
      pflanze += `<path d="M${mitte} ${ERDE} L${mitte} ${oben}" stroke="${STIEL}" stroke-width="2.4" stroke-linecap="round" fill="none"/>`;
      for (let i = 0; i < st + 1; i++) {
        const y = ERDE - 8 - (i * (h - 10)) / (st + 1);
        const s = 0.85 - i * 0.07;
        pflanze += teil(
          i,
          `<path d="M${mitte} ${y} c -6 -7 -15 -8 -20 -3 c 5 6 14 7 20 3Z" fill="${BLATT}" transform="scale(${s}) translate(${mitte * (1 / s - 1)},${y * (1 / s - 1)})"/>
        <path d="M${mitte} ${y} c 6 -7 15 -8 20 -3 c -5 6 -14 7 -20 3Z" fill="${HELL}" transform="scale(${s}) translate(${mitte * (1 / s - 1)},${y * (1 / s - 1)})"/>`,
        );
      }
      // Pflanzen, die oben Äste bilden — bei der Avocado tragen sie eigene Blätter
      if (p.verzweigt && st >= 5) {
        for (const dir of [-1, 1]) {
          const y0 = oben + h * 0.3,
            ex = mitte + dir * 17,
            ey = oben + h * 0.04;
          pflanze += teil(
            5,
            `<path d="M${mitte} ${y0.toFixed(1)} Q ${mitte + dir * 11} ${(y0 - 7).toFixed(1)} ${ex} ${ey.toFixed(1)}"
          stroke="${STIEL}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
          );
          for (let k = 0; k < 3; k++) {
            const tt = (k + 1) / 3.3;
            const bx = mitte + dir * 17 * tt,
              by = y0 + (ey - y0) * tt;
            pflanze += teil(
              5 + (k > 1 ? 1 : 0),
              `<path d="M${bx.toFixed(1)} ${by.toFixed(1)} c ${dir * 5} -7 ${dir * 13} -8 ${dir * 17} -3 c ${-dir * 5} 6 ${-dir * 13} 7 ${-dir * 17} 3Z"
                  fill="${k % 2 ? BLATT : HELL}"/>`,
            );
          }
        }
      }

      const farbe = FRUCHTFARBE[p.id];
      for (let i = 0; farbe && i < 3; i++) {
        const y = ERDE - 20 - i * 12,
          x = mitte + (i % 2 ? 9 : -9);
        pflanze += teil(
          3 + (i > 1 ? 1 : 0),
          `<circle cx="${x}" cy="${y}" r="4.6" fill="${farbe}"/>
        <circle cx="${x - 1.6}" cy="${y - 1.8}" r="1.4" fill="#fff" opacity=".3"/>`,
        );
      }
    } else if (f === 'busch') {
      const N = Math.round(13 * (p.dichte || 1));
      const sichtbar = Math.max(
        3,
        Math.min(
          N,
          Math.round(N * (0.23 + (0.77 * (st - 1)) / (MAX_STUFE - 1))) +
            (p.blatt_bonus || 0) +
            Math.round((zuf(99) - 0.5) * 2) * streu,
        ),
      );
      // Sämlinge in einem Topf stehen aufrechter — ein breiter Fächer schiebt
      // die Blätter sonst über den Topfrand oder unter die Erdlinie.
      const faecher = (p.pflanzen_im_topf || 1) > 1 ? 34 : 80;
      // Bei Topfgesellschaften enger kappen als bei Einzelpflanzen: sonst weitet
      // die Streuung den Fächer wieder über den Topfrand hinaus auf.
      const grenze = (p.pflanzen_im_topf || 1) > 1 ? 34 : 78;
      const winkel = Array.from({ length: N }, (_, i) => {
        const w = -faecher + ((2 * faecher) / (N - 1)) * i + (zuf(i) - 0.5) * 22 * streu;
        return Math.max(-grenze, Math.min(grenze, w));
      });
      const platz = mitteZuerst(winkel);
      for (let i = 0; i < N; i++) {
        const w = winkel[i];
        const l =
          h *
          (0.56 + 0.44 * Math.cos((w * Math.PI) / 200)) *
          (1 + (zuf(i + 40) - 0.5) * 0.5 * streu);
        const zu = platz[i] >= sichtbar;
        pflanze += `<g class="wuchs${zu ? ' zu' : ''}">
        <g transform="translate(${mitte},${ERDE}) rotate(${w})">
        <path d="M0 0 C -5 ${-l * 0.5} -3 ${-l * 0.85} 0 ${-l} C 3 ${-l * 0.85} 5 ${-l * 0.5} 0 0Z"
              fill="${i % 2 ? BLATT : HELL}"/></g></g>`;

        // Anhängsel an der Blattspitze: Blüten, Käse oder Bienen
        const bogen = (w * Math.PI) / 180;
        const sx = mitte + l * Math.sin(bogen),
          sy = ERDE - l * Math.cos(bogen);
        const farben = BLUETENFARBE[p.id];
        if (farben)
          pflanze += `<g class="wuchs${zu ? ' zu' : ''}">${bluete(
            sx,
            sy,
            farben[i % farben.length],
            p.bluete_groesse || 0.9,
          )}</g>`;
        if (p.sonderfrucht === 'kaese' && !zu && i % 2 === 0)
          pflanze += teil(3, kaese(sx, sy + 2, 0.9, w * 0.4));
        if (p.sonderfrucht === 'biene' && i % 3 === 1)
          pflanze += teil(3, biene(sx + (i % 2 ? 5 : -5), sy - 5, 0.95, w * 0.3));
      }
    } else if (f === 'haenger') {
      pflanze += `<path d="M${mitte} ${ERDE} L${mitte} ${ERDE - 10}" stroke="${STIEL}" stroke-width="2.2" stroke-linecap="round" fill="none"/>`;
      const kuerzer = p.trieb_kuerzen || 0; // untere Blätter/Blüten weglassen
      const anzahlBlatt = Math.max(1, st + 1 - kuerzer);
      for (const dir of [-1, 1]) {
        const len = 12 + st * 9;
        // Der Stiel folgt exakt der Bahn der Blätter und endet am letzten von
        // ihnen — sonst baumelt hinter der letzten Blüte ein nacktes Stück Trieb.
        const bahn = (tt: number): [number, number] => [
          mitte + dir * (16 * tt + 22 * tt * tt),
          ERDE - 16 + len * tt * tt + 6 * tt,
        ];
        const tEnde = anzahlBlatt / (st + 2);
        let d = `M ${mitte} ${ERDE - 8}`;
        for (let n = 1; n <= 14; n++) {
          const [px, py] = bahn((tEnde * n) / 14);
          d += ` L ${px.toFixed(1)} ${py.toFixed(1)}`;
        }
        pflanze += teil(
          1,
          `<path d="${d}" stroke="${STIEL}" stroke-width="1.8"
        fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
        );
        const farben = BLUETENFARBE[p.id];
        for (let i = 0; i < anzahlBlatt; i++) {
          const t = (i + 1) / (st + 2);
          const [x, y] = bahn(t);
          pflanze += teil(
            i,
            `<ellipse cx="${x}" cy="${y}" rx="6.2" ry="4.4" fill="${i % 2 ? BLATT : HELL}"
          transform="rotate(${dir * 34} ${x} ${y})"/>`,
          );
          if (farben) {
            const versatz = dir < 0 ? 0 : farben.length - 2;
            pflanze += teil(
              i,
              bluete(
                x + dir * 7,
                y - 4,
                farben[(i + versatz) % farben.length],
                p.bluete_groesse || 0.95,
              ),
            );
          }
          if (p.sonderfrucht === 'kaese' && i >= 1) {
            pflanze += teil(
              i + 2,
              kaese(x + dir * 7.5, y + 3, 0.92, dir * 12 + (i % 2 ? -8 : 6)),
            );
          }
        }
        if (BLUETENFARBE[p.id])
          pflanze += teil(
            1,
            bluete(
              mitte + dir * 5,
              ERDE - 14,
              BLUETENFARBE[p.id][dir < 0 ? 1 : 3],
              (p.bluete_groesse || 0.95) * 1.1,
            ),
          );
      }
    } else if (f === 'monstera') {
      for (let i = 0; i < st; i++) {
        const dir = i % 2 ? 1 : -1,
          gr = 0.55 + i * 0.13;
        const x = mitte + dir * (5 + i * 4),
          y = ERDE - 12 - i * (h / (st + 1));
        pflanze += teil(
          i,
          `<path d="M${mitte} ${ERDE} Q ${mitte + dir * 6} ${y + 8} ${x} ${y}"
          stroke="${STIEL}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <g transform="translate(${x},${y}) scale(${gr})">
          <path d="M0 0 C -16 -4 -20 -18 -12 -26 C -4 -33 10 -31 16 -22 C 21 -14 14 -2 0 0Z" fill="${BLATT}"/>
          <path d="M-9 -8 L-3 -12 M-13 -18 L-6 -20 M-4 -25 L2 -22 M8 -24 L6 -17" stroke="${STIEL}" stroke-width="1.6" opacity=".55" stroke-linecap="round"/>
        </g>`,
        );
      }
    } else if (f === 'pilea') {
      // Ufopflanze: dieselbe runde Blattscheibe wie die Monstera, nur ohne
      // Fensterung und dafür zahlreicher — mit dem Punkt in der Mitte, wo bei
      // der Pilea der Stiel ansetzt.
      const N = Math.max(2, Math.min(5, Math.round((3 + st) * (p.dichte || 1)) - 2));
      for (let i = 0; i < N; i++) {
        const dir = i % 2 ? 1 : -1;
        const gr = (0.46 + (i % 3) * 0.08) * (1 + (zuf(i) - 0.5) * 0.2 * streu);
        const x = mitte + dir * (4 + i * 2.3);
        const y = ERDE - 12 - i * (h / (N + 0.5));
        pflanze += teil(
          Math.ceil((i + 1) / 2.2),
          `<path d="M${mitte} ${ERDE} Q ${mitte + dir * 6} ${(y + 8).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}"
          stroke="${STIEL}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        <g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${gr.toFixed(2)})">
          <path d="M0 0 C -16 -4 -20 -18 -12 -26 C -4 -33 10 -31 16 -22 C 21 -14 14 -2 0 0Z"
                fill="${i % 2 ? BLATT : HELL}"/>
          <circle cx="0.5" cy="-15" r="1.8" fill="${STIEL}" opacity=".45"/>
        </g>`,
        );
      }
    } else if (f === 'drachenbaum') {
      // Dünner verkorkter Stamm, oben ein Schopf schmaler, überhängender Blätter
      const stammH = h * 0.48,
        kopfY = ERDE - stammH;
      pflanze += `<path d="M${mitte} ${ERDE} C ${mitte - 4} ${(ERDE - stammH * 0.35).toFixed(1)}, ${mitte + 4} ${(ERDE - stammH * 0.72).toFixed(1)}, ${mitte} ${kopfY.toFixed(1)}"
      stroke="#9A7B52" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      const N = Math.round(9 * (p.dichte || 1));
      const sichtbar = Math.max(
        4,
        Math.min(N, Math.round(N * (0.4 + (0.6 * (st - 1)) / (MAX_STUFE - 1)))),
      );
      const winkel = Array.from(
        { length: N },
        (_, i) => -80 + (160 / (N - 1)) * i + (zuf(i) - 0.5) * 10 * streu,
      );
      const platz = mitteZuerst(winkel);
      for (let i = 0; i < N; i++) {
        const w = winkel[i],
          b = (w * Math.PI) / 180;
        const l =
          h * 0.62 * (0.72 + 0.28 * Math.cos(b)) * (1 + (zuf(i + 20) - 0.5) * 0.25 * streu);
        const ex = mitte + Math.sin(b) * l,
          ey = kopfY - Math.cos(b) * l * 0.5;
        pflanze += `<g class="wuchs${platz[i] >= sichtbar ? ' zu' : ''}">
        <path d="M${mitte} ${kopfY.toFixed(1)} Q ${(mitte + Math.sin(b) * l * 0.55).toFixed(1)} ${(kopfY - Math.cos(b) * l * 0.8).toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}"
          stroke="${i % 2 ? BLATT : HELL}" stroke-width="2.5" fill="none" stroke-linecap="round"/></g>`;
      }
    } else if (f === 'geldbaum') {
      // Aufrechter Stamm mit gegenständigen, fleischigen Blattpaaren
      pflanze += `<path d="M${mitte} ${ERDE} L${mitte} ${(oben + 3).toFixed(1)}" stroke="#9A8468"
      stroke-width="2.4" stroke-linecap="round" fill="none"/>`;
      const paare = Math.max(3, Math.round((2 + st) * (p.dichte || 1)));
      for (let i = 0; i < paare; i++) {
        const y = ERDE - 7 - (i * (h - 10)) / paare;
        const gr = (0.6 + (i / paare) * 0.3) * (1 + (zuf(i) - 0.5) * 0.15 * streu);
        const dx = 5 * gr,
          rx = 5.2 * gr,
          ry = 3.4 * gr;
        pflanze += teil(
          Math.ceil((i + 1) / 2),
          `
        <ellipse cx="${(mitte - dx).toFixed(1)}" cy="${y.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}"
                 fill="${HELL}" transform="rotate(-17 ${(mitte - dx).toFixed(1)} ${y.toFixed(1)})"/>
        <ellipse cx="${(mitte + dx).toFixed(1)}" cy="${y.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}"
                 fill="${BLATT}" transform="rotate(17 ${(mitte + dx).toFixed(1)} ${y.toFixed(1)})"/>`,
        );
      }
    } else if (f === 'weihnachtskaktus') {
      // Ketten aus flachen Gliedern, die über den Topfrand bogen
      const ketten = Math.max(3, Math.round((2 + st) * (p.dichte || 1)));
      const glieder = Math.min(5, 2 + Math.floor(st / 2));
      for (let k = 0; k < ketten; k++) {
        const dir = k % 2 ? 1 : -1;
        const spreiz = (17 + (k % 3) * 7) * (1 + (zuf(k) - 0.5) * 0.2 * streu);
        const hoch = h * (0.38 + (k % 3) * 0.09);
        for (let g = 0; g < glieder; g++) {
          // t beginnt bei 0, damit das erste Glied im Substrat sitzt statt zu schweben
          const t = glieder > 1 ? g / (glieder - 1) : 0;
          const x = mitte + dir * spreiz * t;
          const y = ERDE - 5 - hoch * Math.sin(Math.PI * t * 0.55) + 16 * t * t;
          const dreh = dir * (10 + t * 70);
          pflanze += teil(
            1 + g,
            `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${dreh.toFixed(0)})">
          <rect x="-3.1" y="-5" width="6.2" height="10" rx="3" fill="${g % 2 ? BLATT : HELL}"/>
          <path d="M0 -4 L0 4" stroke="${STIEL}" stroke-width=".7" opacity=".45"/></g>`,
          );
        }
      }
    } else if (f === 'orchidee') {
      // Breite Blätter unten, darüber — sofern sie gerade blüht — ein Blütenbogen.
      // `blueht: false` zeigt sie in der Ruhephase, nur mit Laub.
      const blueht = p.blueht !== false;
      const blattzahl = 2;
      for (let i = 0; i < blattzahl; i++) {
        const dir = i % 2 ? 1 : -1,
          reihe = Math.floor(i / 2);
        const bx = mitte + dir * (9 + reihe * 3),
          by = ERDE - 3 - reihe * 6;
        pflanze += teil(
          i < 2 ? 1 : i < 4 ? 3 : 4,
          `<ellipse cx="${bx}" cy="${by}" rx="${(11.5 - reihe * 0.8).toFixed(1)}" ry="5.2" fill="${i % 2 ? BLATT : HELL}"
                  transform="rotate(${dir * (10 + reihe * 10)} ${bx} ${by})"/>`,
        );
      }
      if (!blueht) return pflanze;
      const farben = BLUETENFARBE[p.id] || ['#E4A6C6'];
      const P0 = [mitte - 3, ERDE - 8],
        P1 = [mitte - 12, ERDE - h * 0.8],
        P2 = [mitte + 19, ERDE - h];
      const bahn = (t: number): [number, number] => [
        (1 - t) * (1 - t) * P0[0] + 2 * (1 - t) * t * P1[0] + t * t * P2[0],
        (1 - t) * (1 - t) * P0[1] + 2 * (1 - t) * t * P1[1] + t * t * P2[1],
      ];
      pflanze += teil(
        1,
        `<path d="M${P0[0]} ${P0[1]} Q ${P1[0].toFixed(1)} ${P1[1].toFixed(1)} ${P2[0]} ${P2[1].toFixed(1)}"
      stroke="${STIEL}" stroke-width="1.7" fill="none" stroke-linecap="round"/>`,
      );
      [0.42, 0.6, 0.76, 0.92].forEach((t, i) => {
        const [bx, by] = bahn(t);
        pflanze += teil(
          i + 1,
          orchidbluete(
            bx,
            by,
            (p.bluete_groesse || 1) * (1 - i * 0.06),
            farben[i % farben.length],
            '#B4477F',
          ),
        );
      });
    } else if (f === 'schwert') {
      const N = Math.round(7 * (p.dichte || 1));
      const sichtbar = Math.max(
        3,
        Math.min(
          N,
          Math.round(N * (0.28 + (0.72 * (st - 1)) / (MAX_STUFE - 1))) + (p.blatt_bonus || 0),
        ),
      );
      const winkel = Array.from({ length: N }, (_, i) => -34 + (68 / (N - 1)) * i);
      const platz = mitteZuerst(winkel);
      for (let i = 0; i < N; i++) {
        const w = winkel[i],
          l = h * (0.7 + 0.3 * Math.cos((w * Math.PI) / 90));
        pflanze += teilWenn(
          platz[i] < sichtbar,
          `<g transform="translate(${mitte},${ERDE}) rotate(${w})">
        <path d="M-3.4 0 C -2 ${-l * 0.6} -1.6 ${-l * 0.9} 0 ${-l} C 1.6 ${-l * 0.9} 2 ${-l * 0.6} 3.4 0Z" fill="${i % 2 ? BLATT : HELL}"/>
        <path d="M0 -4 L0 ${-l + 3}" stroke="#D8C97A" stroke-width="1" opacity=".55"/></g>`,
        );
      }
    } else if (f === 'nadel') {
      pflanze += `<path d="M${mitte} ${ERDE} L${mitte} ${oben}" stroke="#6C7A4A" stroke-width="2" stroke-linecap="round" fill="none"/>`;
      for (let i = 0; i < st * 3; i++) {
        const y = ERDE - 6 - (i * (h - 6)) / (st * 3) + (zuf(i) - 0.5) * 4 * streu;
        pflanze += teil(
          Math.ceil((i + 1) / 3),
          `<path d="M${mitte} ${y} l -9 -5 M${mitte} ${y} l 9 -5"
        stroke="${i % 2 ? BLATT : '#8AA46A'}" stroke-width="1.7" stroke-linecap="round" fill="none"/>`,
        );
      }
    } else {
      // bluete — Celosia mit mehreren Federbüschen
      const farben = BLUETENFARBE[p.id] || ['#B8397A', '#D4569A'];
      const busch = (x: number, y: number, gr: number, farbe: string) =>
        `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${gr})">
      <path d="M0 0 c -8 -4 -9 -13 -5 -17 c 2 4 4 3 5 0 c 1 3 3 4 5 0 c 4 4 3 13 -5 17Z" fill="${farbe}"/>
      <path d="M0 -2 c -5 -3 -5 -8 -3 -11 c 1 3 2 2 3 0 c 1 2 2 3 3 0 c 2 3 2 8 -3 11Z" fill="#fff" opacity=".18"/></g>`;

      // Alle Höhen als Anteil von h — so funktioniert die Form auch bei kleinem Wuchs
      pflanze += `<path d="M${mitte} ${ERDE} L${mitte} ${(oben + h * 0.2).toFixed(1)}" stroke="${STIEL}" stroke-width="2.2" stroke-linecap="round" fill="none"/>`;
      for (let i = 0; i < 4; i++) {
        const y = ERDE - h * (0.12 + i * 0.17),
          dir = i % 2 ? 1 : -1;
        pflanze += teil(
          Math.ceil((i + 1) / 1.6),
          `<path d="M${mitte} ${y.toFixed(1)} c ${dir * 7} -6 ${dir * 14} -6 ${dir * 18} -1 c ${-dir * 5} 5 ${-dir * 13} 5 ${-dir * 18} 1Z" fill="${i % 2 ? BLATT : HELL}"/>`,
        );
      }
      const skala = Math.min(1, 0.55 + h / 140); // kleine Pflanze, kleinere Büschel
      const nebenBusch: [number, number, number, number][] = [
        [-13, 0.38, 0.62, 2],
        [14, 0.48, 0.66, 3],
        [-11, 0.66, 0.58, 4],
        [12, 0.74, 0.6, 5],
      ];
      for (const [dx, anteil, gr, abStufe] of nebenBusch) {
        const x = mitte + dx,
          y = ERDE - h * (1 - anteil);
        pflanze += teil(
          abStufe,
          `<path d="M${mitte} ${(y + h * 0.16).toFixed(1)} Q ${mitte + dx * 0.6} ${(y + h * 0.08).toFixed(1)} ${x} ${y.toFixed(1)}"
        stroke="${STIEL}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        ${busch(x, y, gr * skala, farben[Math.abs(dx) % farben.length])}`,
        );
      }
      pflanze += teil(1, busch(mitte, oben + h * 0.24, 0.85 * skala, farben[0]));
      pflanze += teil(2, busch(mitte, oben + h * 0.08, 1.0 * skala, farben[1 % farben.length]));
    }

    return pflanze;
  };

  const topf = `
    <path d="M${mitte - 17} ${ERDE} h34 l-4 24 a3 3 0 0 1 -3 2 h-20 a3 3 0 0 1 -3 -2Z" fill="#B5703F"/>
    <path d="M${mitte - 19} ${ERDE - 4} h38 a2 2 0 0 1 2 2 v3 a2 2 0 0 1 -2 2 h-38 a2 2 0 0 1 -2 -2 v-3 a2 2 0 0 1 2 -2Z" fill="#C88253"/>
    <path d="M${mitte - 13} ${ERDE + 5} l-2 17" stroke="#fff" stroke-width="2" opacity=".13" stroke-linecap="round"/>`;

  let pflanze = '';

  // Mehrere Exemplare derselben Sorte in einem Topf — jedes etwas anders
  // geneigt und groß, damit es nach Aussaat aussieht und nicht nach Kopie.
  const anzahl = p.pflanzen_im_topf || 1;
  if (anzahl <= 1) {
    pflanze = silhouette(0);
  } else {
    const sichtbar = Math.max(
      Math.min(anzahl, 3),
      Math.round(anzahl * (0.3 + (0.7 * (st - 1)) / (MAX_STUFE - 1))),
    );
    const exemplare = Array.from({ length: anzahl }, (_, k) => {
      const t = k / (anzahl - 1);
      const spanne = Math.min(24, 4 + h * 0.22); // kleine Pflanzen rücken enger zusammen
      return {
        k,
        dx: (t - 0.5) * spanne,
        sk: 0.6 + ((k * 5) % 4) * 0.085, // unterschiedlich groß
        dreh: -6 + ((k * 7) % 5) * 3, // leicht geneigt
      };
    }).sort((a, b) => a.sk - b.sk); // Kleine nach hinten
    pflanze = exemplare
      .map((e) => {
        // 3px anheben: der Topfrand wird nach der Pflanze gezeichnet und würde
        // sonst die untere Hälfte kleiner Sämlinge verdecken.
        const tx = (e.dx + mitte * (1 - e.sk)).toFixed(1);
        const ty = (ERDE * (1 - e.sk) - 3).toFixed(1);
        // Klasse und Transform NICHT auf dasselbe Element: .wuchs setzt
        // transform-origin für die Einblendung und würde sonst auch die
        // Positionierung verschieben. Deshalb ein Element dazwischen.
        return `<g class="wuchs${e.k < sichtbar ? '' : ' zu'}"><g
        transform="translate(${tx},${ty}) scale(${e.sk.toFixed(2)}) rotate(${e.dreh.toFixed(1)} ${mitte} ${ERDE})">${silhouette(e.k + 1)}</g></g>`;
      })
      .join('');
  }

  // Teilt sich eine andere Pflanze diesen Topf? Dann wächst sie daneben mit.
  let gast = '';
  const mitbewohner = garten.pflanzen.find((x) => x.topf_mit === p.id);
  if (mitbewohner && !mini) {
    // Um die Erdlinie skalieren, sonst schwebt die Pflanze über dem Topf
    const setzen = (inhalt: string, dx: number, sk: number) =>
      `<g transform="translate(${(dx + mitte * (1 - sk)).toFixed(1)},${(ERDE * (1 - sk)).toFixed(1)}) scale(${sk})">${inhalt}</g>`;
    gast = setzen(portraet(mitbewohner, garten, false, true), 12, 0.74);
    pflanze = setzen(pflanze, -10, 0.84);
  }

  const vb = mini ? `0 ${ERDE - 58} ${B} 62` : `0 0 ${B} ${HB}`;
  if (nurPflanze) return pflanze;
  return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg">${pflanze}${gast}${topf}</svg>`;
}
