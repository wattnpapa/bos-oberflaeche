import { readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";

// Ein Lauf, eine Umgebung: Dieser Baustein ist Oberfläche und setzt ein DOM
// voraus (ADR-004 der Meldekopf-App). Deshalb nur jsdom — anders als die
// Kern-Bausteine, die unter node UND jsdom laufen müssen.
export default defineConfig({
  // Die Token-Datei als Text für ihre Tests: unter jsdom gibt es kein
  // Dateisystem, und `?raw` liefert für Stylesheets in Vitest einen leeren Text.
  define: { __TOKEN_CSS__: JSON.stringify(readFileSync(new URL("./src/stil/token.css", import.meta.url), "utf8")) },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    // <dialog>-Ersatz, Speicher-Ersatz, Aufräumen nach jedem Test; der
    // Prellschutz der Rückfragen ist aus (sein eigener Test schaltet ihn ein).
    setupFiles: ["test/umgebung.ts"],
  },
});
