import { defineConfig } from "vitest/config";

// Ein Lauf, eine Umgebung: Dieser Baustein ist Oberfläche und setzt ein DOM
// voraus (ADR-004 der Meldekopf-App). Deshalb nur jsdom — anders als die
// Kern-Bausteine, die unter node UND jsdom laufen müssen.
export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
