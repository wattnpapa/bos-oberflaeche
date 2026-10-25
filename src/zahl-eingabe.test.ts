/**
 * Herkunft: Erfassungsbogen `src/app/zahl-eingabe.test.ts` (Commit 441811c), unverändert.
 *
 * Zahlen aus Eingabefeldern: nie still eine andere Zahl (Audit Runde 9, R9-E1).
 */
import { describe, expect, it } from "vitest";
import { zahlLesen } from "./zahl-eingabe";

describe("zahlLesen", () => {
  it("übernimmt ganze Zahlen unverändert, ohne Satz", () => {
    expect(zahlLesen("40")).toEqual({ wert: 40, meldung: "" });
    expect(zahlLesen(" 007 ")).toEqual({ wert: 7, meldung: "" });
  });

  it("leer ist 0 (ohne Satz), mit Mindestwert über 0 nicht übernommen", () => {
    expect(zahlLesen("")).toEqual({ wert: 0, meldung: "" });
    expect(zahlLesen("  ").wert).toBe(0);
    expect(zahlLesen("", { min: 1 }).wert).toBeNull();
  });

  it("rundet Dezimalkomma und -punkt und nennt die gerundete Zahl (1,5 → 2, 38,5 → 39)", () => {
    expect(zahlLesen("1,5", { einheit: "Liter" })).toEqual({ wert: 2, meldung: "„1,5“ auf ganze Liter gerundet: 2." });
    expect(zahlLesen("38,5", { einheit: "Personen" }).wert).toBe(39);
    expect(zahlLesen("0,5").wert).toBe(1);
    expect(zahlLesen("2.4").wert).toBe(2);
    expect(zahlLesen("6,2", { einheit: "Liter" }).meldung).toBe("„6,2“ auf ganze Liter gerundet: 6.");
    expect(zahlLesen(",5").wert).toBe(1);
  });

  it("ein Komma ohne Nachkommastelle zählt als ganze Zahl (Zwischenstand beim Tippen)", () => {
    expect(zahlLesen("1,")).toEqual({ wert: 1, meldung: "" });
  });

  it("liest „1.500“ als Tausender, nicht als 1,5", () => {
    expect(zahlLesen("1.500").wert).toBe(1500);
    expect(zahlLesen("12.345.678").wert).toBe(12345678);
  });

  it("lehnt ein Minus ab, in allen Schreibweisen, und nimmt den Wert nicht (R9-E1)", () => {
    for (const t of ["-5", "−5", "–3", "-0,5"]) {
      const r = zahlLesen(t);
      expect(r.wert).toBeNull();
      expect(r.meldung).toContain("Minus geht nicht");
      expect(r.meldung).toContain(`„${t}“`);
    }
  });

  it("lehnt Buchstaben und Zeichensalat ab", () => {
    for (const t of ["abc", "1e5", "12a", "1,5,5", "--"]) {
      const r = zahlLesen(t);
      expect(r.wert, t).toBeNull();
      expect(r.meldung, t).not.toBe("");
    }
  });

  it("begrenzt auf Mindest- und Höchstwert und sagt es", () => {
    expect(zahlLesen("999", { max: 99 })).toEqual({
      wert: 99,
      meldung: "Höchstens 99 — dein Wert 999 wurde auf 99 gesetzt.",
      begrenzt: true,
    });
    expect(zahlLesen("0", { min: 1 }).meldung).toContain("Mindestens 1");
  });
});
