/**
 * Herkunft: Erfassungsbogen `src/app/schreibweise.ts` (Commit 1d7ed5f). Seit
 * dem Abgleich vom 2026-11-09 hier, weil die Auswahl-Bausteine danach suchen.
 */
/**
 * Schreibweisen vergleichbar machen (R11-H1 bis R11-H3).
 *
 * Wer „Hassmersheim", „Muellheim" oder „Gruppenfuehrer" tippt, meint „Haßmersheim", „Müllheim" und
 * „Gruppenführer": ß/ss, ä/ae/a, ö/oe/o, ü/ue/u sind auf Schweizer und Hardware-Tastaturen, beim Diktat
 * und auf dem Zettel gleichwertig. Beide Seiten eines Vergleichs werden gefaltet.
 */

/** Klein, ohne Umlaut-Unterschiede (ä/ae/a, ö/oe/o, ü/ue/u, ß/ss), Whitespace kollabiert. */
export function falte(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/ae/g, "a")
    .replace(/oe/g, "o")
    .replace(/ue/g, "u")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Wie {@link falte}, dazu Bindestrich, Schrägstrich und Punkt wie ein Leerzeichen: „Neu Ulm", „Baden Baden" und
 * „Villingen Schwenningen" finden „Neu-Ulm", „Baden-Baden" und „Villingen-Schwenningen" (R13-H2).
 */
export function sucheForm(text: string): string {
  return falte(text.replace(/[-‐-―/.]/g, " "));
}

/** Die Wörter einer Suche, gefaltet: getrennt an Leerzeichen, „/" und Komma; ohne reine Satzzeichen. */
export function suchWoerter(suche: string): string[] {
  return falte(suche)
    .split(/[\s/,;]+/)
    .filter((w) => /[a-z0-9]/.test(w));
}

/**
 * Passt der Text zur Suche? Jedes Wort der Suche muss irgendwo im Text stehen, in beliebiger Reihenfolge:
 * „FGr Wasserschaden/Pumpen" findet „FGr WP – Fachgruppe Wasserschaden/Pumpen", obwohl Kürzel und Name
 * getrennt stehen. Eine Suche ohne Wörter passt nicht.
 */
export function passtZurSuche(text: string, suche: string): boolean {
  const woerter = suchWoerter(suche);
  if (woerter.length === 0) return false;
  const t = falte(text);
  return woerter.every((w) => t.includes(w));
}

/** Gebräuchliche Kurzformen der Einheitentypen → ausgeschriebener Suchbegriff (R13-H1). Ergänzen, ersetzen nie. */
const KURZFORMEN: Record<string, string> = { bgr: "Bergungsgruppe", fz: "Fachzug" };

/**
 * Zusätzliche Suchtexte zu einer Eingabe: ohne führende Ordnungszahl („1. BGr", „2.BGr" → „BGr") und mit
 * ausgeschriebener Kurzform („BGr" → „Bergungsgruppe"). Die Eingabe selbst bleibt Suchtext; diese kommen dazu (R13-H1).
 */
export function suchAlternativen(suche: string): string[] {
  const ohneZahl = suche.replace(/^\s*[1-9]\s*\.\s*/, "").trim();
  const basis = ohneZahl !== "" ? ohneZahl : suche.trim();
  const aus = new Set<string>();
  if (basis !== suche.trim()) aus.add(basis);
  const k = KURZFORMEN[falte(basis)];
  if (k) aus.add(k);
  return [...aus];
}

/**
 * Rang eines Vokabulareintrags zur Suche: 0 = jedes Suchwort ist ein ganzes Wort des Kürzels („TZ" → „ZTr TZ"),
 * 1 = jedes Suchwort beginnt ein Wort von Kürzel oder Name, 2 = steht nur mitten im Wort („TZ" in „Abstützsystem"),
 * 3 = passt nicht. Vorher stand der Technische Zug bei „TZ" hinter acht Treffern mitten im Wort (R13-H1).
 */
export function vokabRang(kurz: string, name: string, suche: string): 0 | 1 | 2 | 3 {
  const woerter = suchWoerter(suche);
  if (woerter.length === 0) return 3;
  const label = falte(`${kurz} ${name}`);
  if (!woerter.every((w) => label.includes(w))) return 3;
  // Der ganze Name („Bergungsgruppe") ist der genaueste Treffer, vor „Bergungsgruppe (Abstützsystem Holz)".
  if (falte(name) === falte(suche)) return 0;
  const kurzWorte = falte(kurz).split(/[^a-z0-9]+/).filter(Boolean);
  if (woerter.every((w) => kurzWorte.includes(w))) return 0;
  const alleWorte = label.split(/[^a-z0-9]+/).filter(Boolean);
  if (woerter.every((w) => alleWorte.some((x) => x.startsWith(w)))) return 1;
  return 2;
}

/**
 * Ortsname für die Anzeige: Wörter, die im Verzeichnis zusammengezogen stehen („SchwäbischHall"), werden getrennt
 * („Schwäbisch Hall"). Kleinbuchstabe direkt vor Großbuchstabe ist in deutschen Ortsnamen sonst nie ein Wortinneres (R12-H3;
 * die Quelle liegt im Submodul und bleibt unverändert).
 */
export function ortAnzeige(ort: string): string {
  return (
    ort
      // „FrankfurtamMain", „MülheimanderRuhr", „ZehdenickOTOsterne": das Bindewort steht ohne Leerzeichen zwischen den Namen.
      .replace(/([a-zäöüß])(am|ander|auf|bei|ob|im|OT)(?=[A-ZÄÖÜ])/g, (_t, vor: string, wort: string) => `${vor} ${wort === "ander" ? "an der" : wort} `)
      // „BadNeuenahr", „SchwäbischHall": Kleinbuchstabe direkt vor Großbuchstabe.
      .replace(/([a-zäöüß])([A-ZÄÖÜ])/g, "$1 $2")
  );
}

/** Beginnt der Text (gefaltet) mit der Suche? */
export function beginntMit(text: string, suche: string): boolean {
  return falte(text).startsWith(falte(suche));
}

/**
 * Kennzeichen für die Anzeige (R12-N7): Großbuchstaben, Leerraum zusammengezogen, THW-Kennzeichen als „THW-80101“
 * („thw 80101“, „THW80101“, „thw–80101“ → „THW-80101“). Andere Kennzeichen behalten ihre Gliederung; ein Text, der
 * keine Zahl nach „THW“ trägt, wird nur groß geschrieben.
 */
export function kennzeichenSchreibweise(text: string): string {
  const gross = text.replace(/\s+/g, " ").trim().toUpperCase();
  const thw = /^THW[\s\-–—]*(\d{3,})$/.exec(gross);
  return thw ? `THW-${thw[1]}` : gross;
}

/**
 * „Stimmt das?" bei einem THW-Kennzeichen mit „THW-" und weniger oder mehr als fünf Ziffern (R15-E5): ein Zahlendreher
 * oder eine fehlende Ziffer fiel erst beim Abgleich mit dem Papier auf. Andere Formate und freier Text bleiben unbeanstandet.
 */
export function kennzeichenHinweis(text: string): string | null {
  const m = /^THW-(\d+)$/.exec(kennzeichenSchreibweise(text));
  return m && m[1]!.length !== 5 ? `THW-Kennzeichen: fünf Ziffern, „THW-${m[1]}“ hat ${m[1]!.length}. Stimmt das?` : null;
}
