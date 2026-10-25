/**
 * Herkunft: Erfassungsbogen `src/app/anzeige-modus.test.ts` (Commit 441811c).
 * Die Prüfungen gegen die index.html der App (Plattformpaletten, Boot-Skript)
 * bleiben in der App; hier wird gegen stil/token.css geprüft, wo die Token der
 * Modi jetzt liegen.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { ANZEIGE_MODI, NACHT_KOPF_FOND, anzeigeModus, standardThemeFarbeSetzen, themeFarbeAbgleichen } from "./anzeige-modus";

const css = __TOKEN_CSS__;

describe("Anzeigemodi in den Design-Token", () => {
  const modi = ANZEIGE_MODI.filter((m) => m.modus !== "standard");

  it.each(modi)("„$label“ belegt die Token neu", ({ modus }) => {
    expect(css, `.${modus}-modus fehlt in stil/token.css`).toContain(`.${modus}-modus {`);
  });

  it("trägt keine Kennfarbe einer App (die setzt jede App selbst)", () => {
    const regeln = css.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(regeln).not.toMatch(/#12275e|#0f4c5c/i);
    expect(regeln).not.toMatch(/:root\s*\{[^}]*--akzent:/);
  });
});

describe("Kennfarbe ohne offenen Bogen", () => {
  afterEach(() => {
    document.head.innerHTML = "";
    document.documentElement.className = "";
    document.documentElement.removeAttribute("style");
    standardThemeFarbeSetzen(null);
  });

  function meta(inhalt: string): HTMLMetaElement {
    document.head.innerHTML = `<meta name="theme-color" content="${inhalt}">`;
    return document.querySelector("meta")!;
  }

  it("nimmt die Farbe, mit der die App ihren Meta-Tag ausliefert — auch nach einem Wechsel in den Nacht-Modus und zurück", () => {
    const m = meta("#0f4c5c");
    document.documentElement.classList.add("nacht-modus");
    themeFarbeAbgleichen();
    expect(m.content).toBe(NACHT_KOPF_FOND);
    document.documentElement.classList.remove("nacht-modus");
    themeFarbeAbgleichen();
    expect(m.content).toBe("#0f4c5c");
  });

  it("lässt eine ausdrücklich gesetzte Kennfarbe vorgehen, die Organisationsfarbe eines offenen Bogens noch davor", () => {
    const m = meta("#000000");
    standardThemeFarbeSetzen("#12275e");
    themeFarbeAbgleichen();
    expect(m.content).toBe("#12275e");
    document.documentElement.style.setProperty("--org-akzent", "#a4231c");
    themeFarbeAbgleichen();
    expect(m.content).toBe("#a4231c");
  });
});

/**
 * Vorgabe aus der Systemeinstellung (Audit „Nacht und Sicht", N4): Der erste
 * Start bei Nacht begann mit einem weißen Bildschirm, obwohl das Telefon auf
 * dunkel stand. Ohne gespeicherte Wahl zählt jetzt prefers-color-scheme; eine
 * gespeicherte Wahl — auch „standard" — geht immer vor.
 *
 * Läuft in Node ohne DOM: anzeigeModus() liest nur globalThis.localStorage und
 * globalThis.matchMedia, beides wird hier nachgestellt.
 */
describe("Anzeigemodus — Vorgabe aus der Systemeinstellung", () => {
  function speicherMit(eintraege: Record<string, string>): void {
    const inhalt = new Map(Object.entries(eintraege));
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => inhalt.get(k) ?? null,
      setItem: (k: string, v: string) => void inhalt.set(k, v),
    });
  }
  function systemDunkel(matches: boolean): void {
    vi.stubGlobal("matchMedia", (abfrage: string) => ({ matches: abfrage.includes("dark") && matches }));
  }

  afterEach(() => vi.unstubAllGlobals());

  it("startet ohne gespeicherte Wahl dunkel, wenn das Gerät dunkel steht", () => {
    speicherMit({});
    systemDunkel(true);
    expect(anzeigeModus()).toBe("dunkel");
  });

  it("startet ohne gespeicherte Wahl hell, wenn das Gerät hell steht", () => {
    speicherMit({});
    systemDunkel(false);
    expect(anzeigeModus()).toBe("standard");
  });

  it("lässt eine gespeicherte Wahl vorgehen — auch „standard“ gegen ein dunkles Gerät", () => {
    systemDunkel(true);
    speicherMit({ "eeb.anzeigemodus.v1": "standard" });
    expect(anzeigeModus()).toBe("standard");
    speicherMit({ "eeb.anzeigemodus.v1": "nacht" });
    expect(anzeigeModus()).toBe("nacht");
    // Der Vorgänger-Schalter (nur Feld) zählt ebenfalls als getroffene Wahl.
    speicherMit({ "eeb.feldmodus.v1": "1" });
    expect(anzeigeModus()).toBe("feld");
  });

  it("kommt ohne matchMedia aus (alte Webviews)", () => {
    speicherMit({});
    vi.stubGlobal("matchMedia", undefined);
    expect(anzeigeModus()).toBe("standard");
  });
});
