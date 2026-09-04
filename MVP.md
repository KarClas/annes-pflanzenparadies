# Spezifikation: erste vollständige Fassung

Stand 4. September 2026. Grundlage sind Annes Entscheidungen aus den Gesprächen
vom 3. August und 4. September.

---

## Das Ziel in einem Satz

**Anne pflegt ihren Garten vom Handy aus, und wer den Link bekommt, kann
zuschauen.**

Alles andere ist Zugabe und kommt später.

---

## Wer es benutzt

| | |
|---|---|
| **Anne** | Steht mit der Gießkanne auf dem Balkon, hakt ab, fotografiert, trägt Ernten ein. Abends am Laptop schaut sie in Ruhe. |
| **Besucher** | Bekommt einen Link, schaut sich den Garten an, liest die Geschichten. Ändert nichts. Meldet sich nicht an. |

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
5. Ein Besucher ohne Anmeldung sieht Beet, Vitrine, Pflanzen, Fotos und
   Notizen — und kann **nichts** ändern, auch nicht an der Oberfläche vorbei.
6. Die Seite hat eine Adresse, die Anne verschicken kann, und ist von überall
   erreichbar.
7. Auf dem Handy liegt ein Symbol, das die Seite im Vollbild öffnet.
8. Die Rechenregeln für Wuchsstufen und Fälligkeiten sind durch Tests
   abgesichert.
9. `npm run dev` startet weiterhin eine lokale Fassung mit eigener Datenbank,
   getrennt von der echten.

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
| **Livegang** | Datenbank im Netz, Daten umziehen, Adresse einrichten. |
| **Symbol für den Startbildschirm** | Damit sich die Seite am Handy wie eine App anfühlt. |

---

## Was bewusst nicht drin ist

| Nicht im MVP | Warum, und wann dann |
|---|---|
| **Pflanzen in der App anlegen** | Anne hat 36 Pflanzen; neue kommen selten. Bis dahin legt Claude sie im Gespräch an, wie bisher. **Erstes Vorhaben nach dem MVP.** |
| **Gartentagebuch** | Freie Einträge wie „Blattläuse an der Paprika". Danach. |
| **Reicheres Wachstum** | Blüten die aufgehen, Früchte die reifen und beim Ernten verschwinden. Annes Idee, aber Zierde — die Anwendung ist ohne sie vollständig benutzbar. |
| **Wetter aus Köln** | Braucht eine externe Quelle und eigene Regeln. Danach. |
| **Erinnerungen** | **Nie.** Anne hat sich ausdrücklich dagegen entschieden. |
| **Echte Handy-App** | Das Startbildschirm-Symbol reicht. Capacitor bleibt als Weg offen, falls es je gewollt ist. |

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

**3. Herzeigen** — der Weg für alle anderen
Link öffnen → Garten sehen, Beet, Vitrine, Pflanzen mit Fotos und Geschichten.
Keine Anmeldung, keine Knöpfe, nichts kaputtzumachen.

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
- Tippflächen auf den Wegen 1 und 2 mindestens 44 Pixel hoch.
- Kein seitliches Scrollen. *(geprüft: aktuell erfüllt)*
- Kamera direkt erreichbar. *(erfüllt)*

### Öffentliche Ansicht
- Sichtbar: Pflanzen, Pflegedaten, Notizen, Fotos, Beet, Vitrine, Ernten.
- Nicht sichtbar: Knöpfe zum Ändern.
- Nicht möglich: Änderungen über direkte Anfragen an den Server.

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
| Fotos als WebP statt JPEG? Gleiche Qualität, ein Drittel kleiner. | Anne | offen |
| Wo gehostet wird | Anne | offen — Empfehlung Vercel zum Start, austauschbar |
| Sollen die Häkchen größer werden, auch wenn die Liste dadurch länger scrollt? | Anne | offen |
