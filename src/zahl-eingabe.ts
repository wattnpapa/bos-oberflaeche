/**
 * Herkunft: Erfassungsbogen `src/app/zahl-eingabe.ts` (Commit 441811c), unverändert.
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
}

const MINUS = /^[-−–‒‐]/;

/** Eingabetext → Zahl oder Meldung. Leer zählt als 0 (ohne Meldung). */
export function zahlLesen(eingabe: string, regeln: ZahlRegeln = {}): ZahlErgebnis {
  const min = regeln.min ?? 0;
  const t = eingabe.trim().replace(/\s+/g, "");
  if (t === "") return { wert: min > 0 ? null : 0, meldung: "" };
  const gezeigt = eingabe.trim();
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
  return { wert: ganz, meldung: "" };
}
