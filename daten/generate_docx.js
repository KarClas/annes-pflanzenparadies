#!/usr/bin/env node
/**
 * Generiert das Balkon-Pflegeplan-Dokument aus pflanzen.json.
 *
 * Nutzung:
 *   node generate_docx.js <pfad/zu/pflanzen.json> <ausgabe.docx>
 *
 * Braucht das npm-Paket "docx" (meist vorinstalliert).
 */

const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        AlignmentType, BorderStyle, WidthType, ShadingType, Header, Footer,
        PageNumber } = require('docx');
const fs = require('fs');

const [, , jsonPath, outPath] = process.argv;
if (!jsonPath || !outPath) {
  console.error('Nutzung: node generate_docx.js <pflanzen.json> <ausgabe.docx>');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Farbpalette — grün, freundlich, gut lesbar
const C = {
  headerBg: '2E7D32',
  titel: '1B5E20',
  akzent: '558B2F',
  zeileAlt: 'F1F8E9',
  weiss: 'FFFFFF',
  rand: 'C8E6C9',
  text: '2D2D2D',
  grau: '6B7280',
};

const noB = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };

const SPALTEN = [2300, 1150, 3100, 2476];
const KOEPFE = ['Pflanze', 'Düngen?', 'Dünger & Häufigkeit', 'Gießen'];

function kopfzeile() {
  return new TableRow({
    tableHeader: true,
    children: KOEPFE.map((t, i) => new TableCell({
      width: { size: SPALTEN[i], type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: C.headerBg },
      borders: { top: noB, bottom: noB, left: noB, right: noB },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({
        children: [new TextRun({ text: t, bold: true, color: C.weiss, size: 20, font: 'Calibri' })],
      })],
    })),
  });
}

function datenzeile(zellen, hell) {
  return new TableRow({
    children: zellen.map((t, i) => new TableCell({
      width: { size: SPALTEN[i], type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: hell ? C.zeileAlt : C.weiss },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: C.rand },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: C.rand },
        left: noB, right: noB,
      },
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      children: [new Paragraph({
        children: [new TextRun({ text: t, size: 18, font: 'Calibri', color: C.text })],
      })],
    })),
  });
}

// Wandelt einen Pflanzeneintrag in vier Tabellenspalten um
function zeileAus(p) {
  const name = `${p.emoji || '🌿'} ${p.name}${p.anzahl > 1 ? ` (${p.anzahl}x)` : ''}`;

  const duengenLabel = {
    ja: 'Ja', kaum: 'Wenig', selten: 'Selten', nein: 'Nein',
  }[p.duengen] || p.duengen;

  let duenger;
  if (p.duengen === 'nein') {
    duenger = p.duenge_hinweis || 'Nicht nötig';
  } else {
    const teile = [];
    if (p.duenger && p.duenger !== '—') teile.push(p.duenger);
    if (p.duenge_hinweis) teile.push(p.duenge_hinweis);
    duenger = teile.join(' — ');
  }

  const giessLabel = {
    viel: 'Viel', mittel: 'Mäßig', wenig: 'Wenig', hydro: 'Hydro',
  }[p.giessen] || p.giessen;
  const takt = p.giess_intervall_tage === 1 ? 'täglich'
    : p.giess_intervall_tage === 7 ? 'wöchentlich'
    : p.giess_intervall_tage === 14 ? 'alle 2 Wochen'
    : p.giess_intervall_tage ? `alle ${p.giess_intervall_tage} Tage` : null;
  const giessen = [takt ? `${giessLabel} (${takt})` : giessLabel, p.giess_hinweis]
    .filter(Boolean).join(' – ');

  return [name, duengenLabel, duenger, giessen];
}

function abschnitt(text) {
  return new Paragraph({
    spacing: { before: 400, after: 160 },
    children: [new TextRun({ text, bold: true, size: 28, font: 'Calibri', color: C.titel })],
  });
}

function linie() {
  return new Paragraph({
    spacing: { before: 120, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'A5D6A7' } },
    children: [],
  });
}

function tabelle(pflanzen) {
  return new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: SPALTEN,
    rows: [kopfzeile(), ...pflanzen.map((p, i) => datenzeile(zeileAus(p), i % 2 === 0))],
  });
}

const draussen = data.pflanzen.filter(p => p.standort === 'draussen');
const drinnen = data.pflanzen.filter(p => p.standort === 'drinnen');

const kinder = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 80 },
    children: [new TextRun({ text: 'Mein Balkon-Pflegeplan', bold: true, size: 40, font: 'Calibri', color: C.titel })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [new TextRun({ text: 'Dünger- und Gießplan für alle Pflanzen', size: 22, font: 'Calibri', color: C.akzent, italics: true })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 300 },
    children: [new TextRun({ text: `Stand: ${data.aktualisiert} · ${data.pflanzen.length} Pflanzen`, size: 16, font: 'Calibri', color: C.grau })],
  }),

  abschnitt(`🌞 Auf dem Balkon (${draussen.length})`),
  linie(),
  tabelle(draussen),

  new Paragraph({ spacing: { before: 500 }, children: [] }),
  abschnitt(`🏠 Drinnen (${drinnen.length})`),
  linie(),
  tabelle(drinnen),
];

// Geplante Projekte
if (data.geplant && data.geplant.length) {
  kinder.push(new Paragraph({ spacing: { before: 500 }, children: [] }));
  kinder.push(abschnitt('📅 Geplant'));
  kinder.push(linie());
  for (const g of data.geplant) {
    kinder.push(new Paragraph({
      spacing: { after: 100 },
      children: [
        new TextRun({ text: `${g.name} · `, bold: true, size: 18, font: 'Calibri', color: C.titel }),
        new TextRun({ text: `${g.wann}`, size: 18, font: 'Calibri', color: C.akzent }),
        new TextRun({ text: g.notiz ? ` — ${g.notiz}` : '', size: 18, font: 'Calibri', color: C.text }),
      ],
    }));
  }
}

// Grundregeln zum Schluss
kinder.push(new Paragraph({ spacing: { before: 500 }, children: [] }));
kinder.push(linie());
const regeln = [
  'Immer halbe Dosis beim Düngen — lieber öfter schwach als selten stark.',
  'Nie in trockene Erde düngen. Erst gießen, dann düngen.',
  'Nach dem Umtopfen in frische Erde 4–6 Wochen Düngepause.',
  'Im Winter (Oktober–Februar) Düngepause für fast alles.',
  'Bei Hitze morgens früh und abends gießen — nie mittags.',
];
for (const r of regeln) {
  kinder.push(new Paragraph({
    spacing: { after: 60 },
    children: [new TextRun({ text: `•  ${r}`, size: 17, font: 'Calibri', color: C.akzent, italics: true })],
  }));
}

const doc = new Document({
  sections: [{
    properties: { page: { margin: { top: 1200, bottom: 1100, left: 1440, right: 1440 } } },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: '🌿 Mein Balkon-Pflegeplan 🌿', bold: true, size: 22, font: 'Calibri', color: C.titel })],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ children: ['Seite ', PageNumber.CURRENT], size: 14, font: 'Calibri', color: C.grau })],
        })],
      }),
    },
    children: kinder,
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(outPath, buf);
  console.log(`✓ ${outPath} — ${draussen.length} draußen, ${drinnen.length} drinnen`);
});
