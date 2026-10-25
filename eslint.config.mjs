import js from "@eslint/js";
import tseslint from "typescript-eslint";

// Die Regeln für den Oberflächen-Baustein (ADR-004 der Meldekopf-App, in
// Anlehnung an ADR-003 des Erfassungsbogens): React und DOM sind erlaubt,
// alles Plattformgebundene und jeder Rückimport aus einer App nicht.
const VERBOTENE_MUSTER = [
  {
    group: ["node:*"],
    message: "Der Oberflächen-Baustein läuft im Browser: keine Node-Kernmodule (ADR-004, Regel 3).",
  },
  {
    group: ["electron", "electron/*", "electron-updater"],
    message: "Electron gehört in die Anwendungsschicht, nicht in den Oberflächen-Baustein (ADR-004).",
  },
  {
    group: ["@capacitor/*", "@capacitor-community/*"],
    message: "Capacitor gehört in die Anwendungsschicht, nicht in den Oberflächen-Baustein (ADR-004).",
  },
  {
    group: ["@bos/meldekopf", "@bos/meldekopf/*"],
    message:
      "Keine Fachlogik im Oberflächen-Baustein: Die Einsatz-Sammlung wird von der App hereingereicht (ADR-004, Regel 1).",
  },
  {
    group: ["@s1/*", "s1-control", "s1-control/*"],
    message: "Keine Rückimporte aus S1-Control (ADR-004, Regel 3).",
  },
  {
    group: ["erfassungsbogen", "erfassungsbogen/*", "@erfassungsbogen/*", "meldekopf", "meldekopf/*", "@meldekopf/*"],
    message: "Keine Rückimporte aus einer der Apps (ADR-004, Regel 3).",
  },
];

const NODE_KERNMODULE = [
  "assert", "async_hooks", "buffer", "child_process", "cluster", "console",
  "constants", "crypto", "dgram", "diagnostics_channel", "dns", "domain",
  "events", "fs", "fs/promises", "http", "http2", "https", "inspector",
  "module", "net", "os", "path", "path/posix", "path/win32", "perf_hooks",
  "process", "punycode", "querystring", "readline", "repl", "stream",
  "string_decoder", "sys", "timers", "tls", "trace_events", "tty", "url",
  "util", "v8", "vm", "wasi", "worker_threads", "zlib",
].map((name) => ({
  name,
  message: "Der Oberflächen-Baustein läuft im Browser: keine Node-Kernmodule (ADR-004, Regel 3).",
}));

// Pakete, die eine App-Aufgabe tragen (Scannen, PDF rendern, Service Worker)
// und deshalb nicht in den Oberflächen-Baustein gehören.
const APP_PAKETE = ["jsqr", "qrcode", "zxing-wasm", "pdfmake", "workbox-window", "virtual:pwa-register"].map(
  (name) => ({
    name,
    message: "Scannen, PDF und Service Worker sind Aufgaben der App, nicht des Oberflächen-Bausteins (ADR-004).",
  }),
);

export default tseslint.config(
  { ignores: ["dist/**", "coverage/**", "node_modules/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    rules: {
      "no-restricted-imports": "off",
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          paths: [...NODE_KERNMODULE, ...APP_PAKETE],
          patterns: VERBOTENE_MUSTER,
        },
      ],
    },
  },
  {
    files: ["*.mjs", "*.ts", "vitest.config.ts"],
    ignores: ["src/**"],
    ...tseslint.configs.disableTypeChecked,
  },
);
