/**
 * Herkunft: Erfassungsbogen `src/app/tastatur.ts` (Commit 441811c), unverändert.
 *
 * Bildschirmtastatur: Die feste Leiste weicht, solange sie offen ist
 * (Audit Runde 4, R4-G3).
 *
 * Die feste Fußleiste („← Zurück", „◐", „Weiter →", in der Erfassung „In
 * Einsatz übernehmen") liegt über der Vorschlagsliste (z-index 25 gegen 20,
 * R3-S4: der Tipp auf den Knopf sollte nicht den Ortsverband darunter
 * wählen). In der Android-App schrumpft das Fenster über der Tastatur, die
 * Leiste sitzt dann direkt über den Tasten — und über den Vorschlägen: bei
 * 360 × 360 begann sie bei 211 px, die Vorschläge lagen bei 202–445 px, ein
 * Tipp auf den ersten Vorschlag traf „In Einsatz übernehmen".
 *
 * Darum steht auf <html> die Klasse `tastatur-offen`, solange ein Feld mit
 * Texteingabe den Fokus hat UND die sichtbare Höhe deutlich unter der
 * gewohnten liegt; das Stylesheet blendet `footer.nav` dann aus. Beides
 * zusammen, nicht eines allein:
 *  - Nur der Fokus würde die Leiste am Rechner und mit Hardware-Tastatur
 *    verschwinden lassen, wo es keine Tastatur auf dem Bild gibt — und wer im
 *    Feld steht und „Weiter" will, käme nicht mehr hin.
 *  - Nur die Höhe träfe auch Browser-Leisten, Zoom und das Verkleinern eines
 *    Fensters am Rechner.
 *
 * Gemessen wird die kleinere von `window.innerHeight` (Android-App und
 * Browser mit „resizes-content") und `visualViewport.height` (iOS und
 * Chrome-Android mit „resizes-visual"). Maßstab ist die größte Höhe, die
 * dieses Fenster bei dieser Breite je hatte; ein Wechsel der Breite
 * (Drehen) setzt ihn neu. Bei Pinch-Zoom (Skalierung ≠ 1) schrumpft die
 * sichtbare Höhe ohne Tastatur — dann gilt sie nicht als offen.
 */

/** Klasse auf <html>; index.html blendet `footer.nav` damit aus. */
export const TASTATUR_KLASSE = "tastatur-offen";

/** So viel muss die sichtbare Höhe mindestens schrumpfen (px). */
export const MIN_SCHRUMPF_PX = 120;
/** … und mindestens so viel Anteil der gewohnten Höhe. */
export const MIN_SCHRUMPF_ANTEIL = 0.2;

/** Eingabetypen, bei denen eine Bildschirmtastatur erscheint. */
const TEXT_TYPEN = new Set(["text", "search", "tel", "email", "url", "number", "password", ""]);

/** Hat dieses Element eine Texteingabe (und damit auf dem Telefon eine Tastatur)? */
export function istTexteingabe(el: Element | null | undefined): boolean {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === "TEXTAREA") return !(el as HTMLTextAreaElement).readOnly;
  if (tag === "INPUT") {
    const i = el as HTMLInputElement;
    return !i.readOnly && TEXT_TYPEN.has((i.getAttribute("type") ?? "").toLowerCase());
  }
  return (el as HTMLElement).isContentEditable === true;
}

/**
 * Ist die Tastatur offen? Reine Rechnung, damit sie sich ohne Browser prüfen
 * lässt.
 * @param grundHoehe größte bisher gesehene Höhe bei dieser Fensterbreite
 * @param hoehe      aktuell sichtbare Höhe
 * @param skala      Pinch-Zoom (`visualViewport.scale`), 1 ohne Zoom
 */
export function tastaturOffen(fokusInTexteingabe: boolean, grundHoehe: number, hoehe: number, skala = 1): boolean {
  if (!fokusInTexteingabe) return false;
  if (Math.abs(skala - 1) > 0.05) return false;
  const schrumpf = grundHoehe - hoehe;
  return schrumpf >= Math.max(MIN_SCHRUMPF_PX, grundHoehe * MIN_SCHRUMPF_ANTEIL);
}

/**
 * Das Feld rückt in die obere Hälfte des verbliebenen Bildes, damit die
 * Vorschlagsliste darunter Platz hat: bei 360 px Höhe und dem Feld bei 236 px
 * war nur der erste von drei Vorschlägen im Bild. Nur wenn es tiefer steht;
 * der Rand oben (`scroll-margin-top` in index.html) lässt die Beschriftung
 * stehen.
 */
function feldNachOben(el: Element | null, sichtbareHoehe: number): void {
  const feld = el as HTMLElement | null;
  if (!feld || typeof feld.scrollIntoView !== "function") return;
  if (feld.getBoundingClientRect().bottom <= sichtbareHoehe * 0.5) return;
  try {
    feld.scrollIntoView({ block: "start", behavior: "instant" });
  } catch {
    /* Umgebung ohne Layout */
  }
}

/**
 * Beobachter starten: setzt und entfernt die Klasse auf <html>. Gibt eine
 * Funktion zum Beenden zurück (Tests).
 */
export function tastaturWaechterStarten(
  fenster: Window = window,
  dokument: Document = document,
): () => void {
  const vv = fenster.visualViewport ?? null;
  let breite = fenster.innerWidth;
  let grund = Math.max(fenster.innerHeight, vv?.height ?? 0);
  let offen = false;

  const pruefen = () => {
    const sichtbar = Math.min(fenster.innerHeight, vv?.height ?? fenster.innerHeight);
    if (fenster.innerWidth !== breite) {
      // Gedreht oder in der Größe verändert: der alte Maßstab gilt nicht mehr.
      breite = fenster.innerWidth;
      grund = Math.max(fenster.innerHeight, vv?.height ?? 0);
    } else if (!offen) {
      // Solange die Tastatur zu ist, trägt die Höhe den Maßstab nach oben
      // (Browserleiste eingefahren). Offen darf sie ihn nicht verschieben.
      grund = Math.max(grund, fenster.innerHeight, vv?.height ?? 0);
    }
    const neu = tastaturOffen(istTexteingabe(dokument.activeElement), grund, sichtbar, vv?.scale ?? 1);
    if (neu === offen) return;
    offen = neu;
    dokument.documentElement.classList.toggle(TASTATUR_KLASSE, neu);
    if (neu) feldNachOben(dokument.activeElement, sichtbar);
  };

  // Der Fokus steht beim `focusout` noch auf dem alten Element — erst danach prüfen.
  const spaeter = () => void fenster.setTimeout(pruefen, 0);
  fenster.addEventListener("resize", pruefen);
  vv?.addEventListener("resize", pruefen);
  dokument.addEventListener("focusin", spaeter);
  dokument.addEventListener("focusout", spaeter);
  const enterEnde = enterWaechterStarten(dokument);
  return () => {
    enterEnde();
    fenster.removeEventListener("resize", pruefen);
    vv?.removeEventListener("resize", pruefen);
    dokument.removeEventListener("focusin", spaeter);
    dokument.removeEventListener("focusout", spaeter);
    dokument.documentElement.classList.remove(TASTATUR_KLASSE);
  };
}


/**
 * „Weiter" der Bildschirmtastatur (Audit Runde 9, R9-G6): In den Schritten des Assistenten springt die
 * Eingabetaste in einem Feld zum nächsten Feld, im letzten schließt sie die Tastatur — dann ist die
 * Fußleiste mit „Weiter" wieder im Bild (sie weicht, solange die Tastatur offen ist, R4-G3). Die
 * Tastaturtaste trägt dazu `enterkeyhint` „next" bzw. „done". Felder, die Enter selbst verwenden
 * (Vorschlagslisten, Schnelleingabe-Tabelle), rufen `preventDefault()` auf und bleiben unberührt;
 * Textbereiche und Knöpfe auch.
 */
const SCHRITT_FELD = ".schritt-inhalt";
const FOLGEFELD = 'input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]):not([type="button"]):not([type="submit"]), select, textarea';

function sichtbarBedienbar(el: HTMLElement): boolean {
  const f = el as HTMLInputElement;
  if (f.disabled || f.readOnly || el.hidden || el.getAttribute("aria-hidden") === "true") return false;
  const stil = el.ownerDocument.defaultView?.getComputedStyle(el);
  if (stil && (stil.display === "none" || stil.visibility === "hidden")) return false;
  // Ohne Layout (Testumgebung) gibt es keine Rechtecke; sonst zählt, was gezeichnet wird (geschlossene <details> nicht).
  const mitLayout = el.ownerDocument.documentElement.getBoundingClientRect().width > 0;
  return !mitLayout || el.getClientRects().length > 0;
}

/** Das Feld nach `el` im Schritt, das Eingabe annimmt; `null` für das letzte. */
export function naechstesFeld(el: HTMLElement): HTMLElement | null {
  const wurzel = el.closest(SCHRITT_FELD);
  if (!wurzel) return null;
  const alle = Array.from(wurzel.querySelectorAll<HTMLElement>(FOLGEFELD)).filter((x) => x === el || sichtbarBedienbar(x));
  const i = alle.indexOf(el);
  return i >= 0 ? (alle[i + 1] ?? null) : null;
}

function enterWaechterStarten(dokument: Document): () => void {
  const hinweis = (e: FocusEvent) => {
    const el = e.target as HTMLElement | null;
    if (!el || el.tagName !== "INPUT" || !istTexteingabe(el) || !el.closest(SCHRITT_FELD)) return;
    el.setAttribute("enterkeyhint", naechstesFeld(el) ? "next" : "done");
  };
  const taste = (e: KeyboardEvent) => {
    if (e.key !== "Enter" || e.defaultPrevented || e.isComposing || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
    const el = e.target as HTMLElement | null;
    if (!el || el.tagName !== "INPUT" || !istTexteingabe(el) || !el.closest(SCHRITT_FELD)) return;
    if (el.closest("dialog, form") || el.getAttribute("role") === "combobox") return;
    e.preventDefault();
    const weiter = naechstesFeld(el);
    if (weiter) weiter.focus();
    else el.blur();
  };
  dokument.addEventListener("focusin", hinweis);
  dokument.addEventListener("keydown", taste);
  return () => {
    dokument.removeEventListener("focusin", hinweis);
    dokument.removeEventListener("keydown", taste);
  };
}
