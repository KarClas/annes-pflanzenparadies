/**
 * Die Ranken am linken und rechten Bildschirmrand.
 *
 * Sie klettern von unten nach oben und wachsen mit jeder Ernte weiter. Die
 * Ranke ist genau bildschirmhoch — sonst wüchse sie unsichtbar unterhalb des
 * Fensters weiter.
 *
 * Aus dem Artefakt übernommen. Das Ausrichten der Blätter am Stiel braucht
 * `getTotalLength()` und passiert deshalb im Browser (siehe `rankenWachsen`).
 */

/** Sieben Schwünge über die volle Höhe. */
export function stielPfad(versatz: number, hoehe: number) {
  const bogen = 7;
  const schritt = hoehe / bogen;
  let d = `M 46 ${hoehe.toFixed(1)}`;
  for (let i = 0; i < bogen; i++) {
    const y = hoehe - i * schritt,
      y2 = y - schritt;
    const r = (i + versatz) % 2 === 0 ? 1 : -1;
    d += ` C ${46 + 27 * r} ${(y - schritt * 0.35).toFixed(1)}, ${46 + 27 * r} ${(y2 + schritt * 0.35).toFixed(1)}, 46 ${y2.toFixed(1)}`;
  }
  return d;
}

export function rankeSVG(versatz: number, hoehe: number) {
  const anzahl = Math.round(hoehe / 34);
  const blaetter = Array.from({ length: anzahl }, (_, i) => {
    const t = (i + 1) / (anzahl + 1);
    const seite = i % 2 === 0 ? 1 : -1;
    const dreh = seite === 1 ? -22 - (i % 3) * 9 : 158 + (i % 3) * 9;
    const gr = 0.62 + ((i * 7) % 5) * 0.09;
    return { t, dreh, gr };
  });

  return `<svg viewBox="0 0 132 ${hoehe.toFixed(1)}" preserveAspectRatio="xMidYMax meet" xmlns="http://www.w3.org/2000/svg">
      <path class="stiel" d="${stielPfad(versatz, hoehe)}" fill="none" stroke="currentColor"
            stroke-width="2.5" stroke-linecap="round" opacity=".85"/>
      <g class="blaetter">${blaetter
        .map(
          (b, i) => `
        <g class="blatt zu" data-t="${b.t}" data-dreh="${b.dreh}" data-gr="${b.gr}" style="transition-delay:${i * 45}ms">
          <path d="M0 0 C 13 -13 35 -12 46 0 C 35 12 13 13 0 0 Z"
                fill="currentColor" fill-opacity=".34" stroke="currentColor" stroke-width="1.6"/>
          <path d="M3 0 L 41 0" stroke="currentColor" stroke-width="1" opacity=".65" fill="none"/>
        </g>`,
        )
        .join('')}
      </g>
      <g class="spitze" opacity="0">
        <path d="M0 0 C 8 -6 14 -1 11 4 C 9 7 4 6 4 2" fill="none" stroke="currentColor"
              stroke-width="2.2" stroke-linecap="round"/>
      </g>
    </svg>`;
}

/** Bildschirmhöhe, in vernünftigen Grenzen. */
export function rankenHoehe() {
  return Math.max(520, Math.min(1600, window.innerHeight || 900));
}

/**
 * Stiel bis zum Wachstumsstand freilegen, Blätter an ihm ausrichten und die
 * Ranke oben mit einer Spitze abschließen. Läuft nur im Browser.
 */
export function rankenWachsen(wurzeln: (HTMLElement | null)[], anteil: number) {
  for (const wurzel of wurzeln) {
    const svg = wurzel?.querySelector('svg');
    if (!svg) continue;
    const pfad = svg.querySelector<SVGPathElement>('.stiel');
    if (!pfad) continue;
    const L = pfad.getTotalLength();

    pfad.style.strokeDasharray = String(L);
    pfad.style.strokeDashoffset = String(L * (1 - anteil));

    svg.querySelectorAll<SVGGElement>('.blatt').forEach((b) => {
      const t = parseFloat(b.dataset.t!);
      const pt = pfad.getPointAtLength(L * t);
      b.setAttribute(
        'transform',
        `translate(${pt.x},${pt.y}) rotate(${b.dataset.dreh}) scale(${b.dataset.gr})`,
      );
      b.classList.toggle('zu', t > anteil);
    });

    const sp = svg.querySelector<SVGGElement>('.spitze');
    if (sp) {
      const pt = pfad.getPointAtLength(L * anteil);
      sp.setAttribute('transform', `translate(${pt.x},${pt.y})`);
      sp.style.opacity = anteil < 0.995 ? '.9' : '0';
    }
  }
}
