/**
 * @bos/oberflaeche — gemeinsame Oberfläche von Erfassungsbogen und Meldekopf.
 *
 * Entsteht in Phase 1 der Meldekopf-Übernahme aus dem Erfassungsbogen
 * (docs/uebernahme-aus-erfassungsbogen.md im Repo wattnpapa/meldekopf,
 * Abschnitt C). Bis dahin ist dieses Paket leer; die Module kommen mit ihren
 * Tests und Kopfkommentaren aus `src/app/` des Erfassungsbogens:
 *
 *   dialoge, modal-overlay          Dialogschicht statt Systemdialoge
 *   anzeige-modus, anzeige-schalter Hell/Dunkel/Feld/Nacht
 *   org-farben                      Kennfarben, Kopf-Töne
 *   kopfnav, kopfnav-ui, seiten-kopf
 *   tipp-schutz, schrift-stufe, tastatur
 *   daumen-quittung, quittung, einlese-quittung
 *   eintrag-bewegung, kartenstapel
 *   fehlerfaenger, fehler-im-bild, feste-warnung
 *   bausteine (Auswahl aus schritte/bausteine.tsx)
 *   stil/                           Design-Token und Grundlayout (CSS)
 *
 * Importiert wird modulgenau (`@bos/oberflaeche/dialoge`), nicht über diese
 * Fassade. Sie bleibt leer, damit kein Konsument versehentlich alles zieht.
 */
export {};
