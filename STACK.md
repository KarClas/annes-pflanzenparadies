# Technische Grundlage

Festgelegt am 4. September 2026, nach Annes Vorgaben:

- **Nicht an einen Anbieter gebunden** — ein Umzug muss ein Handgriff bleiben
- **Keine Fremdanmeldung** — kein Google, kein GitHub, ein Passwort genügt
- **Web zuerst**, ein späterer Weg Richtung Handy-App soll offenbleiben
- **Kamera vom Handy aus** erreichbar
- **Kostenlos** im Umfang eines Balkongartens
- Betrieben von jemandem, der nicht programmiert

---

## Die Entscheidungen

| Bereich | Gewählt | Warum |
|---|---|---|
| Gerüst | **Next.js 16** (App Router), **React 19**, **TypeScript** | Seiten und Server in einem Projekt. Läuft überall, wo Node läuft — nicht nur bei Vercel. |
| Gestaltung | **Eigenes CSS**, kein Framework | Annes Handarbeit aus dem Artefakt. Ein Framework brächte nur Ballast und Fremdstil. |
| Zeichnungen | **Eigene Module** in `lib/garten/` | Reine Berechnung ohne Zustand. Überlebt jeden Umzug, auch den auf eine andere Plattform. |
| Datenbank | **PostgreSQL 17** | Lokal über Homebrew, im Netz über Neon. Derselbe Code für beides. |
| Datenzugriff | **Drizzle** + Treiber **postgres.js** | Bewusst der neutrale Treiber, nicht der von Vercel oder Neon. Jedes PostgreSQL tut es. |
| Anmeldung | **Auth.js** mit Passwort | Ein Passwort, kein Fremddienst. Sitzungsverschlüsselung und Schutz vor gefälschten Formularen kommen aus der Bibliothek — das baut man nicht selbst. |
| Fotos | **In der Datenbank**, ausgeliefert über `/bild/<id>` | Kein weiterer Dienst, kein weiteres Konto. Eine Sicherung enthält alles. |
| Verkleinern | **Im Browser**, vor dem Hochladen | Spart Datenvolumen am Balkon und Platz in der Datenbank. Kein Bildwerkzeug auf dem Server nötig. |
| Betrieb | **Vercel** zum Start | Kostenlos und am einfachsten. Durch `output: 'standalone'` jederzeit ersetzbar. |
| Handy | **PWA** (Symbol auf dem Startbildschirm) | Kein App Store, keine Prüfung, kein Neubau. Später ist Capacitor der kleine Schritt zur echten App. |

---

## Bewusst nicht dabei

| Verzichtet auf | Grund |
|---|---|
| CSS-Framework (Tailwind o. ä.) | Die Gestaltung existiert bereits und ist gut. |
| Bilderspeicher-Dienst | Ein Konto mehr, ohne Not. Erst nötig, wenn es eng wird — siehe unten. |
| Supabase-Bibliotheken | Supabase als reines PostgreSQL wäre in Ordnung. Seine Extras zu nutzen hieße, sich zu binden — genau das ist nicht gewollt. Dazu pausiert die Freistufe nach sieben Tagen Ruhe und muss von Hand geweckt werden. |
| React Native | Würde das gesamte CSS wertlos machen. Wochen Arbeit für weniger Ergebnis. |
| Analyse- und Zählwerkzeuge | Niemand muss mitlesen, wer Annes Garten anschaut. |
| Benachrichtigungen | Anne hat sich ausdrücklich dagegen entschieden. |

---

## Wo die Ausgänge liegen

Falls sich später etwas ändern soll, sind das die Stellen — jede einzeln, keine hängt an einer anderen:

| Wechsel | Aufwand | Was zu tun ist |
|---|---|---|
| Anderer Hoster | gering | `DATABASE_URL` und `AUTH_SECRET` woanders eintragen. Der Bau läuft ohne Next.js-Werkzeuge. |
| Andere Datenbank | gering | Export und Import. Es ist normales PostgreSQL. |
| Fotos in einen Dateispeicher | **eine Datei** | Nur `app/bild/[id]/route.ts` liest dann woanders. Der Rest der Anwendung kennt nur die Adresse. |
| Echte Handy-App | mittel | Capacitor legt eine App-Hülle um die bestehende Anwendung. Gestaltung und Logik bleiben. |

---

## Platzbedarf

Fotos werden im Browser auf 1600 Pixel lange Kante verkleinert.

| | |
|---|---|
| Je Foto (groß + Vorschau) | rund 415 KB als JPEG |
| Freistufe Neon | 0,5 GB |
| Reicht für | rund 1.200 Fotos, also etwa 33 je Pflanze |

**Offen:** Umstellung auf das Format WebP. Gleiche sichtbare Qualität, rund ein Drittel kleiner — damit rund 1.800 Fotos. Wartet auf Annes Entscheidung, weil es ihre Bildqualität betrifft.

`npm run daten:sichern` zeigt bei jedem Lauf den belegten Platz an, damit ein Engpass Jahre vorher sichtbar wird und nicht überrascht.
