/**
 * @bos/oberflaeche — gemeinsame Oberfläche von Erfassungsbogen und Meldekopf.
 *
 * Entstanden in Phase 1 der Meldekopf-Übernahme aus dem Erfassungsbogen
 * (docs/uebernahme-aus-erfassungsbogen.md im Repo wattnpapa/meldekopf,
 * Abschnitt C). Die Module kamen mit ihren Tests und Kopfkommentaren aus
 * `src/app/` des Erfassungsbogens (Commit 441811c):
 *
 *   dialoge, modal-overlay          Dialogschicht statt Systemdialoge
 *   anzeige-modus, anzeige-schalter Hell/Dunkel/Feld/Nacht
 *   org-farben                      Kennfarben, Kopf-Töne
 *   kopfnav, kopfnav-ui, seiten-kopf
 *   tipp-schutz, schrift-stufe, tastatur
 *   daumen-quittung, quittung, einlese-quittung
 *   eintrag-bewegung, kartenstapel
 *   fehlerfaenger, fehler-im-bild, feste-warnung
 *   werkzeuge, arbeitet, tabellen-scroll
 *   bausteine (Auswahl aus schritte/bausteine.tsx), zahl-eingabe
 *   stil/                           Design-Token und Grundlayout (CSS)
 *
 * Importiert wird modulgenau (`@bos/oberflaeche/dialoge`), nicht über diese
 * Fassade. Sie bleibt leer, damit kein Konsument versehentlich alles zieht.
 */
export {};
