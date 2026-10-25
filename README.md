# @bos/oberflaeche

Gemeinsame Oberfläche von Erfassungsbogen und Meldekopf: Design-Token,
Dialogschicht, Anzeigemodi, Kopfnavigation, Tipp-Schutz, Quittungen,
Feld-Bausteine. Nur Darstellung und Bedienmechanik, keine Fachlogik.

Dieses Repository ist **kein eigenständiges Produkt**, sondern hängt als
git-Submodul unter `vendor/bos-oberflaeche` in zwei Produkten:

- **Erfassungsbogen** (<https://github.com/wattnpapa/erfassungsbogen>)
- **Meldekopf** (<https://github.com/wattnpapa/meldekopf>)

Beide binden das Paket über `"@bos/oberflaeche": "file:vendor/bos-oberflaeche"` ein.

> **Stand 2026-10-25:** Gerüst ohne Inhalt. Die Module kommen in Phase 1 der
> Meldekopf-Übernahme aus `src/app/` des Erfassungsbogens hierher, mit Tests
> und Kopfkommentaren samt den Audit-Begründungen (R2-H4, R5-S2 …). Welche,
> steht im Übernahmeplan des Meldekopf-Repos
> (`docs/uebernahme-aus-erfassungsbogen.md`, Abschnitt C) und unten.

## Warum dieser Baustein anders ist als der Kern

Die vier Kern-Bausteine (`@bos/eeb-format`, `@bos/meldekopf`,
`@bos/vokabulare`, `@bos/taktische-zeichen`) dürfen weder DOM noch React
anfassen (ADR-003, Aufnahmeregel 2). Dieser Baustein **ist** Oberfläche: Er
darf React und DOM, und er ist genau deshalb kein Kern-Baustein, sondern ein
eigener Typ mit eigenen Regeln (ADR-004 der Meldekopf-App).

## Inhalt (Ziel)

| Modul | Was | Herkunft im Erfassungsbogen |
|---|---|---|
| `dialoge`, `modal-overlay` | `frageText`, `frageFelder`, `frageJaNein`, `frageWahl`, `zeigeHinweis` statt Systemdialoge; Verlaufs-Ebenen für die Zurück-Geste | `dialoge.tsx`, `modal-overlay.ts` |
| `anzeige-modus`, `anzeige-schalter` | Hell, Dunkel, Feld, Nacht als Token-Belegung; nur per Schalter | gleichnamig |
| `org-farben` | Kennfarben je Organisation, Kopf-Töne auf 4,5:1 und 7:1 | `org-farben.ts` |
| `kopfnav`, `kopfnav-ui`, `seiten-kopf` | Kopfnavigation, Einträge je App konfigurierbar | gleichnamig |
| `tipp-schutz` | Fingerstellen-Sperre nach Handlungen, die unter dem Finger etwas austauschen; Prellschutz | `tipp-schutz.ts` |
| `schrift-stufe`, `tastatur` | Klassen `schrift-gross` und `tastatur-offen` auf `<html>` | gleichnamig |
| `daumen-quittung`, `quittung`, `einlese-quittung` | Quittung am unteren Rand mit „Rückgängig" in voller Knopfgröße | gleichnamig |
| `eintrag-bewegung`, `kartenstapel` | Zugang und Abgang an Kartenlisten sichtbar | gleichnamig |
| `fehlerfaenger`, `fehler-im-bild`, `feste-warnung` | Fangnetz um die App, Warnleisten | gleichnamig |
| `bausteine` | Feld- und Auswahlbausteine, soweit beide Apps sie brauchen | Auswahl aus `schritte/bausteine.tsx` |
| `stil/` | Design-Token, Grundlayout, Modus-Klassen (CSS) | Stylesheets aus `src/` |

Importiert wird **modulgenau** (`@bos/oberflaeche/dialoge`,
`@bos/oberflaeche/stil/token.css`), nicht über den Sammel-Einstieg; der
bleibt leer.

## Regeln (ADR-004 der Meldekopf-App)

1. **Nur Darstellung und Bedienmechanik.** Keine Fachlogik, kein Zugriff auf
   die Einsatz-Sammlung, keine Exporte. Vom Bogenmodell höchstens Typen für
   die Anzeige (`@bos/eeb-format` als `peerDependency`).
2. **Persistenz nur für eigene Anzeige-Schlüssel** (`eeb.anzeigemodus.v1`).
   Alles andere wird von der App hereingereicht.
3. **Kein Node, kein Electron, kein Capacitor, keine Rückimporte** aus
   einer der Apps oder aus S1-Control; geprüft per ESLint.
4. **Klein halten.** Was sich schnell ändert oder nur eine App braucht, bleibt
   in der App. Jede Aufnahme heißt Pin-Update in zwei Repos.
5. **Änderungen additiv**, Klassennamen und Token-Namen sind Schnittstelle:
   Umbenennen bricht die Stylesheets beider Apps.
6. **Gepinnte Submodul-Commits**; kein automatisches Folgen von `main`.
7. **Tests unter jsdom** mit Testing Library; dieselbe Feldtauglichkeit wie
   im Erfassungsbogen (Trefferflächen, Kontrast im Feld-Modus, Tipp-Schutz)
   bleibt durch die mitwandernden Tests belegt.

Regel 3 ist maschinell hinterlegt (`eslint.config.mjs`); `tsconfig.json`
setzt `"types": []` (keine Node-Globals) und `lib` **mit** DOM.

Der Rückweg aus ADR-003 gilt auch hier: Blockiert dieser Baustein zweimal in
drei Monaten ein Release einer App, wird der Stand als Kopie übernommen, der
Herkunfts-Commit festgehalten, und beide Seiten pflegen getrennt weiter.

## Lokal bauen und prüfen

Voraussetzung: Node 24 (siehe `.nvmrc`), `eeb-format` als Nachbarordner,
gebaut.

```bash
npm install
npm run build        # dist/ samt Typen; kopiert src/stil nach dist/stil
npm run typecheck
npm run lint
npm test
```

Kein `prepare`-Skript, aus denselben Gründen wie bei den Kern-Bausteinen
(ADR-003a des Erfassungsbogens).

## Lizenz

EUPL-1.2. Die Oberflächenschrift Archivo liegt in den Apps im Bundle, nicht
hier.
