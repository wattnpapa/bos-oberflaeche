/**
 * Fehlerfänger um die ganze App (Audit Runde 5, R5-E1).
 *
 * Herkunft: Erfassungsbogen `src/app/fehlerfaenger.tsx` (Commit 441811c).
 * Geändert für @bos/oberflaeche: Sichern, Löschen, Herunterladen und das
 * Vergessen der zuletzt offenen Ansicht sind Sache der App (ihre Schlüssel,
 * ihre Datensicherung) und kommen als Eigenschaften herein; ebenso der Satz,
 * was „alle Daten" in dieser App sind.
 *
 * Bisher gab es keinen: Warf irgendein Aufbau der Ansicht einen Fehler (ein
 * Bogen ohne Einheitstyp in einer eingespielten Sammlung, ein unerwarteter
 * Zustand), blieb ein leerer, hellgrauer Bildschirm ohne Text und ohne Knopf —
 * auch nach dem Neuladen, wenn die Ursache im Speicher lag. Der einzige Ausweg
 * war, die Website-Daten des Browsers zu löschen, und damit gingen alle
 * Sammlungen, Vorlagen und der Entwurf ohne Sicherung verloren.
 *
 * Diese Seite hängt an nichts, was gerade abgestürzt sein könnte: Sie zeigt in
 * Alltagssprache, dass die Daten noch da sind, und bietet die Wege an, die
 * ohne die App-Ansicht gehen — neu laden, zur Startseite, alle Daten als Datei
 * sichern und als letztes, mit Rückfrage, alles löschen.
 */

import { Component, type ErrorInfo, type ReactNode } from "react";

/** Was die App dem Fangnetz mitgibt. Nichts davon darf an der Ansicht hängen. */
export interface FehlerfaengerWege {
  /** Alle Daten dieses Geräts als Sicherungstext (JSON). */
  sicherungErstellen: () => string;
  /** Alle Daten der App von diesem Gerät entfernen. */
  alleDatenLoeschen: () => void;
  /** Datei zum Speichern anbieten. */
  herunterladen: (dateiname: string, inhalt: Blob) => void;
  /**
   * Merker vergessen, die die App beim Start wieder in dieselbe Ansicht führen
   * — bei einem Absturz der Ansicht würden sie ihn wiederholen.
   */
  ansichtVergessen?: () => void;
  /** Was „alle Daten" hier umfasst, als Aufzählung im Satz. */
  datenUmfang?: string;
  /** Anfang des Dateinamens der Sicherung (`<praefix>-2026-10-25.json`). */
  sicherungPraefix?: string;
}

interface Zustand {
  fehler: Error | null;
  gesichert: boolean | null;
  loeschenOffen: boolean;
  loeschenVerstanden: boolean;
  meldung: string;
}

/** Verständlicher Satz zu dem, was schiefging — nie Programmtext allein. */
export function fehlerSatz(fehler: Error): string {
  const text = fehler.message || String(fehler);
  return text.length > 300 ? `${text.slice(0, 300)} …` : text;
}

/**
 * Die App startet nach „Neu laden" und „Zur Startseite" auf der Startseite
 * (`ansichtVergessen` der App); Daten bleiben. Wirft das Vergessen selbst
 * (gesperrter Speicher), geht es trotzdem weiter.
 */
function sicherVergessen(wege: FehlerfaengerWege): void {
  try {
    wege.ansichtVergessen?.();
  } catch {
    /* gesperrt — dann eben nicht */
  }
}

export class Fehlerfaenger extends Component<{ children: ReactNode; wege: FehlerfaengerWege }, Zustand> {
  state: Zustand = { fehler: null, gesichert: null, loeschenOffen: false, loeschenVerstanden: false, meldung: "" };

  static getDerivedStateFromError(fehler: unknown): Partial<Zustand> {
    return { fehler: fehler instanceof Error ? fehler : new Error(String(fehler)) };
  }

  componentDidCatch(fehler: Error, info: ErrorInfo): void {
    // Für den Support in der Konsole; nichts davon verlässt das Gerät.
    console.error("Ansicht abgestürzt:", fehler, info.componentStack);
  }

  private sichern = () => {
    try {
      const inhalt = this.props.wege.sicherungErstellen();
      this.props.wege.herunterladen(`${this.props.wege.sicherungPraefix ?? "eeb-sicherung"}-${new Date().toISOString().slice(0, 10)}.json`, new Blob([inhalt], { type: "application/json" }));
      this.setState({ gesichert: true, meldung: "Sicherung erstellt. Sie enthält alle Daten dieses Geräts." });
    } catch {
      this.setState({
        gesichert: false,
        meldung: "Die Sicherung ließ sich nicht erstellen (Speicher gesperrt?). Die Daten sind unverändert.",
      });
    }
  };

  private loeschen = () => {
    try {
      this.props.wege.alleDatenLoeschen();
      window.location.assign(window.location.pathname);
    } catch {
      this.setState({ meldung: "Löschen ging nicht (Speicher gesperrt?). Die Daten sind unverändert." });
    }
  };

  render(): ReactNode {
    const { fehler, gesichert, loeschenOffen, loeschenVerstanden, meldung } = this.state;
    if (!fehler) return this.props.children;
    return (
      <main className="fehlerseite" role="alert">
        <h1>Hier ist etwas schiefgelaufen</h1>
        <p>
          Die Ansicht ließ sich nicht aufbauen. <strong>Deine Daten liegen weiter auf diesem Gerät</strong> — durch den
          Fehler wurde nichts gelöscht.
        </p>
        <p>Zuerst neu laden; hilft das nicht, zur Startseite. Wer sicher gehen will, sichert vorher alles in eine Datei.</p>
        <p>
          Stürzt die Ansicht beim Öffnen eines Einsatzes ab, bleibt der Rest nutzbar: Auf der Startseite lässt sich dieser
          Einsatz einzeln löschen (<strong>Löschen…</strong>; danach liegt er 30 Tage im Papierkorb). „Daten sichern“ vorher
          nicht vergessen.
        </p>
        <div className="aktionen">
          <button type="button" className="primaer" onClick={() => { sicherVergessen(this.props.wege); window.location.reload(); }}>Neu laden</button>
          <button type="button" onClick={() => { sicherVergessen(this.props.wege); window.location.assign(window.location.pathname); }}>Zur Startseite</button>
          <button type="button" onClick={this.sichern}>Daten sichern</button>
        </div>
        {meldung && (
          <p className={gesichert === false ? "fehler" : "meldung"} role="status">
            {meldung}
          </p>
        )}
        <details className="fehler-aufklapper">
          <summary>▸ Technische Angabe (für die Fehlersuche)</summary>
          <p className="hinweis">{fehlerSatz(fehler)}</p>
        </details>
        <details className="fehler-aufklapper" open={loeschenOffen} onToggle={(e) => this.setState({ loeschenOffen: (e.currentTarget).open })}>
          <summary>▸ Hilft nichts? Alle Daten löschen</summary>
          <p>
            Das entfernt <strong>alle</strong> Daten dieser App von diesem Gerät: {this.props.wege.datenUmfang ?? "Sammlungen, Vorlagen, den angefangenen Bogen und den Papierkorb"}. Eine Kopie gibt es nicht — vorher „Daten sichern“.
          </p>
          <label className="inline">
            <input
              type="checkbox"
              checked={loeschenVerstanden}
              onChange={(e) => this.setState({ loeschenVerstanden: e.target.checked })}
            />
            Ja, alle Daten dieser App von diesem Gerät löschen
          </label>
          <div className="aktionen">
            <button type="button" className="gefahr" disabled={!loeschenVerstanden} onClick={this.loeschen}>
              Endgültig löschen
            </button>
          </div>
        </details>
      </main>
    );
  }
}
