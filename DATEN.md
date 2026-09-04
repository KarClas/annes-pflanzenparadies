# Annes Daten

**Lies das, bevor du etwas in `daten/`, `lib/db/` oder `scripts/` anfasst —
auch bevor du eine Migration erzeugst.**

In der Datenbank steckt, was Anne von Hand eingetragen hat: jeder Gießtag, jede
Düngerunde, jede Ernte, jedes Foto. **Nicht wiederherstellbar, wenn es weg ist.**

---

## Unantastbar

1. **Die `id` einer Pflanze wird nie geändert.** Alle Aktivitäten, Ernten und
   Fotos hängen daran. Der `name` darf sich ändern, die `id` nicht.
2. **Die `id` einer Ernte ist Annes ursprüngliche `eid`** aus dem Artefakt.
   Beibehalten, sonst entstehen Dubletten beim Abgleich mit alten Sicherungen.
3. **Felder werden ergänzt, nie umbenannt oder entfernt.** Neue Felder defensiv
   auslesen (`?? 0`), damit ältere Datensätze weiter funktionieren.
4. **Pflanzen werden nicht gelöscht**, sondern auf `aktiv = false` gesetzt.
5. **Das Notizfeld nie überschreiben, nur ergänzen.** Da steht drin, dass die
   Tomaten aus den Kernen ihrer Schwester stammen und die Zwiebeln Geschenke
   einer Krähe waren.
6. **Vor jedem Umbau am Datenmodell:** `npm run daten:sichern` laufen lassen,
   Anne informieren, auf ihre Antwort warten. Nicht bauen und danach erwähnen.

---

## Die Skripte

| Befehl | Was es tut | Vorsicht |
|---|---|---|
| `npm run daten:sichern` | Schreibt den Stand nach `daten/sicherung-<zeit>.json`, zeigt den belegten Platz | harmlos |
| `npm run daten:import` | **Räumt alle Tabellen leer** und baut sie aus `daten/` neu auf | Umzugswerkzeug, kein Abgleich |
| `npm run fotos:import` | Liest `public/fotos/` neu in die Datenbank ein | ersetzt alle Fotoeinträge |
| `npm run db:erzeugen` | Migration aus geändertem Datenmodell erzeugen | — |
| `npm run db:anwenden` | Migration einspielen | — |
| `npm run db:ansehen` | Datenbank im Browser durchsehen | — |

**`daten:import` niemals gegen die Live-Datenbank.** Es hat eine Notbremse: Steht
in der Datenbank irgendetwas, bricht es ab. Die lässt sich mit `--wirklich`
übergehen — dann ist der Verlust die eigene Entscheidung.

**Fotos hängen an den Pflanzen.** Wer `pflanzen` leert, löscht sie mit. Sie
stehen in keiner Sicherungsdatei und wären nur über `fotos:import`
wiederzubekommen, soweit die Bilddateien noch in `public/fotos/` liegen. Genau
so gingen sie am 3.8.2026 verloren.

---

## Was wo liegt

| | |
|---|---|
| `daten/pflanzen.json` | Stammdaten der 36 Pflanzen plus `grundstock` (Historie aus der Artefakt-Zeit) |
| `daten/sicherung-*.json` | Sicherungen, neueste zuletzt im Alphabet |
| `daten/archiv/` | Die ursprüngliche Artefakt-Sicherung. Wird nie angerührt. |
| `daten/dashboard-original.html` | Das gewachsene Artefakt. Referenz für Gestaltung und Verhalten. Nicht löschen. |
| `public/fotos/` | Bilddateien aus der Artefakt-Zeit. Archiv — die Anwendung liest sie nicht mehr. |

---

## Besonderheiten des Datenmodells

**`basis_pflege`** hält übernommene Zählerstände aus dem Artefakt. Dort wurden
nur Summen geführt, keine Einzeltermine — die lassen sich nicht zurückverwandeln.
Statt sie zu verwerfen (jede Pflanze stünde wieder bei „Sämling") oder zu
erfinden, stehen sie dort als ehrlicher Sockel. Die Wuchsstufe rechnet
Sockel + Anzahl echter Ereignisse.

**Fotos** liegen als Bytes in der Datenbank und werden über `/bild/<id>`
ausgeliefert (`?klein` für die Vorschau). Verkleinert wird im Browser vor dem
Hochladen. Der Server erkennt das Format an den ersten Bytes, statt der Angabe
des Browsers zu glauben.

**Zeichnerische Parameter** stehen gebündelt in der Spalte `darstellung` und
werden beim Laden auf ihren Typ festgenagelt — sie landen als Zahlen direkt im
erzeugten SVG.
