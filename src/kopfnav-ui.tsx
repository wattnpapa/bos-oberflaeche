/**
 * Die Kopfnavigation als React-Fassung — dieselbe Leiste, die auch über den
 * statischen Seiten steht (kopfnav.ts ist die Bauart, die Einträge kommen aus
 * der App).
 *
 * Herkunft: Erfassungsbogen `src/app/kopfnav-ui.tsx` (Commit 441811c).
 * Geändert für @bos/oberflaeche: Einträge und Logo-Name werden als `quelle`
 * hineingereicht.
 *
 * Warum die App sie überhaupt bekommt: Von jeder Themenseite führte ein Klick
 * in die App, umgekehrt lag der einzige Weg zur Anleitung in der Fußzeile —
 * hinter Weiche, Vorlagen, Einsätzen, Absenderkarte und dem erklärenden Text.
 * Wer in der App nicht weiterwusste, fand das HowTo praktisch nicht.
 *
 * Nur Wissen, keine Aktionen. Begründung in kopfnav.ts.
 *
 * Nur im Web-Browser: In der installierten Fassung (Desktop-App, Android, iOS)
 * ist die Themenwelt nicht das, wofür die App geöffnet wurde. Die Weiche trifft
 * die App (imWebBrowser() in ihrer nativ.ts); im Start-Gerüst der index.html
 * erledigt das die Klasse `.als-app` aus der Frühweiche im Kopf, damit die
 * Leiste dort nicht bis zum Mount aufblitzt.
 */

import { type KopfnavQuelle, kopfnavAufbau } from "./kopfnav";

export function Kopfnav({ quelle }: { quelle: KopfnavQuelle }) {
  // Leerer Dateiname: Die App gehört keiner Rubrik der Themenwelt an — kein
  // Eintrag steht auf „aktiv", das Logo führt ohnehin hierher zurück.
  const eintraege = kopfnavAufbau(quelle, "");
  return (
    // `div`, nicht `header`: Der Kopfbalken darunter ist der Seitenkopf der
    // App — zwei Banner-Landmarken übereinander kündigten ihn doppelt an
    // (NavHuelle in kopfnav.ts).
    <div className="kopfnav">
      <div className="kopfnav-inner">
        <a href="./" className="kopfnav-logo">
          {quelle.logo}
        </a>
        <nav className="kopfnav-links" aria-label="Hauptnavigation">
          {eintraege.map((e) =>
            e.unter ? (
              <span key={e.href} className={e.nurBreit ? "kopfnav-eintrag nur-breit" : "kopfnav-eintrag"}>
                <a href={e.href}>{e.label}</a>
                <span className={e.zweispaltig ? "kopfnav-unter kopfnav-unter-breit" : "kopfnav-unter"}>
                  {e.unter.map((u) => (
                    <a key={u.href} href={u.href}>
                      {u.label}
                    </a>
                  ))}
                </span>
              </span>
            ) : (
              <a key={e.href} href={e.href} className={e.nurBreit ? "nur-breit" : undefined}>
                {e.label}
              </a>
            ),
          )}
        </nav>
      </div>
    </div>
  );
}
