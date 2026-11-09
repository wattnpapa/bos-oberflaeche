/**
 * Herkunft: Erfassungsbogen `src/app/zahl-eingabe.ts` (Commit 1d7ed5f).
 *
 * Zahlen aus Eingabefeldern lesen — ohne dass je eine andere Zahl still
 * gespeichert wird (Audit Runde 9, R9-E1).
 *
 * Das Zahlenfeld des Browsers (`type="number"`) lieferte beim Tippen von
 * „1,5" oder „−5" Zwischenzustände (leer, „1.5"), die die App zu 0 machte und
 * ins Feld zurückschrieb: aus 1,5 l Gemisch wurden 15, aus „−5" eine 5. Darum
 * liest dieses Modul den Text selbst und sagt bei jeder Abweichung, was daraus
 * wurde:
 *  - Dezimalkomma und -punkt zählen; das Datenmodell trägt nur ganze Zahlen,
 *    also wird gerundet und die gerundete Zahl genannt („1,5 auf ganze Liter
 *    gerundet: 2").
 *  - Ein Minus wird nicht übernommen (Mengen sind nie negativ), der alte Wert
 *    bleibt stehen.
 *  - Buchstaben und Sonderzeichen werden nicht übernommen.
 *  - Punkt als Tausendertrenner („1.500") gilt als Tausender, nicht als Dezimalpunkt.
 *  - Eine angehängte Einheit („20 l", „500l", „20 Liter") wird gelesen und der Wert übernommen;
 *    der Satz sagt, was gelesen wurde (R10-N2, R10-S5). Vorher hieß es „nicht übernommen", während
 *    die Zahl davor schon gespeichert war.
 *  - Obergrenzen je Feld stehen bei den Feldern (Liter 99 999, Personen 9 999, Sitzplätze 99).
 */

export interface ZahlErgebnis {
  /** Zu speichernder Wert; `null` = Eingabe nicht übernehmen, der bisherige Wert bleibt. */
  wert: number | null;
  /** Satz für den Nutzer; leer, wenn die Eingabe unverändert übernommen wurde. */
  meldung: string;
  /** Der Wert wurde an Mindest- oder Höchstwert gesetzt: Das Feld zeigt sofort die gesetzte Zahl. */
  begrenzt?: boolean;
}

export interface ZahlRegeln {
  min?: number;
  max?: number;
  /** Einheit im Satz „auf ganze Liter gerundet": „Liter", „Personen", ohne Angabe „Zahlen". */
  einheit?: string;
  /** Satz, wenn das Feld leer gelassen wird und deshalb 0 gilt (R10-N4); ohne Angabe bleibt es still. */
  leerMeldung?: string;
}

const MINUS = /^[-−–‒‐]/;

/** Einheit hinter der Zahl: „l", „ltr", „Liter", „Personen", „Pers.", „Plätze", „Stk" (ohne Rücksicht auf Schreibweise). */
const EINHEIT_HINTEN = /^(.*\d[.,]?\d*)(?:l|ltr\.?|liter|litern|personen|person|pers\.?|plätze|plätzen|platz|stk\.?|stück)$/i;

/** Höchstwerte der Mengenfelder (R10-S5): ein Zahlendreher mit vielen Ziffern fällt sofort auf. */
export const HOECHST_LITER = 99999;
export const HOECHST_PERSONEN = 9999;

/**
 * Satz zu einer nicht übernommenen Eingabe um den Wert ergänzen, der weiter gilt (R13-E1): Beim Tippen ist die Zahl bis
 * zum Buchstaben („5" von „5O") schon gespeichert; „nicht übernommen" allein ließ offen, ob das Feld leer oder 5 gilt.
 * Beim Einfügen gilt der vorige Wert. Ohne bekannten Wert bleibt der Satz, wie er ist.
 */
export function mitGeltendemWert(ergebnis: ZahlErgebnis, bisher: number | undefined): ZahlErgebnis {
  if (ergebnis.wert !== null || !ergebnis.meldung || bisher === undefined) return ergebnis;
  return { ...ergebnis, meldung: `${ergebnis.meldung} Es gilt weiter ${bisher}.` };
}

/** Eingabetext → Zahl oder Meldung. Leer zählt als 0 (ohne Meldung). */
export function zahlLesen(eingabe: string, regeln: ZahlRegeln = {}): ZahlErgebnis {
  const min = regeln.min ?? 0;
  const gezeigt = eingabe.trim();
  let t = gezeigt.replace(/\s+/g, "");
  if (t === "") return { wert: min > 0 ? null : 0, meldung: min > 0 ? "" : (regeln.leerMeldung ?? "") };
  const mitEinheit = EINHEIT_HINTEN.exec(t);
  if (mitEinheit) t = mitEinheit[1]!;
  if (MINUS.test(t)) {
    return { wert: null, meldung: `Minus geht nicht — „${gezeigt}“ wurde nicht übernommen. Die Menge ohne Vorzeichen eintragen.` };
  }
  let n: number;
  if (/^\d{1,3}(\.\d{3})+$/.test(t)) {
    n = Number(t.replace(/\./g, "")); // 1.500 = tausendfünfhundert
  } else if (/^\d+([.,]\d*)?$/.test(t) || /^[.,]\d+$/.test(t)) {
    n = Number(t.replace(",", "."));
  } else {
    return { wert: null, meldung: `„${gezeigt}“ ist keine Zahl — nicht übernommen.` };
  }
  if (!Number.isFinite(n)) return { wert: null, meldung: `„${gezeigt}“ ist keine Zahl — nicht übernommen.` };
  const ganz = Math.round(n);
  if (ganz < min) return { wert: min, meldung: `Mindestens ${min} — dein Wert ${gezeigt} wurde auf ${min} gesetzt.`, begrenzt: true };
  if (regeln.max != null && ganz > regeln.max) {
    return { wert: regeln.max, meldung: `Höchstens ${regeln.max} — dein Wert ${gezeigt} wurde auf ${regeln.max} gesetzt.`, begrenzt: true };
  }
  if (!Number.isInteger(n)) {
    return { wert: ganz, meldung: `„${gezeigt}“ auf ganze ${regeln.einheit ?? "Zahlen"} gerundet: ${ganz}.` };
  }
  if (mitEinheit) return { wert: ganz, meldung: `„${gezeigt}“ gelesen als ${ganz}.` };
  return { wert: ganz, meldung: "" };
}

/**
 * Beim Antippen eines Zahlenfelds den Inhalt markieren: Wer eine Vorgabe oder die bisherige Zahl überschreibt, tippt
 * die neue und die alte ist weg. Ohne das hängte sich die Ziffer an („2" + „6" = 26, R16-S1). Nach dem Fokus noch
 * einmal, weil mobile Browser den Textzeiger beim Loslassen des Fingers setzen.
 */
export function zahlMarkieren(e: { currentTarget: HTMLInputElement }): void {
  const feld = e.currentTarget;
  feld.select();
  setTimeout(() => {
    if (document.activeElement === feld && feld.selectionStart === feld.selectionEnd) feld.select();
  }, 0);
}
