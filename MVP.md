# Spezifikation: erste vollständige Fassung

Stand 4. September 2026. Grundlage sind Annes Entscheidungen aus den Gesprächen
vom 3. August und 4. September.

---

## Das Ziel in einem Satz

**Die Anwendung ist vollständig, lokal geprüft und bereit zum Livegang —
sobald Anne entscheidet, wo sie laufen soll.**

Der Livegang selbst gehört bewusst **nicht** dazu. Erst wird fertiggebaut und
auf dem eigenen Rechner geprüft; die Wahl des Hosters bleibt offen und wird
durch nichts vorweggenommen.

---

## Wer es benutzt

**Anne, und sonst niemand.** Sie steht mit der Gießkanne auf dem Balkon, hakt
ab, fotografiert, trägt Ernten ein. Abends am Laptop schaut sie in Ruhe.

Eine öffentliche Schauseite war früh einmal im Gespräch und wurde am
4.9.2026 verworfen. Die Anwendung liegt damit vollständig hinter der
Anmeldung — es gibt keinen Teil, den Fremde sehen.

---

## Woran wir messen, ob es fertig ist

Diese Sätze müssen am Ende alle stimmen — nachprüfbar, nicht gefühlt:

1. Anne öffnet die Seite auf ihrem Handy, meldet sich **einmal** mit einem
   Passwort an und bleibt danach angemeldet.
2. Sie hakt eine Pflanze als gegossen ab. Der Eintrag ist sofort in der
   Datenbank. **Schlägt es fehl, sieht sie eine Meldung** — kein Häkchen, das
   Erfolg vortäuscht.
3. Jeder Knopf, den sie draußen antippt, ist mindestens **44 Pixel hoch**.
4. Sie fotografiert eine Pflanze mit der Kamera und das Bild erscheint im
   Wachstumsverlauf, richtig herum gedreht.
5. Wer nicht angemeldet ist, sieht **nichts** vom Garten — weder Seiten noch
   Fotos, und auch nichts an der Oberfläche vorbei.
6. Die Rechenregeln für Wuchsstufen und Fälligkeiten sind durch Tests
   abgesichert.
7. `npm run dev` startet eine lokale Fassung mit eigener Datenbank, getrennt
   von der späteren echten.
8. Die Anwendung läuft mit `node server.js`, ohne an einen Anbieter gebunden
   zu sein.

---

## Was drin ist

### Schon gebaut

| | |
|---|---|
| Pflanzenverwaltung | 36 Pflanzen mit Pflegedaten, Notizen, Filter nach Ort und Essbarkeit |
| Gieß- und Düngeplan | nach Datum gruppiert, einzeln oder als Runde eintragbar, auch rückwirkend |
| Erntetagebuch | mit Menge und Notiz, löschbar |
| Mein Beet | jede Pflanze als Zeichnung, wächst mit der Pflege in sieben Stufen |
| Ernte-Vitrine | jede Ernte als eigenes Symbol |
| Ranken | wachsen mit jeder Ernte den Bildschirmrand hinauf |
| Drei Themen | Herbarium, Nacht, Jugendstil |
| Fotos | Wachstumsverlauf pro Pflanze, Kamera- und Galerie-Knopf am Handy, Verkleinern im Browser |
| Sicherung | `npm run daten:sichern` mit Platzanzeige |

### Noch zu bauen

| | Warum es zum MVP gehört |
|---|---|
| **Fehlermeldungen bei jedem Eintrag** | Ein stiller Fehlschlag lässt Anne glauben, sie habe gegossen. Für ein Gartentagebuch ist das der schlimmste Fehler. |
| **Passwort-Anmeldung** | Ohne sie kann Anne im Netz nichts eintragen — und ohne Prüfung in den Aktionen könnte es jeder. |
| **Größere Tippflächen** | Die Häkchen im Gießplan sind 22 × 22 Pixel. Empfohlen sind 44. Genau die tippt sie draußen am häufigsten. |
| **Tests für die Rechenregeln** | Wuchsstufen, Fälligkeiten und die Zusammenführung beim Import. Daran hängt die ganze Historie. |
| **Fotos als WebP** | Rund 21 % kleiner bei gleicher Güte, gemessen an fünf vorhandenen Fotos. *(erledigt)* |

---

## Was bewusst nicht drin ist

| Nicht im MVP | Warum, und wann dann |
|---|---|
| **Pflanzen in der App anlegen** | Anne hat 36 Pflanzen; neue kommen selten. Bis dahin legt Claude sie im Gespräch an, wie bisher. **Erstes Vorhaben nach dem MVP.** |
| **Gartentagebuch** | Freie Einträge wie „Blattläuse an der Paprika". Danach. |
| **Reicheres Wachstum** | Blüten die aufgehen, Früchte die reifen und beim Ernten verschwinden. Annes Idee, aber Zierde — die Anwendung ist ohne sie vollständig benutzbar. |
| **Wetter aus Köln** | Braucht eine externe Quelle und eigene Regeln. Danach. |
| **Erinnerungen** | **Nie.** Anne hat sich ausdrücklich dagegen entschieden. |
| **Livegang** | Erst wird lokal fertiggebaut. Der Hoster wird danach gewählt — die Optionen bleiben bis dahin offen. |
| **Symbol für den Startbildschirm** | Ergibt erst Sinn, wenn die Seite eine feste Adresse hat. |
| **Größere Tippflächen** | Die Häkchen sind 22 statt 44 Pixel. Anne will später darüber reden; bis dahin bleibt es. |
| **Echte Handy-App** | Capacitor bleibt als Weg offen, falls es je gewollt ist. |

---

## Die drei Wege durch die Anwendung

**1. Gießrunde auf dem Balkon** — der häufigste Weg
Handy entsperren → Symbol antippen → Gießplan → für jede fällige Pflanze das
Häkchen, oder „Fällige eintragen" für alle auf einmal. Muss mit einer Hand und
nassen Fingern gehen.

**2. Ernte eintragen** — der Weg, an dem Anne hängt
Reiter Ernte → Pflanze wählen, Menge, Notiz → eintragen. Die Notiz ist der
eigentliche Punkt: „es war meinem Mund eine Ehre" gehört genauso dazu wie die
Zahl. Danach wächst die Ranke sichtbar weiter.

**3. Nachschlagen** — der seltene, aber wichtige Weg
Wissen wollen, welche Erde die Paprika braucht oder ob sie schon zwei
Basilikum hat. Nach dem Livegang auch von unterwegs — das ist der Grund,
warum die Anwendung nicht dauerhaft lokal bleiben soll.

---

## Anforderungen im Einzelnen

### Anmeldung
- Ein Passwort, von Anne gewählt. Kein Google, kein GitHub, keine E-Mail.
- Anmeldung bleibt bestehen, bis sie sich abmeldet oder Monate vergehen.
- **Jede schreibende Aktion prüft selbst**, nicht nur die Oberfläche.
- Falsches Passwort: verständliche Meldung, kein Hinweis darauf, was falsch war.

### Fehlerverhalten
- Jede schreibende Aktion zeigt im Fehlerfall eine Meldung auf Deutsch.
- Kein Zustand, der Erfolg vortäuscht, wenn nichts gespeichert wurde.
- Bei fehlender Verbindung eine Meldung, die sagt, dass es am Netz liegt.

### Handy
- Kein seitliches Scrollen. *(geprüft: erfüllt)*
- Kamera direkt erreichbar. *(erfüllt)*
- Tippflächen: die Häkchen im Gießplan sind 22 Pixel, empfohlen wären 44.
  **Zurückgestellt** — Anne will darüber reden, wenn die Anwendung steht.

### Abschottung
- Ohne Anmeldung ist **nichts** erreichbar: keine Seite, keine Fotos, keine
  Server-Aktion. Auch nicht über direkte Anfragen.
- Fotos liegen unter `/bild/<id>` und brauchen dieselbe Prüfung wie die Seiten
  — sonst wären Annes Bilder über eine geratene Nummer abrufbar.

### Betrieb
- Läuft mit `node server.js`, nicht an einen Hoster gebunden. *(erfüllt und getestet)*
- Lokale Vorschau mit eigener Datenbank bleibt bestehen. *(erfüllt)*
- Sicherung auf Knopfdruck, mit Platzanzeige. *(erfüllt)*

---

## Risiken

| Risiko | Wie wir damit umgehen |
|---|---|
| Annes Daten gehen bei einem Fehler verloren | `DATEN.md`, Notbremse im Umzugsskript, Sicherung vor jedem Umbau. Ein Verlust ist bereits passiert — die Regeln stammen daher. |
| Schlechtes WLAN auf dem Balkon | Fehlermeldungen statt stiller Fehlschläge. Offline-Betrieb ist **nicht** Teil des MVP. |
| Platz in der Datenbank | Reicht für rund 1.200 Fotos. Die Sicherung zeigt den Stand bei jedem Lauf. |
| Fotos hängen an den Pflanzen | Wer Pflanzen löscht, löscht Fotos. In `DATEN.md` festgehalten. |

---

## Offene Entscheidungen

| Frage | Wer entscheidet | Stand |
|---|---|---|
| Fotos als WebP | Anne | **entschieden am 4.9.2026: ja** |
| Wo gehostet wird | Anne | offen, bewusst — erst lokal fertigbauen |
| Häkchen größer, auch wenn die Liste länger scrollt? | Anne | zurückgestellt |
| WebP mit niedrigerer Güte? Spart 43 statt 21 Prozent, aber sichtbar. | Anne | offen — an zwei Bildern zu entscheiden, nicht an Zahlen |
