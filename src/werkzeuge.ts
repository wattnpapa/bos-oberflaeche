/**
 * Die Werkzeugzeile — Querverweise auf die Werkzeuge desselben Autors, ganz
 * unten in jeder Fußzeile.
 *
 * Herkunft: Erfassungsbogen `src/app/werkzeuge.ts` (Commit 441811c).
 * Geändert für @bos/oberflaeche: Die Liste ist Sache der App und wird
 * hineingereicht (`werkzeugeHtml(liste)`); der Meldekopf steht in seiner
 * eigenen Liste mit drin, der Erfassungsbogen in seiner. Hier bleibt das
 * Markup, damit beide Fußzeilen gleich gebaut sind.
 *
 * Zwei Fassungen entstehen in der App aus ihrer Liste:
 *   - die React-Fassung in der App-Fußzeile,
 *   - der statische Block `<!-- WERKZEUGE:START -->` … `<!-- WERKZEUGE:END -->`
 *     in jeder Fußzeile unter `public/` (Build-Skript der App).
 *
 * Alle stehen in fester Reihenfolge, das eigene Projekt eingeschlossen: Die
 * Zeile ist auf allen Seiten dieselbe. Linktext ist die Domain in
 * Kleinbuchstaben — sie sagt, wohin der Link führt, und ist zugleich der Name.
 *
 * Der Mittelpunkt ist ein eigenes Element mit `aria-hidden`, nicht Teil des
 * Links: sonst würde er mit unterstrichen, gehörte zur Trefferfläche und würde
 * vorgelesen.
 */

export interface Werkzeug {
  href: string;
  label: string;
}

export const WERKZEUGE_TITEL = "Weitere Werkzeuge";

/** Statisches Markup für die Seiten unter public/ (ohne Laufzeit-Skript). */
export function werkzeugeHtml(werkzeuge: readonly Werkzeug[]): string {
  const eintraege = werkzeuge
    .map((w) => `<a href="${w.href}">${w.label}</a>`)
    .join('\n        <span class="werkzeuge-trenner" aria-hidden="true">·</span>\n        ');
  return `<!-- WERKZEUGE:START -->
      <nav class="werkzeuge" aria-label="${WERKZEUGE_TITEL}">
        ${eintraege}
      </nav>
      <!-- WERKZEUGE:END -->`;
}
