# Arbeitsregeln für dieses Projekt

Annes allgemeine Regeln stehen in ihrer persönlichen `~/.claude/CLAUDE.md` und
gelten weiter. Hier steht nur, was **an diesem Projekt** schärfer gilt — mit
Beispielen aus dem eigenen Code, damit die Regeln überprüfbar sind statt gut
gemeint.

---

## 1. Fehler

**Ein Programm, das lügt, ist schlechter als eines, das meckert.**

Anne führt ein Gartentagebuch. Ein Eintrag, der still verlorengeht, ist
schlimmer als eine Fehlermeldung: Sie glaubt dann, gegossen zu haben, und
verlässt sich darauf.

### Verboten

```ts
try { ... } catch { }                       // schluckt
try { ... } catch { return [] }             // tut so, als wäre nichts
try { ... } catch (e) { console.error(e) }  // niemand liest die Konsole
```

Das Artefakt tat genau das (`catch { return f }` beim Laden). In einer
Browser-Seite ohne Server war das vertretbar. Hier nicht mehr.

### Erlaubt

Ein `catch` muss **eines von beidem** tun:

1. **Den Fehler wirklich behandeln** — und zwar so, dass Anne es merkt, wenn
   es sie betrifft. Auf Deutsch, in der Oberfläche, nicht in der Konsole.
2. **Weiterwerfen, mit mehr Kontext als vorher.** Wenn diese Ebene nicht
   entscheiden kann, was zu tun ist, darf sie es auch nicht verstecken.

### Für schreibende Aktionen gilt zusätzlich

Jede Aktion, die etwas in die Datenbank schreibt, braucht in der Oberfläche
eine sichtbare Rückmeldung für den Fehlerfall. Auf dem Balkon ist das WLAN
schlecht — das ist der Normalfall, nicht die Ausnahme.

**Kein `catch (e)` ohne Verwendung von `e`.** Wenn die Ursache egal ist, ist
sie es meistens nicht.

---

## 2. Einfachheit

### Nicht bauen, was heute niemand braucht

Gebaut wird für den Fall, der eingetreten ist — nicht für den, der eintreten
könnte.

- **Richtig gemacht:** Kein Bilderspeicher-Dienst „für später". Die Fotos
  liegen in der Datenbank, bis das nachweislich nicht mehr reicht. Die
  Platzanzeige in der Sicherung sagt Bescheid, wenn es soweit ist.
- **Richtig gemacht:** Die Spalte `vorschau` kam, als die Liste sie brauchte —
  nicht auf Verdacht beim ersten Entwurf.

### Keine Abstraktion für einen einzigen Verwender

Eine Zwischenschicht ist erst gerechtfertigt, wenn es einen zweiten Verwender
gibt oder ein konkreter Wechsel ansteht.

Die Ausnahme, die die Regel bestätigt: `/bild/<id>` ist eine Zwischenschicht
mit nur einem Verwender. Sie ist trotzdem richtig, weil sie einen *bekannten*
künftigen Wechsel billig macht (Fotos in einen Dateispeicher) und heute nichts
kostet — sie ist nicht komplizierter als der direkte Weg.

### Vor dem Schreiben lesen

Bevor eine Funktion entsteht: gibt es sie schon? `lib/garten/regeln.ts`
enthält die Rechenregeln, `lib/garten/portraet.ts` die Zeichnungen. Zwei
Fassungen derselben Fälligkeitsrechnung wären ein Fehler, der erst auffällt,
wenn sie auseinanderlaufen.

### Kein toter Code

Beim Aufräumen im selben Zug entfernen, nicht „später". In diesem Projekt sind
schon zweimal Reste stehengeblieben (`void gt;`, eine leere Hilfsfunktion) und
mussten hinterher wieder heraus.

---

## 3. Umfang

**Vor jeder Erweiterung drei Fragen:**

1. **Hat Anne das gewollt?** Steht es in den Zielen in `CLAUDE.md`, oder hat
   sie es in diesem Gespräch gesagt? Wenn nicht: vorschlagen, nicht bauen.
2. **Ist es das Kleinste, was die Sache löst?** Wenn die Hälfte reicht, ist die
   Hälfte richtig.
3. **Was kommt an Dauerlast dazu?** Ein neues Paket, ein neues Konto, ein
   neuer Dienst, eine neue Tabelle — alles davon muss jemand pflegen. Anne
   nicht, also ich. Der Aufwand muss den Nutzen wert sein.

**Neue Abhängigkeiten** brauchen eine Begründung in einem Satz, die auch in
einem Jahr noch trägt. Bisher gerechtfertigt: die Anmeldung (Sitzungen und
Formularschutz baut man nicht selbst). Bisher abgelehnt: CSS-Framework,
Bilderdienst, Analysewerkzeuge.

**Wenn während der Arbeit etwas Zusätzliches auffällt:** notieren und Anne
sagen. Nicht mitmachen, weil es gerade naheliegt.

---

## 4. Absicherung

### „Fertig" heißt geprüft — und zwar an der Sache selbst

Nicht: „der Code sieht richtig aus." Sondern: ausgeführt, Ergebnis angesehen,
Zahlen verglichen.

### Eine Notbremse wird gegen den Fall geprüft, den sie verhindern soll

Am 3.8.2026 verschwanden Annes Fotos, obwohl eine Notbremse eingebaut war. Sie
wurde geprüft — aber nicht in der Lage, in der sie versagte: direkt nach einer
frischen Sicherung war nichts mehr „neuer als die Sicherung", und der Import
lief durch.

**Daraus die Regel:** Wer eine Schutzmaßnahme baut, überlegt sich, wann sie
*nicht* greift, und prüft genau diesen Fall. „Ich habe es getestet" ohne Angabe
des geprüften Falls ist keine Prüfung.

### Was Tests verdient

Nicht alles. Aber die Rechenregeln, an denen Annes Historie hängt:

- Wuchsstufen (`wuchsStufe`, `wuchsPunkte`)
- Fälligkeiten (`status`, `naechstes`, `faelligAm`)
- Die Zusammenführungsregeln im Import (`pflegeVereinen`, `erntenVereinen`)

Diese Funktionen sind reine Berechnung ohne Datenbank — sie zu testen ist
billig, und ein Fehler darin fällt sonst erst auf, wenn Zahlen falsch sind.

### Vor jedem Commit

`npx tsc --noEmit` · `npm run lint` · `npm run build`. Alle drei, nicht zwei
davon.

---

## Kurzfassung

| | |
|---|---|
| Fehler | Sichtbar machen oder weiterwerfen. Niemals schlucken. |
| Umfang | Das Kleinste, was die Sache löst. Nichts auf Verdacht. |
| Abstraktion | Erst ab dem zweiten Verwender oder bei bekanntem Wechsel. |
| Erweiterung | Erst fragen, wenn Anne es nicht gewollt hat. |
| Prüfung | Ausgeführt und angesehen, nicht überlegt. |
| Schutzmaßnahmen | Gegen den Fall prüfen, für den sie da sind. |
