/**
 * Die Kopfnavigation — Bauart für die App und die Textseiten einer Domain.
 *
 * Herkunft: Erfassungsbogen `src/app/kopfnav.ts` (Commit 441811c) und die
 * Meldekopf-Kopie aus Phase 0. Geändert für @bos/oberflaeche: Die Einträge
 * und der Name im Logo sind Daten der App und werden hineingereicht; hier
 * bleibt nur die Bauart. Der Meldekopf hat eine Leiste mit drei Einträgen,
 * der Erfassungsbogen eine Themenwelt mit Organisations- und Länderseiten —
 * dieselbe Mechanik, verschiedene Daten.
 *
 * Warum es die Leiste in der App überhaupt gibt (Erfassungsbogen): Von jeder
 * Themenseite kam man mit einem Klick in die App, umgekehrt führte der einzige
 * Weg zur Anleitung durch die komplette Startseite bis in die Fußzeile.
 *
 * Damit die Leiste nicht zweimal existiert und auseinanderläuft, stehen die
 * Einträge in der App einmal als Daten. Daraus entstehen drei Fassungen:
 *   - die Leiste der statischen Seiten (Build-Skript der App),
 *   - der statische Block im Start-Gerüst der index.html (ebenso),
 *   - die React-Fassung auf der Startseite (`Kopfnav` in kopfnav-ui.tsx).
 * Ein Test der App vergleicht die Dateien mit der Quelle.
 *
 * Die Leiste trägt bewusst NUR Wissen, keine App-Aktionen: „Neuen Bogen
 * erstellen", „QR-Code scannen…" und „Neuer Einsatz…" stehen als Weiche
 * mitten auf der Startseite. Dieselben Ziele oben noch einmal als Links hieße
 * zwei konkurrierende Bedienelemente für eine Handlung — und in den
 * Arbeitsansichten „Bogen erstellen" anzubieten, während ein Entwurf offen
 * ist, ist eine Rückfrage oder ein Datenverlust.
 */

/** Ein Unterpunkt im Aufklappmenü eines Eintrags. */
export interface NavUnterpunkt {
  href: string;
  label: string;
}

/**
 * Ein Eintrag der Kopfleiste. `aktivWenn` bestimmt, für welche Datei unter
 * `public/` der Link als aktuelle Seite hervorgehoben wird — im Erfassungsbogen
 * zählen bei „Katastrophenschutz" auch alle Länder-Unterseiten dazu, damit die
 * Zugehörigkeit beim Klicken in die Tiefe erkennbar bleibt. In der App ist
 * keine Seite aktiv: Die App ist das Ziel des Logos, kein Eintrag der Leiste.
 */
export interface NavEintrag {
  href: string;
  label: string;
  aktivWenn: (datei: string) => boolean;
  /**
   * Unterpunkte, die als Aufklapp-Menü unter dem Eintrag erscheinen. Rein per
   * CSS (`:hover`/`:focus-within`) — kein Skript zur Laufzeit. Auf Geräten ohne
   * echten Zeiger bleibt das Menü zu; dort führt der Eintrag selbst auf die
   * Seite, die genau diese Unterpunkte auflistet.
   */
  unter?: NavUnterpunkt[];
  /** Menü zweispaltig setzen (nur sinnvoll bei sehr vielen Unterpunkten). */
  zweispaltig?: boolean;
}

/**
 * Was die App über ihre Leiste weiß: die Einträge, den Namen im Logo und,
 * wenn die Leiste auf schmalen Geräten nicht in eine Zeile passt, welche
 * Einträge dort sichtbar bleiben (die übrigen tragen `nur-breit`). Ohne
 * `schmalSichtbar` bleiben alle sichtbar.
 */
export interface KopfnavQuelle {
  eintraege: readonly NavEintrag[];
  logo: string;
  schmalSichtbar?: (eintrag: NavEintrag, datei: string, aktiv: boolean) => boolean;
}

/** Ein Eintrag, fertig entschieden: aktiv? mobil sichtbar? — für beide Fassungen. */
export interface NavStand {
  href: string;
  label: string;
  aktiv: boolean;
  nurBreit: boolean;
  unter?: NavUnterpunkt[];
  zweispaltig?: boolean;
}

/**
 * Die Leiste für eine Seite, mit allen Entscheidungen getroffen. HTML-Fassung
 * und React-Fassung lesen dieselbe Liste — sonst hätte „welcher Eintrag ist
 * aktiv, welcher bleibt schmal sichtbar?" zwei Antworten.
 */
export function kopfnavAufbau(quelle: KopfnavQuelle, datei: string): NavStand[] {
  return quelle.eintraege.map((eintrag) => {
    const aktiv = eintrag.aktivWenn(datei);
    return {
      href: eintrag.href,
      label: eintrag.label,
      aktiv,
      nurBreit: quelle.schmalSichtbar ? !quelle.schmalSichtbar(eintrag, datei, aktiv) : false,
      unter: eintrag.unter,
      zweispaltig: eintrag.zweispaltig,
    };
  });
}

/**
 * Die Hülle der Leiste. Auf den Textseiten ist sie der Seitenkopf und damit ein
 * `header`; in der App steht darunter schon der Kopfbalken mit dem Seitentitel
 * (`.seiten-kopf`). Zwei `header` nebeneinander wären zwei Banner-Landmarken
 * auf einer Seite — ein Screenreader kündigte denselben Seitenkopf zweimal an.
 * Dort trägt deshalb ein `div` die Leiste; die Navigation selbst ist ohnehin
 * das `nav` darin.
 */
export type NavHuelle = "header" | "div";

/**
 * Die Leiste als statisches HTML.
 *
 * `datei` ist der Dateiname der Seite unter `public/`, für die gesetzt wird
 * (etwa `"impressum.html"`) — leer für die App, die keiner Rubrik angehört.
 * `einzug` ist die Einrückung der Hülle; ohne sie hinge der Vergleich im Test
 * an der Formatierung der Zieldatei.
 */
export function kopfnavHtml(quelle: KopfnavQuelle, datei: string, einzug = "  ", huelle: NavHuelle = "header"): string {
  const e = einzug;
  const links = kopfnavAufbau(quelle, datei)
    .map((eintrag) => {
      const klasse = eintrag.aktiv ? ' class="aktiv"' : "";
      const breit = eintrag.nurBreit ? " nur-breit" : "";
      if (!eintrag.unter) {
        // Ohne Aufklappmenü trägt der Link selbst die Klassen.
        const klassen = `${eintrag.aktiv ? "aktiv" : ""}${breit}`.trim();
        return `<a href="${eintrag.href}"${klassen ? ` class="${klassen}"` : ""}>${eintrag.label}</a>`;
      }
      const unterlinks = eintrag.unter
        .map((u) => `<a href="${u.href}"${u.href === `./${datei}` ? ' class="aktiv"' : ""}>${u.label}</a>`)
        .join(`\n${e}          `);
      const menuKlasse = eintrag.zweispaltig ? "kopfnav-unter kopfnav-unter-breit" : "kopfnav-unter";
      return `<span class="kopfnav-eintrag${breit}">
${e}        <a href="${eintrag.href}"${klasse}>${eintrag.label}</a>
${e}        <span class="${menuKlasse}">
${e}          ${unterlinks}
${e}        </span>
${e}      </span>`;
    })
    .join(`\n${e}      `);
  return `${e}<${huelle} class="kopfnav">
${e}  <div class="kopfnav-inner">
${e}    <a href="./" class="kopfnav-logo">${quelle.logo}</a>
${e}    <nav class="kopfnav-links" aria-label="Hauptnavigation">
${e}      ${links}
${e}    </nav>
${e}  </div>
${e}</${huelle}>`;
}

/**
 * Marken, zwischen denen der erzeugte Block in index.html und public/*.html
 * steht. Die Anfangsmarke nennt die Datei der App, aus der die Einträge kommen.
 */
export function kopfnavMarken(quelldatei: string): { anfang: string; ende: string } {
  return {
    anfang: `<!-- kopfnav:anfang (erzeugt aus ${quelldatei} — nicht von Hand ändern) -->`,
    ende: "<!-- kopfnav:ende -->",
  };
}
