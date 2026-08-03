# Dashboard bauen

Das Dashboard ist ein HTML-Artefakt mit persistentem Browser-Speicher. Vier Reiter: Pflanzenübersicht, Gießplan, Düngeplan, Erntetagebuch. Die Daten überleben das Schließen der Session.

## Bauen

```bash
node scripts/build_dashboard.js \
  assets/pflanzen.json \
  assets/dashboard_template.html \
  /mnt/user-data/outputs/Balkon_Dashboard.html
```

Das Script ersetzt den Platzhalter `__PFLANZEN_JSON__` im Template durch den Inhalt der JSON. Danach mit `present_files` zeigen.

## Was gespeichert wird

Vier Schlüssel im `window.storage` (nicht geteilt, also privat):

| Schlüssel | Inhalt |
|---|---|
| `garten:aktivitaet` | `{ pflanzenId: { gegossen: ISO-Datum, geduengt: ISO-Datum } }` |
| `garten:ernte` | Liste von `{ eid, pflanzeId, datum, menge, notiz }` |
| `garten:eigene` | Pflanzen, die direkt im Dashboard angelegt wurden |
| `garten:thema` | gewähltes Design |

## Warum ein Neubau die Daten nicht zerstört

Die kanonische Pflanzenliste kommt fest eingebettet aus der JSON (`SAAT`). Aktivitäts- und Ernteeinträge liegen dagegen im Browser-Speicher und werden beim Start eingelesen. Ein neu gebautes Dashboard bringt also die aktualisierte Pflanzenliste mit und findet die alten Einträge weiterhin vor — sie hängen an der `id` der Pflanze.

Daraus folgt die wichtigste Regel: **`id`-Werte in der JSON nie ändern.** Wer `tomaten` in `cocktailtomaten` umbenennt, kappt damit die gesamte Historie dieser Pflanze. Name und alle anderen Felder lassen sich problemlos ändern.

## Die beiden Pläne

Gießplan und Düngeplan teilen sich im Template dieselbe Mechanik — das Objekt `PLAENE` beschreibt beide, `planAnsicht(art)` rendert beide. Eine Änderung an der Darstellung wirkt automatisch auf beide.

| | Gießplan | Düngeplan |
|---|---|---|
| Feld im Speicher | `gegossen` | `geduengt` |
| Intervall aus | `giess_intervall_tage` | `duenge_intervall_tage` |
| Gilt für | alle Pflanzen | nur die mit Intervall |

Nächster Termin = letzter Eintrag plus Intervall. Ohne Eintrag landet die Pflanze im Block „Noch nicht eingetragen" ganz oben. Gruppiert wird nach Tag, chronologisch sortiert; überfällige Gruppen sind in der Akzentfarbe, heute fällige in Gold.

Zwei Wege einzutragen: Kästchen anklicken (heutiges Datum für diese eine Pflanze) oder die Sammelaktion oben.

Die Sammelaktion bildet ab, wie tatsächlich gegossen wird: Man geht einmal über den Balkon und versorgt, was dran ist. **„Fällige eintragen"** erfasst deshalb nur die Pflanzen, die zum gewählten Datum fällig waren, und trägt genau dieses Datum ein — auch rückwirkend. Neben den Knöpfen steht laufend, wie viele das wären; die Zahl aktualisiert sich beim Ändern des Datums.

**„Wirklich alle"** setzt dagegen jede Pflanze, unabhängig von der Fälligkeit. Gedacht für den Einstieg oder wenn wirklich alles auf einmal versorgt wurde.

Beide überspringen Pflanzen, deren letzter Eintrag **später** liegt als das gewählte Datum. Sonst würde ein Nachtrag von gestern einen heutigen Eintrag zurückdatieren — und die nächste Erinnerung käme zu früh.

Wichtig bei Einmal-im-Jahr-Terminen: nicht über ein Intervall abbilden. Ein rollierendes Intervall rechnet stur weiter und landet irgendwann mitten im Winter. Solche Termine gehören in `references/saisonkalender.md`.

## Themen

Drei Designs, umschaltbar über die drei Farbtupfen oben rechts. Die Wahl wird gespeichert.

| Thema | Charakter |
|---|---|
| `herbarium` | Cremefarbenes Papier, Tintengrün, Terrakotta. Vintage-Botanikertafel. Fraunces. |
| `nacht` | Sehr dunkles Waldgrün, leuchtendes Blattgrün, warmes Amber. Modern, ruhig. Fraunces. |
| `jugendstil` | Tiefes Tannengrün mit Messinggold, kantige Radien, schmale Serifen. Cormorant Garamond. |

Umgesetzt über CSS-Variablen unter `#garten[data-thema="…"]`. Ein neues Thema anzulegen heißt: einen Variablenblock ergänzen, einen `.tupfen` mit passendem `data-t` in die Leiste, und eine Verlaufsfarbe für den Tupfen im CSS. Sonst nichts — alle Komponenten greifen ausschließlich auf Variablen zu.

Die Ranken an den Seitenrändern werden in `rankenZeichnen()` als SVG erzeugt: eine Kachel von 320 px Höhe, achtmal untereinander gestapelt, zwei Varianten im Wechsel, damit sich das Muster nicht offensichtlich wiederholt. Sie erben ihre Farbe über `currentColor` aus `--ranke` und passen sich damit automatisch jedem Thema an. Unter 900 px Breite werden sie ausgeblendet.

## Fotos in der Pflanzenliste

Der Reiter „Pflanzen" zeigt bewusst **keine** Gieß- und Düngeangaben — dafür gibt es die beiden Pläne. In der Liste stehen nur Porträt, Name, Standort, Wuchsstufe und rechts ein Foto der echten Pflanze. Ein Klick darauf öffnet es groß, Escape oder ein Klick daneben schließt wieder.

Die Fotos liegen in `assets/fotos/` als zwei Größen je Aufnahme: `<name>.jpg` (620 px lange Kante, Qualität 72) für die Ansicht und `<name>_klein.jpg` (128 px quadratisch, mittig beschnitten) für die Liste. Zugeordnet werden sie über das Feld `foto` in der JSON, das den Dateinamen ohne Endung enthält. Mehrere Pflanzen dürfen dasselbe Foto nutzen.

`build_dashboard.js` bettet sie als Data-URIs ein, damit das Artefakt eigenständig bleibt. Das treibt die Dateigröße: elf Fotos ergeben rund 800 KB. Wer weitere ergänzt, sollte die Kantenlänge und Qualität nicht erhöhen — bei etwa 25 Fotos wird die Datei unhandlich.

Ein neues Foto hinzufügen: verkleinern und in beiden Größen nach `assets/fotos/` legen, `foto` in der JSON setzen, neu bauen. Pflanzen ohne Foto zeigen ein leeres gestricheltes Feld.

## Ernte-Vitrine und wachsende Ranke

Direkt unter dem Kopf sitzt die Vitrine: für jede Ernte ein handgezeichnetes SVG-Symbol, älteste links, neueste rechts, mit gestaffelter Einblendung. Beim Überfahren zeigt der Tooltip Pflanze, Datum, Menge und Notiz.

Die Symbole liegen in `FRUCHT` (zwölf Formen: Tomate, Chili, Paprika, Kartoffel, Süßkartoffel, Erdbeere, Beere, Zwiebel, Lauch, Blatt, Kraut, Nadel), die Zuordnung in `FRUCHT_ZU`. Eine neue Pflanze ohne Eintrag bekommt automatisch das Blatt-Symbol — sie fällt also nicht durchs Raster, sieht aber generisch aus. Für eine markante neue Sorte lohnt eine eigene Form.

Steht in der Mengenangabe eine Zahl zwischen 1 und 15 („6 Stück"), erscheinen entsprechend viele Symbole. Alles darüber oder ohne Zahl zählt als eines. Ab 120 Symbolen wird abgeschnitten und der Rest als „+N" angehängt.

Die Ranken links und rechts wachsen mit. Ihre Höhe entspricht **exakt der Fensterhöhe** (`hoeheSetzen()`, bei Größenänderung neu aufgebaut). Das ist keine Kosmetik: weil die Ranke von unten nach oben klettert, läge sie bei einer festen Höhe von etwa 2560 px auf niedrigen Wachstumsständen komplett unterhalb des sichtbaren Fensters — man sähe beim Laden kurz den vollen Stiel und danach nichts mehr. Wer die Ranke ändert, muss diese Kopplung erhalten.

Die Ranken links und rechts wachsen mit. Statt gekachelter Segmente ist es jetzt ein durchgehender Pfad von unten nach oben; `stroke-dasharray`/`stroke-dashoffset` geben den gewachsenen Anteil frei, die Blätter blenden nacheinander ein, sobald der Wuchs sie erreicht, und an der Spitze sitzt eine Ranke, die sich sacht kringelt und verschwindet, sobald oben angekommen.

Der Anteil kommt aus `wachstum()`: Start bei 16 %, voll bei `ZIEL_ERNTEN` (36 geernteten Stücken). Wer das Tempo ändern will, dreht an dieser Konstante.

Die Blattpositionen werden über `getPointAtLength()` direkt auf dem Pfad berechnet — sie sitzen dadurch exakt am Stiel, egal wie der Pfad aussieht. Wichtig: `rankenWachsen()` darf erst laufen, wenn das SVG im DOM ist, sonst liefert `getTotalLength()` nichts Brauchbares. Beim Start passiert das deshalb in einem doppelten `requestAnimationFrame`.

## „Mein Beet" — Pflanzen, die sichtbar wachsen

Ganz oben steht das Beet: jede Pflanze als gezeichnetes Topfporträt, nebeneinander auf einem Brett, waagerecht scrollbar.

Sortiert wird nach der **letzten Interaktion**, absteigend: Was zuletzt gegossen, gedüngt oder geerntet wurde, steht links. `letzteInteraktion()` liefert dafür den jüngsten Zeitstempel aus Gieß- und Düngedatum sowie den `eid`-Werten der Ernten dieser Pflanze.

Warum bei Ernten die `eid` und nicht das Erntedatum? Weil die `eid` der Moment des Eintragens ist. Wer eine Ernte nachträgt, hat gerade eben mit dieser Pflanze zu tun gehabt — auch wenn das Datum zwei Wochen zurückliegt.

Pflanzen ohne jede Interaktion sortieren sich dahinter nach Wuchsstufe ein. Wer sich einen Topf teilt, rückt gemeinsam vor: `letzteInteraktion()` bezieht die Gastpflanze mit ein. Dasselbe Porträt erscheint klein in jeder Zeile der Pflanzenliste.

### Wuchsstufen

Sieben Stufen — Sämling, Jungpflanze, kräftig, üppig, ausgewachsen, Prachtstück, Riese. Die Zahl steckt in `MAX_STUFE` und ergibt sich aus der Länge von `STUFEN`; alle Anteilsrechnungen in den Familien normieren über `(st - 1) / (MAX_STUFE - 1)`. Wer weitere Stufen ergänzen will, hängt Namen an `STUFEN` an — die Formeln passen sich von selbst an.

Die Höhe wird ebenfalls über die Stufenzahl normiert (`27 + 44 · Anteil`), damit sich der Bereich beim Erweitern nicht verschiebt und nichts über den Zeichenbereich hinauswächst. Die Stufe kommt aus `wuchsStufe()` und speist sich aus der geleisteten Pflege:

```
Punkte = 1 × Gießen  +  2 × Düngen  +  4 × geerntetes Stück
Stufe  = 1 + min(4, Punkte / 4)
```

Die Gewichtung ist bewusst so gewählt, dass **eine einzelne Ernte sofort eine Stufe bringt**. Alles andere fühlt sich falsch an: wer erntet, hat den Beweis erbracht, dass die Pflanze gedeiht — das muss man sehen.

Die Zähler `n_gegossen` und `n_geduengt` liegen in `garten:aktivitaet` neben den Datumsangaben und werden bei jedem Abhaken und bei jeder Sammelaktion hochgezählt. Sie starten bei null — auf dem Bildschirm beginnt also jede Pflanze als Sämling, egal wie groß sie draußen tatsächlich ist. Das ist Absicht: dargestellt wird die dokumentierte Pflege, nicht die reale Pflanze. Wer es anders will, ändert die Formel oder setzt einen Startwert.

Die Stufen wirken sich auf Höhe, Blattzahl und Details aus. Bei den fächerförmigen Familien (`busch`, `schwert`, `palme`) ist die Zahl der Blattpositionen fest; variabel ist nur, wie viele davon sichtbar sind. Eingeblendet wird über `mitteZuerst()` von der Mitte nach außen — sonst wächst die Pflanze einseitig von links, was auf den unteren Stufen aussieht wie ein umkippendes Einzelblatt. Bei Fruchtpflanzen erscheinen ab Stufe 3 die ersten Früchte, ab Stufe 4 weitere. Neu hinzukommende Teile tragen die Klasse `.wuchs` und blenden mit einer Skalierungsanimation ein, statt einfach da zu sein.

### Familien

`portraet()` zeichnet parametrisch, nicht aus 27 Einzelbildern. `familie()` ordnet jede Pflanze einer von acht Silhouetten zu:

| Familie | Aussehen | Beispiele |
|---|---|---|
| `frucht` | aufrechter Stiel, Blattpaare, Früchte ab Stufe 3 | Tomaten, Paprika, Habanero, Kartoffeln, Beeren, Avocados |
| `busch` | Blattbüschel, fächerförmig | Basilikum, Koriander, Rucola, Kartoffeln |
| `haenger` | Triebe, die über den Topfrand fallen | Minzen, Efeututen, Süßkartoffel, Käsekraut |
| `monstera` | große gefensterte Blätter an Stielen | Monstera |
| `schwert` | aufrechte Blattschwerter mit hellem Rand | Bogenhanf, Wasserlilien |
| `palme` | Wedel mit Fiederblättchen | Zimmerpalme |
| `nadel` | schmaler Stiel mit Nadelpaaren | Rosmarin, Zitronenthymian |
| `bluete` | Stiel mit mehreren Federbüschen an Seitentrieben | Pinke Blume |
| `pilea` | runde Blätter an dünnen, gebogenen Stielen | Ufopflanze |
| `drachenbaum` | verkorkter Stamm mit Schopf schmaler, überhängender Blätter | Drachenbaum |
| `geldbaum` | aufrechter Stamm mit gegenständigen, fleischigen Blattpaaren | Geldbaum |
| `weihnachtskaktus` | Ketten flacher Glieder, die über den Topfrand bogen | Weihnachtskaktus |
| `orchidee` | breite Blätter unten, darüber ein Blütenbogen | Orchidee |

Eine neue Pflanze ohne Eintrag in `familie()` landet bei `busch` — das sieht ordentlich aus, aber unspezifisch. Für etwas Markantes lohnt eine eigene Silhouette.

`trieb_kuerzen` nimmt einer Pflanze der Familie `haenger` die untersten Blätter und Blüten. Die Bienenblume steht auf 1.

Wichtig dabei: Stiel und Blätter folgen derselben Funktion `bahn(t)`, und der Stiel wird nur bis zum letzten Blatt gezeichnet. Vorher waren es zwei getrennte Formeln — eine Kurve für den Stiel, eine Parametrisierung für die Blätter —, und beim Kürzen blieb hinter der letzten Blüte ein nacktes Stück Trieb hängen. Wer an der Form arbeitet: eine Bahn, beide nutzen sie.

`verzweigt: true` lässt eine Pflanze der Familie `frucht` ab Stufe 5 zwei Äste bilden, die eigene Blätter tragen. Für Exemplare, die nicht nur am Stamm belaubt sind — die Avocado ist so eine.

`sonderfrucht` hängt statt Früchten etwas anderes an die Blattspitzen, jeweils ab Stufe 3:

| Wert | Was | Für |
|---|---|---|
| `kaese` | kleine gelbe Käseecken mit Löchern | Käsekraut — der Name liefert die Vorlage |
| `biene` | kleine Bienen mit Flügeln und Streifen | Strauchbasilikum, den Anne bewusst für die Bienen blühen lässt |

Beide funktionieren in `busch` und `haenger`. Wer weitere Formen ergänzt, legt einen eigenen Zeichner an und schaltet ihn über die JSON zu, statt ihn an eine Pflanzen-ID zu binden.

Die Familie `busch` kann ebenfalls blühen: Ist `BLUETENFARBE[id]` gesetzt, sitzt an jeder Blattspitze eine Blüte. `bluete_groesse` steuert den Maßstab — 0.55 für die winzigen Blüten des Strauchbasilikums, 0.95 für die Bienenblume. Deshalb braucht die Bienenblume auch keine Hängetriebe mehr: als kompaktes Blütenpolster in der Familie `busch` entspricht sie eher der echten Pflanze.

Blüten funktionieren wie Früchte: `BLUETENFARBE` entscheidet, ob welche gezeichnet werden. Die Bienenblume bekommt eine Farbliste und streut entsprechend bunte fünfblättrige Blüten entlang ihrer Hängetriebe; jede Pflanze der Familie `haenger` ohne Eintrag bleibt rein grün. Die Pinke Blume nutzt ihre Liste für die Federbüsche.

Früchte erscheinen nur bei Pflanzen, die in `FRUCHTFARBE` einen Eintrag haben. Eine Pflanze der Familie `frucht` ohne Eintrag — die Avocado etwa — bekommt Stiel und Blätter, aber nichts Buntes. So lässt sich dieselbe Silhouette für tragende und nicht tragende Pflanzen nutzen.

`blatt_bonus` addiert oder entzieht einer Pflanze einzelne Blätter, ohne an Stufe oder Dichte zu drehen — für Feinabstimmung, wenn zwei Pflanzen nebeneinander vergleichbar aussehen sollen.

`dichte` vervielfacht bei den fächerförmigen Familien (`busch`, `schwert`, `palme`) die Zahl der Blattpositionen — für buschige Exemplare wie die Wasserlilien mit Faktor 2. Die Zahl der sichtbaren Blätter wächst dann anteilig mit der Stufe mit, statt fest bei 3 bis 13 zu liegen.

Das optionale Feld `wuchshoehe` staucht oder streckt eine Pflanze, ohne ihr etwas wegzunehmen — die Pinke Blume steht auf 0.5 und behält trotzdem alle sechs Federbüschel, sie sitzen nur dicht über dem Topf. Damit das funktioniert, sind in der Familie `bluete` sämtliche Höhen als Anteil von `h` gerechnet statt in festen Pixeln. Wer eine Familie um Details erweitert, sollte es genauso halten: absolute Abstände brechen, sobald jemand die Höhe verstellt.

Das optionale Feld `mindeststufe` in der JSON hebt eine Pflanze auf eine Untergrenze an. Gedacht für Exemplare, die draußen längst ausgewachsen sind und im Beet nicht als Sämling anfangen sollen — die Avocado steht deshalb fest auf 5. Pflege hebt darüber hinaus weiter an, senkt aber nie unter den Wert.

Die Fruchtfarben stehen in `FRUCHTFARBE`, Blatt- und Stielgrün in den Konstanten `BLATT`, `STIEL`, `HELL`. Sie sind bewusst themenunabhängig gesetzt: die Porträts sind die farbige Ebene, die auf hellem Papier ebenso funktioniert wie auf dunklem Grün.

### Testen

`test_portraet.js` im Arbeitsverzeichnis (nicht Teil der Skill) prüft alle Pflanzen über alle Pflegestände auf gültiges SVG und auf `NaN`/`undefined` in den Koordinaten. Bei Änderungen an `portraet()` lohnt so ein Durchlauf — ein einzelnes `NaN` in einem Pfad lässt die Form kommentarlos verschwinden.


## Sicherung und Wiederherstellung

Der Knopf ⤓ neben den Themenfarben öffnet ein Feld mit allen Nutzerdaten als JSON — Aktivität, Ernten, eigene Pflanzen, Thema. Kopieren, irgendwo ablegen, fertig. Beim Wiederherstellen wird der eingefügte Text geprüft (Format, Datentypen), nach Bestätigung in den Speicher geschrieben und die Ansicht neu aufgebaut.

Das Format trägt `format` und `version`, damit spätere Änderungen erkennbar bleiben. Wer die Struktur der gespeicherten Daten ändert, sollte `version` erhöhen und beim Einlesen den alten Stand mit umsetzen, statt ihn abzulehnen.

Diese Sicherung ist der eigentliche Schutz. Ob der Browser-Speicher einen Neubau des Artefakts übersteht, lässt sich von der Skill-Seite aus nicht garantieren — der exportierte Text lässt sich dagegen immer zurückspielen.


## Grundstock: Historie, die nicht am Browser hängt

Unter `grundstock` in `assets/pflanzen.json` stehen Ernten und Pflegestände fest verankert. `verschmelzen()` legt beim Start den Browser-Speicher darüber.

| Datenart | Regel |
|---|---|
| Ernten | Vereinigung über `eid`; Browser-Speicher gewinnt bei Gleichheit — außer der Grundstock-Eintrag trägt `korrigiert: true` |
| `gegossen` / `geduengt` | das spätere Datum gewinnt |
| `n_gegossen` / `n_geduengt` | der höhere Wert gewinnt |
| gelöschte Ernten | `garten:geloescht` blendet sie dauerhaft aus, auch aus dem Grundstock |

Alle Regeln sind idempotent — mehrfaches Verschmelzen ändert nichts. Zähler dürfen deshalb **niemals** addiert werden, sonst wachsen die Pflanzen bei jedem Neuladen von selbst.

Eine Nebenwirkung, die man kennen sollte: Zähler lassen sich nicht unter den Grundstockwert senken. Wer wirklich zurücksetzen will, muss den Grundstock in der JSON ändern.

Beim Einpflegen einer neuen Sicherung: `eid`-Werte unverändert übernehmen und bestehende Einträge ergänzen statt ersetzen.

### Einen Eintrag im Grundstock berichtigen

Wird ein Eintrag im Grundstock geändert — falsche Pflanze, falsches Datum —, reicht das allein nicht: Wer die alte Fassung schon im Browser hat, sieht weiterhin sie, weil der Browser-Speicher normalerweise gewinnt. Der Eintrag braucht deshalb zusätzlich `korrigiert: true`. Damit setzt sich die Fassung aus der Datendatei durch.

Die `eid` bleibt dabei unverändert. Eine neue zu vergeben würde die alte Version nicht loswerden, sondern eine Dublette erzeugen.

Der Sonderfall betrifft nur den einen berichtigten Eintrag; alles andere im Browser bleibt unangetastet, auch später selbst eingetragene Ernten.

## Reihenfolge der Ernten

`ernteOrdnen()` sortiert nach Datum absteigend, bei Gleichstand nach `eid`. Aufgerufen wird sie an zwei Stellen: beim Verschmelzen und direkt beim Eintragen. Beide Stellen sind nötig — sortiert nur das Laden, landet ein nachgetragener Eintrag mit älterem Datum bis zum nächsten Neuladen fälschlich ganz oben.

Die Vitrine dreht die Liste um, damit die älteste Ernte links steht und neue nach rechts wachsen.

## Mehrere Exemplare in einem Topf

`pflanzen_im_topf: 8` zeichnet dieselbe Sorte mehrfach nebeneinander — gedacht für Aussaaten wie den Koriander, wo viele Sämlinge in einer Schale stehen. Jedes Exemplar bekommt eine eigene Größe (vier Stufen im Wechsel), eine leichte Neigung und einen eigenen Platz über die Topfbreite. Die kleineren werden zuerst gezeichnet und stehen dadurch hinten.

Wichtiger als diese äußeren Unterschiede ist aber, dass sich die Sämlinge **unterschiedlich verzweigen**. Dafür ist die Silhouettenerzeugung in `silhouette(saat)` gekapselt: der Startwert steuert eine deterministische Streuung von Blattwinkeln, Blattlängen und Blattzahl. Acht Aufrufe mit acht Startwerten ergeben acht verschiedene Pflanzen — deterministisch, also bei jedem Neuzeichnen dieselben acht.

`saat = 0` schaltet die Streuung ganz ab. Einzelpflanzen werden deshalb exakt so gezeichnet wie zuvor; wer die Streuung erweitert, sollte sie immer mit dem Faktor `streu` multiplizieren, damit das so bleibt.

Mit der Wuchsstufe erscheinen nach und nach mehr Sämlinge — bei Stufe 1 zwei, bei Stufe 5 alle. Der Topf füllt sich also, statt dass ein einzelnes Pflänzchen größer wird.

Sinnvoll dazu: `dichte` herunterdrehen, damit die einzelnen Exemplare nicht selbst schon buschig sind, und `wuchshoehe` anheben, weil die Verkleinerung sonst zu gedrungen wirkt. Beim Koriander sind es 0.7 und 1.5.

Eine Falle dabei: Bei niedriger Dichte und niedriger Stufe kann die berechnete Blattzahl auf eins oder — mit der Streuung — auf null fallen. Aus sieben Sämlingen werden dann sieben Striche. Die Familien `busch` und `schwert` haben deshalb eine Untergrenze von drei sichtbaren Blättern. Wer eine neue Familie ergänzt, sollte dieselbe Untergrenze vorsehen.

Auch hier wird um die Erdlinie skaliert und um (mitte, ERDE) gedreht, damit alle Sämlinge im Substrat stehen und keiner schwebt.

**Sämlinge werden zusätzlich um 7 px angehoben.** Der Grund: Der Topf wird nach der Pflanze gezeichnet, und sein Rand ist etwa fünf Pixel hoch. Bei großen Pflanzen fällt das nicht auf, bei einem 16-px-Sämling verschwindet dagegen die halbe Pflanze dahinter — sichtbar bleiben nur die äußersten Blattspitzen, was aussieht, als wüchse die Pflanze neben dem Topf. Mit der Anhebung sitzt der Ansatz auf der Topfkante statt dahinter.

Faustzahlen zur Kontrolle: Topfrand-Oberkante bei y = 74, Rand seitlich 19 px von der Mitte. Eine Topfbepflanzung sollte deutlich über y = 74 hinausragen und seitlich innerhalb der 19 px bleiben.

Sämlinge in einem Topf bekommen einen **schmaleren Fächer** (50° statt 80°) — ein breiter Fächer schiebt die äußeren Blätter über den Topfrand hinaus. Zusätzlich sind alle Blattwinkel bei 78° gekappt: darüber zeigt ein Blatt nach unten und verschwindet hinter dem Topfkörper, was aussieht, als wüchse die Pflanze unter dem Topf hervor. Beides gilt für die Familie `busch`; wer eine weitere Familie für Topfgesellschaften öffnet, sollte es übernehmen.

Der seitliche Abstand richtet sich nach der Wuchshöhe (`4 + h · 0.4`, gedeckelt bei 26). Sonst stehen kleine Sämlinge unnötig weit auseinander und ihre Blätter ragen neben den Topf statt hinein. Der Topfrand liegt 19 px von der Mitte entfernt — das ist der Wert, an dem sich die Breite einer Topfbepflanzung messen lassen muss.

## Gemeinsame Töpfe

Steht bei einer Pflanze `topf_mit: "<id>"`, wächst sie im Beet im Topf der genannten Pflanze mit, statt einen eigenen zu bekommen. Die Gastpflanze erscheint nicht als eigener Topf; der Name unter dem Topf bekommt ein `+1`, der Tooltip nennt beide.

Umgesetzt in `portraet()`: der Gast wird über einen rekursiven Aufruf mit `nurPflanze = true` geholt (liefert nur die Pflanze ohne SVG-Rahmen und ohne Topf), verkleinert und seitlich versetzt eingefügt. Der Wirt rückt dabei zur anderen Seite.

Beim Verkleinern muss **um die Erdlinie skaliert werden**, nicht um den Bildursprung — sonst wandert der Ansatzpunkt nach oben und die Pflanze schwebt über dem Topf. Die Verschiebung dafür ist `translate(dx + mitte·(1−s), ERDE·(1−s))`; damit bleibt der Punkt (mitte, ERDE) genau dort, wo er hingehört.

In der Pflanzenliste, im Gieß- und im Düngeplan bleiben beide eigenständig — sie teilen sich zwar die Erde, brauchen aber eigene Einträge.

Aktuell betrifft das die Krähen-Zwiebeln, die im Topf der Frühlingszwiebeln sitzen.

## Fallstrick: Animationsklasse und Positionierung trennen

`.wuchs` setzt für die Einblendung `transform-box: fill-box` und `transform-origin: 50% 100%`. In SVG2 wird das `transform`-**Attribut** auf die CSS-Eigenschaft `transform` abgebildet — beide Angaben wirken also auf dasselbe Element, und `transform-origin` verschiebt dann auch eine reine Positionierung.

Ein Element darf deshalb **nie gleichzeitig** die Klasse `wuchs` und ein `transform`-Attribut tragen. Richtig ist ein Zwischenelement:

```html
<g class="wuchs"><g transform="translate(…) scale(…)">…</g></g>
```

Das ist besonders tückisch, weil sich der Fehler nicht rechnerisch zeigt: Alle Koordinaten stimmen, nur der Bezugspunkt ist ein anderer. Wer die Positionierung nachrechnet, findet nichts — sichtbar wird es erst im Browser, wo Pflanzen dann neben oder hinter dem Topf stehen.

Prüfen lässt sich das mit einer Suche nach `<g class="wuchs…" … transform=` über alle Pflanzen und Wuchsstufen; das Ergebnis muss null sein.

## Zwei Sonderformen

**`pilea`** — die Ufopflanze. Nutzt dieselbe Blattform wie die Monstera, nur ohne Fensterung und mit einem Punkt in der Mitte, wo bei der Pilea der Stiel ansetzt. Die Blätter sitzen abwechselnd links und rechts an geschwungenen Stielen und werden nach oben hin versetzt gestapelt.

Ein erster Versuch mit einfachen Kreisen an aufgefächerten Stielen sah aus wie eine Muschel — die Monstera-Blattform trifft die Pflanze deutlich besser. Merkregel: Vor einer neuen Blattform erst prüfen, ob eine bestehende passt.

**`orchidee`** — Phalaenopsis. Unten zwei breite, flach liegende Blätter, darüber ein Blütenbogen als quadratische Bézierkurve.

Das Feld `blueht` steuert, ob der Bogen überhaupt gezeichnet wird. Eine Phalaenopsis steht die meiste Zeit des Jahres ohne Blüte da. Sobald ein Blütentrieb kommt, genügt der Wechsel auf `true`. Die Blüten sitzen bei t = 0.42, 0.60, 0.76 und 0.92 auf dieser Kurve und erscheinen nacheinander mit der Wuchsstufe; sie werden nach oben hin etwas kleiner, was den Eindruck von Tiefe gibt. Gezeichnet werden sie von `orchidbluete()` mit fünf Blütenblättern und einer dunkleren Lippe.

Beim Anlegen weiterer Sonderformen: Die Blüten- und Blattpositionen aus derselben Bahnfunktion ableiten, mit der auch der Stiel gezeichnet wird. Zwei getrennte Formeln laufen früher oder später auseinander.

## Ein Hinweis zu Familien-IDs

Die Familie wird über die Pflanzen-`id` zugeordnet, nicht über den Namen. Wird eine Pflanze umbenannt — etwa `zimmerpalme` von „Zimmerpalme" zu „Drachenbaum" —, bleibt die `id` unverändert, damit die Historie erhalten bleibt. In `familie()` steht dann eine Zuordnung, die auf den ersten Blick widersprüchlich aussieht:

```js
if (id === 'zimmerpalme') return 'drachenbaum';   // id historisch
```

Das ist Absicht und mit einem Kommentar versehen. Wer beim Aufräumen die `id` „richtigstellt", kappt damit Gieß-, Dünge- und Erntehistorie dieser Pflanze.
