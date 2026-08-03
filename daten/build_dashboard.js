#!/usr/bin/env node
/**
 * Baut das Dashboard-Artefakt aus Template + pflanzen.json.
 *
 * Nutzung:
 *   node build_dashboard.js <pflanzen.json> <dashboard_template.html> <ausgabe.html>
 */
const fs = require('fs');
const [, , jsonPath, tplPath, outPath] = process.argv;
if (!jsonPath || !tplPath || !outPath) {
  console.error('Nutzung: node build_dashboard.js <pflanzen.json> <template.html> <ausgabe.html>');
  process.exit(1);
}
const daten = fs.readFileSync(jsonPath, 'utf8');
const tpl = fs.readFileSync(tplPath, 'utf8');
for (const marke of ['__PFLANZEN_JSON__', '__FOTOS_JSON__']) {
  if (!tpl.includes(marke)) { console.error('Fehler: Platzhalter ' + marke + ' fehlt im Template.'); process.exit(1); }
}

// Fotos als Data-URIs einbetten, damit das Artefakt eigenständig bleibt
const path = require('path');
const fotoDir = path.join(path.dirname(jsonPath), 'fotos');
const fotos = {};
let bytes = 0;
if (fs.existsSync(fotoDir)) {
  for (const f of fs.readdirSync(fotoDir).filter(x => x.endsWith('.jpg'))) {
    const roh = fs.readFileSync(path.join(fotoDir, f));
    bytes += roh.length;
    fotos[path.basename(f, '.jpg')] = 'data:image/jpeg;base64,' + roh.toString('base64');
  }
}

fs.writeFileSync(outPath, tpl
  .replace('__PFLANZEN_JSON__', daten.trim())
  .replace('__FOTOS_JSON__', JSON.stringify(fotos)));

const n = JSON.parse(daten).pflanzen.length;
const kb = Math.round(fs.statSync(outPath).size / 1024);
console.log(`✓ ${outPath} — ${n} Pflanzen, ${Object.keys(fotos).length / 2} Fotos, ${kb} KB`);
