/**
 * Feld- und Auswahlbausteine: Feld-Rahmen, Auswahlliste, Vokabular-Auswahl
 * mit Freitext, Vorschlagsfeld, Zahlenfeld, Zähler, Hinweise.
 *
 * Herkunft: Erfassungsbogen `src/app/schritte/bausteine.tsx` (Commit 441811c),
 * Auswahl für @bos/oberflaeche (ADR-004): genau die Bausteine, die die
 * Schnellerfassung des Meldekopfs und die Assistenten-Schritte des
 * Erfassungsbogens gemeinsam brauchen. Im Erfassungsbogen bleiben
 * `SchrittProps`, `VokabListe` (Personal-Funktionen samt Vergaberegel),
 * `Vollstaendigkeit` und `KennzahlenFeld` — sie hängen am Assistenten oder
 * an Fachregeln.
 *
 * Geändert: `VokabAuswahl` sortiert nicht mehr selbst. Die Reihenfolge der
 * Auswahllisten ist eine Fachregel (`vokabSortiert` in
 * `@bos/meldekopf/darstellung`); die App reicht die Tabelle sortiert herein.
 * `Hinweise` nimmt statt des `Pruefpunkt` der App einen eigenen, gleich
 * gebauten Typ.
 */

import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import type { VokabularWert } from "@bos/eeb-format/model";

/**
 * Ein Eintrag einer Code-Tabelle, so weit die Auswahl ihn zeigt. Gleich gebaut
 * wie `VokabularEintrag` aus `@bos/vokabulare/thw`; die Tabellen selbst kennt
 * dieser Baustein nicht, die reicht die App herein.
 */
export interface VokabularEintrag {
  code: number;
  kurz: string;
  name: string;
}
import { zahlLesen, type ZahlRegeln } from "./zahl-eingabe";

/** Ein Hinweis mit Bezug auf einen Schritt (gleich gebaut wie `Pruefpunkt` der Apps). */
export interface Hinweispunkt {
  text: string;
  schritt: number;
  feld?: string;
}

/** Feldname des umschließenden <Feld> — Auswahllisten beschriften sich daraus. */
const FeldTitel = createContext<string | undefined>(undefined);

/**
 * Auswahlliste — überall statt eines nackten <select> zu verwenden.
 *
 * Grund: Beschriftet wird in dieser App über ein umschließendes
 * `<label className="feld">`, und bei einem <select> zählt der Text *aller*
 * <option>-Elemente zum Textinhalt des Labels. Vorlesesoftware und
 * Prüfwerkzeuge nennen dann die halbe Optionsliste als Feldnamen
 * („ArtEinsatzÜbungVeranstaltung" statt „Art"). Ein aria-label gewinnt
 * gegenüber dem Label und nennt nur den Feldnamen. Ohne <Feld> herum muss die
 * Beschriftung explizit mitgegeben werden.
 */
export function Auswahl({
  beschriftung,
  ...rest
}: ComponentProps<"select"> & { beschriftung?: string }) {
  const ausFeld = useContext(FeldTitel);
  return <select aria-label={beschriftung ?? ausFeld} {...rest} />;
}

export function VokabAuswahl(props: {
  wert: VokabularWert;
  aendern: (v: VokabularWert) => void;
  /** Die Einträge in der Reihenfolge der Liste (die App sortiert, s. Kopf). */
  tabelle: VokabularEintrag[];
  platzhalter: string;
  /** Lange Listen (Einheitstyp, Fahrzeugtyp) als tippbare Combobox statt als
      Bildlauf-Select — Freitext bleibt möglich, eine Auswahl setzt den Code. */
  suchbar?: boolean;
  /**
   * Bleibt der Text nach dem Verlassen des Felds Freitext, sagt das Feld es
   * (Einheitstyp, Audit Runde 4, R4-H1): „Bergungsgruppe" ausgeschrieben sah
   * wie eine Wahl aus, hatte aber keinen Typ-Code.
   */
  freitextHinweis?: boolean;
}) {
  const { wert, aendern, tabelle, platzhalter, suchbar, freitextHinweis } = props;
  const titel = useContext(FeldTitel);
  if (suchbar && tabelle.length > 0) {
    return (
      <VokabCombobox wert={wert} aendern={aendern} tabelle={tabelle} platzhalter={platzhalter} freitextHinweis={freitextHinweis} />
    );
  }
  if (tabelle.length === 0) {
    return (
      <input
        value={wert.freitext ?? ""}
        onChange={(e) => aendern({ freitext: e.target.value })}
        placeholder={platzhalter}
      />
    );
  }
  const istFrei = wert.code == null;
  return (
    <span style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
      <Auswahl
        value={istFrei ? "frei" : String(wert.code)}
        onChange={(e) => {
          const v = e.target.value;
          aendern(v === "frei" ? { freitext: "" } : { code: Number(v) });
        }}
      >
        <option value="frei">Freitext…</option>
        {tabelle.map((t) => (
          <option key={t.code} value={t.code}>
            {t.kurz} – {t.name}
          </option>
        ))}
      </Auswahl>
      {istFrei && (
        // Zweites Bedienelement im selben Label: ohne eigenen Namen erbte es
        // den des Labels (samt Optionstexten) und wäre von der Liste daneben
        // nicht zu unterscheiden.
        <input
          aria-label={titel && `${titel} (Freitext)`}
          value={wert.freitext ?? ""}
          onChange={(e) => aendern({ freitext: e.target.value })}
          placeholder={platzhalter}
        />
      )}
    </span>
  );
}

/**
 * Vokabular-Auswahl als tippbare Combobox (für lange Listen wie Einheitstyp
 * oder Fahrzeugtyp). Baut auf {@link VorschlagFeld} auf und bewahrt die
 * Freitext-Fähigkeit von {@link VokabAuswahl}: Tippen ist Freitext, das Wählen
 * eines Vorschlags setzt den Code (Grundlage der StAN-Vorbelegung).
 *
 * Der Anzeigetext lebt lokal (`eingabe`), wird aber bei externer Änderung des
 * Werts (Landesvorlage, Organisationswechsel) nachgezogen. Ein gewählter Code
 * erscheint als „Kürzel – Name", ein Freitext unverändert — damit „steht im
 * Feld … der Wert" exakt den freitextbasierten Vorlagenwert liest.
 */
function VokabCombobox(props: {
  wert: VokabularWert;
  aendern: (v: VokabularWert) => void;
  tabelle: VokabularEintrag[];
  platzhalter: string;
  freitextHinweis?: boolean;
}) {
  const { wert, aendern, tabelle, platzhalter, freitextHinweis } = props;
  const [imFeld, setImFeld] = useState(false);
  const sortiert = tabelle;
  const label = (t: VokabularEintrag) => `${t.kurz} – ${t.name}`;
  const ausCode = wert.code != null ? sortiert.find((t) => t.code === wert.code) : undefined;
  const anzeige = ausCode ? label(ausCode) : (wert.freitext ?? "");
  const [eingabe, setEingabe] = useState(anzeige);
  // Externe Werteänderung (Vorlage/Org-Wechsel) in die Anzeige übernehmen.
  useEffect(() => {
    setEingabe(anzeige);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wert.code, wert.freitext]);

  const suche = eingabe.trim().toLowerCase();
  // Bewusst ohne Obergrenze: die Liste ist ein Ersatz für das Native-Select und
  // muss ohne Tippen jeden Eintrag zeigen — sie scrollt (max-height in der
  // CSS). Gekappt auf acht Zeilen las sich „B (ASH) … FGr I" am Handy als
  // vollständige Auswahl, und wer seine Einheit nicht sah, hielt sie für
  // nicht vorgesehen, statt zu tippen.
  const treffer = suche
    ? sortiert.filter(
        (t) =>
          t.kurz.toLowerCase().includes(suche) ||
          t.name.toLowerCase().includes(suche) ||
          label(t).toLowerCase().includes(suche),
      )
    : sortiert;

  const freitext = wert.code == null ? (wert.freitext ?? "").trim() : "";
  return (
    <>
    {/* Nur zum Beobachten des Fokus; ohne eigene Darstellung. */}
    <span style={{ display: "contents" }} onFocusCapture={() => setImFeld(true)} onBlurCapture={() => setImFeld(false)}>
    <VorschlagFeld
      wert={eingabe}
      platzhalter={platzhalter}
      picker
      treffer={treffer}
      schluessel={(t) => String(t.code)}
      zeile={(t) => (
        <>
          {t.kurz}
          <small>{t.name}</small>
        </>
      )}
      tippen={(v) => {
        setEingabe(v);
        aendern({ freitext: v });
      }}
      waehlen={(t) => {
        setEingabe(label(t));
        aendern({ code: t.code });
      }}
      bestaetigen={(v) => {
        setEingabe(v);
        aendern({ freitext: v });
      }}
      verlassen={(v) => {
        // Direkt eingetipptes Kürzel, Label oder ausgeschriebener Name beim
        // Verlassen zum Code auflösen — ohne Groß-/Kleinschreibung und ohne
        // Leerzeichen am Rand, aber nur bei genau einem Treffer (R4-H1).
        const klein = v.trim().toLowerCase();
        const gleich = sortiert.filter((x) => x.name.toLowerCase() === klein || label(x).toLowerCase() === klein);
        const t =
          sortiert.find((x) => label(x) === v || x.kurz.toLowerCase() === klein) ?? (gleich.length === 1 ? gleich[0] : undefined);
        if (t) {
          setEingabe(label(t));
          aendern({ code: t.code });
        }
      }}
    />
    </span>
    {freitextHinweis && freitext && !imFeld && (
      <span className="hinweis warnung-text freitext-hinweis" role="status" style={{ display: "block" }}>
        „{freitext}" ist nicht aus der Liste — Vorschlag antippen oder als eigener Typ behalten. Ohne Typ-Code
        fehlen das taktische Zeichen und der Soll-Vergleich.
      </span>
    )}
    </>
  );
}

/**
 * Eingabefeld mit eigener Vorschlagsliste — für Listen, die zu lang für ein
 * <select> sind (Ortsverbände, THW-Funktionen, Berufe), aber Freitext erlauben
 * müssen. Bewusst keine native <datalist>: Safari/iOS zeigt deren Vorschläge
 * praktisch nicht.
 *
 * Das Filtern bleibt beim Aufrufer (`treffer`), weil jede Liste nach eigenen
 * Feldern sucht und eigen sortiert; hier stecken nur Tastatur-, Maus- und
 * Fokusverhalten, die überall gleich sein sollen.
 *
 * Barrierefreiheit — das Muster „Combobox mit Listen-Autovervollständigung"
 * (ARIA 1.2). Ohne diese Rollen ist die Liste für Vorlesesoftware ein
 * beliebiges <ul> irgendwo im Dokument: sie kündigt weder an, dass Vorschläge
 * aufgeklappt sind, noch welcher gerade markiert ist.
 *  - Der Fokus bleibt immer im Eingabefeld; markiert wird über
 *    `aria-activedescendant`, nicht über echten Fokus (deshalb tragen die
 *    Zeilen auch kein tabindex).
 *  - `aria-controls` steht nur bei offener Liste, sonst zeigte die Referenz auf
 *    ein Element, das gar nicht im Dokument ist.
 *  - Die Trefferzahl kommt zusätzlich über eine Statuszeile: dass sich die
 *    Anzahl beim Tippen ändert, verrät sonst nichts.
 */
/**
 * Eingabeattribute für Kennungen — Kennzeichen, Funkruf-Kennzahlen,
 * Dienststellen-Kürzel. Das sind Buchstaben-Ziffern-Folgen, keine Wörter: die
 * Autokorrektur „verbesserte" sie, die Großschreibung am Satzanfang machte
 * aus „THW" ein „Thw", und die Rechtschreibprüfung unterstrich jedes
 * Kennzeichen rot (Audit Runde 2, R2-M6). `autoComplete="off"` dazu, weil
 * das Telefon für ein unbeschriftetes Textfeld sonst Einträge aus ganz
 * anderen Formularen anbietet.
 */
export const KENNUNG_EINGABE = {
  autoCapitalize: "characters",
  autoCorrect: "off",
  spellCheck: false,
  autoComplete: "off",
} as const;

/**
 * Für Felder, die NICHT die eigenen Daten des Gerätebesitzers meinen
 * (Personen des Bogens, Dienststellenkontakte): kein Autofill aus der
 * eigenen Kontaktkarte. `autocomplete="tel"`/`"email"` am OV-Telefon bot die
 * private Handynummer an, und ein Tipp darauf setzte sie als
 * Dienststellenkontakt auf den Bogen (R2-M6). Nur „Name/Kontakt hinterlegen"
 * (Absenderkarte) meint wirklich den Gerätebesitzer und behält name/email/tel.
 */
export const FREMDE_DATEN = { autoComplete: "off" } as const;

/**
 * Die offene Vorschlagsliste soll über den festen Leisten am unteren Rand (Fußleiste des
 * Assistenten, Ansicht-Balken, Bildschirmtastatur) im Bild stehen: In der Schnellerfassung lag
 * „FGr W (B)" ganz unter der zweizeiligen Fußleiste (R7-E8). Erst rollt die Seite so weit, wie
 * es das Feld oben im Bild lässt, dann wird die Liste auf den Rest begrenzt (sie rollt in sich).
 */
function listeInsBildHalten(liste: HTMLElement, eingabe: HTMLElement | null) {
  liste.style.maxHeight = "";
  if (typeof window === "undefined") return;
  const vv = window.visualViewport;
  let grenze = vv ? vv.offsetTop + vv.height : window.innerHeight;
  for (const fest of document.querySelectorAll<HTMLElement>("footer.nav, .anzeige-balken")) {
    const r = fest.getBoundingClientRect();
    if (r.height > 0 && r.top > 0 && r.top < grenze) grenze = r.top;
  }
  const rand = 8;
  const unten = liste.getBoundingClientRect().bottom;
  if (unten <= grenze - rand) return;
  const feldOben = eingabe?.getBoundingClientRect().top ?? 0;
  // Das Feld bleibt im Bild: höchstens so weit rollen, dass seine Oberkante bei 8 px steht.
  const rollen = Math.max(0, Math.min(unten - (grenze - rand), feldOben - rand));
  if (rollen > 0) {
    try {
      window.scrollBy(0, rollen);
    } catch {
      /* Testumgebung ohne Layout */
    }
  }
  const oben = liste.getBoundingClientRect().top;
  const platz = grenze - rand - oben;
  // Mindestens eine Zeile (Grundmaß) bleibt, auch wenn der Platz knapp ist.
  if (platz > 0 && platz < liste.getBoundingClientRect().height) liste.style.maxHeight = `${Math.max(platz, 48)}px`;
}

export function VorschlagFeld<T>(props: {
  /** id des Eingabefelds (Sprungziel); die Listen-IDs bleiben eigene. */
  id?: string;
  wert: string;
  platzhalter?: string;
  beschriftung?: string;
  /** Vorschläge zur aktuellen Eingabe, schon gefiltert und sortiert. */
  treffer: T[];
  /** Stabiler React-Key je Vorschlag. */
  schluessel: (v: T) => string;
  /** Darstellung einer Zeile der Vorschlagsliste. */
  zeile: (v: T) => ReactNode;
  tippen: (wert: string) => void;
  waehlen: (v: T) => void;
  /** Enter/Klick ohne markierten Vorschlag — übernimmt die Eingabe als Freitext. */
  bestaetigen?: (wert: string) => void;
  /** Beim Verlassen des Felds, z. B. ein direkt eingetipptes Kürzel auflösen. */
  verlassen?: (wert: string) => void;
  /** true: Feld läuft in einer Zeile mit (Chips), statt eine eigene zu füllen. */
  imFluss?: boolean;
  /**
   * true: Auswahl-Combobox (Einheitstyp/Fahrzeugtyp) — trägt ein ▾ als
   * Picker-Hinweis. Öffnen auf Fokus/Tap gilt ohnehin für alle Felder; das
   * Chevron sagt nur denen, wo eine Auswahl das Ziel ist (nicht bei reinen
   * Suchfeldern wie dem OV-Namen), dass hier eine Liste wartet.
   */
  picker?: boolean;
  /** true: Kennung (Kürzel) — Großbuchstaben, ohne Autokorrektur ({@link KENNUNG_EINGABE}). */
  kennung?: boolean;
}) {
  const { id: feldId, wert, platzhalter, beschriftung, treffer, schluessel, zeile, tippen, waehlen, bestaetigen, verlassen, imFluss, picker, kennung } = props;
  const ausFeld = useContext(FeldTitel);
  const [offen, setOffen] = useState(false);
  const [aktiv, setAktiv] = useState(0);
  // Mehrere Vorschlagsfelder stehen gleichzeitig auf einer Seite (Funktion und
  // Qualifikation je Person) — die IDs müssen sich unterscheiden.
  const id = useId();
  const listeId = `${id}-liste`;
  const zeilenId = (k: number) => `${id}-zeile-${k}`;

  const sichtbar = offen ? treffer : [];
  const aufgeklappt = sichtbar.length > 0;
  const listeRef = useRef<HTMLUListElement>(null);
  const eingabeRef = useRef<HTMLInputElement>(null);
  useLayoutEffect(() => {
    const liste = listeRef.current;
    if (!aufgeklappt || !liste) return;
    listeInsBildHalten(liste, eingabeRef.current);
    // Die Bildschirmtastatur fährt erst nach dem Öffnen auf und verkleinert das Bild.
    const vv = typeof window === "undefined" ? null : window.visualViewport;
    if (!vv) return;
    const neu = () => listeInsBildHalten(liste, eingabeRef.current);
    vv.addEventListener("resize", neu);
    return () => vv.removeEventListener("resize", neu);
  }, [aufgeklappt, sichtbar.length]);
  const nehmen = (v: T) => {
    waehlen(v);
    setOffen(false);
    setAktiv(0);
  };

  return (
    <span className={["autocomplete", imFluss ? "im-fluss" : "", picker ? "picker" : ""].filter(Boolean).join(" ")}>
      <input
        id={feldId}
        ref={eingabeRef}
        // Wie bei <Auswahl>: im umschließenden <label> zählt sonst der ganze
        // Textinhalt (hier die schon gesetzten Chips) als Feldname.
        aria-label={beschriftung ?? ausFeld}
        role="combobox"
        aria-expanded={aufgeklappt}
        aria-controls={aufgeklappt ? listeId : undefined}
        aria-activedescendant={aufgeklappt ? zeilenId(aktiv) : undefined}
        // "list": Vorschläge stehen in der Liste, der getippte Text wird nicht
        // im Feld vervollständigt.
        aria-autocomplete="list"
        // Sonst legt sich die Autovervollständigung des Browsers über unsere.
        autoComplete="off"
        {...(kennung ? KENNUNG_EINGABE : {})}
        value={wert}
        placeholder={platzhalter}
        onChange={(ev) => {
          tippen(ev.target.value);
          setOffen(true);
          setAktiv(0);
        }}
        // Antippen/Fokussieren zeigt die Liste, ohne dass erst getippt werden
        // muss — ein Native-Select öffnete auf Tap, das darf die Combobox nicht
        // verlieren (Meldekopf am Tablet, Handschuhe). Zeigt nur etwas, wenn der
        // Aufrufer für die aktuelle Eingabe Treffer liefert (leeres Suchfeld: keine).
        onFocus={() => setOffen(true)}
        onClick={() => setOffen(true)}
        onKeyDown={(ev) => {
          if (ev.key === "Escape") {
            setOffen(false);
            return;
          }
          if (ev.key === "Enter") {
            ev.preventDefault();
            const v = sichtbar[aktiv];
            if (v !== undefined) nehmen(v);
            else bestaetigen?.(wert);
            return;
          }
          if (ev.key !== "ArrowDown" && ev.key !== "ArrowUp") return;
          if (!offen) {
            // Nach Escape holt Pfeil-ab die Liste zurück, ohne neu zu tippen.
            if (ev.key === "ArrowDown" && treffer.length > 0) {
              ev.preventDefault();
              setOffen(true);
              setAktiv(0);
            }
            return;
          }
          if (sichtbar.length === 0) return;
          ev.preventDefault();
          setAktiv(
            ev.key === "ArrowDown"
              ? (aktiv + 1) % sichtbar.length
              : (aktiv + sichtbar.length - 1) % sichtbar.length,
          );
        }}
        onBlur={() => {
          setOffen(false);
          verlassen?.(wert);
        }}
      />
      {aufgeklappt && (
        <ul className="vorschlaege" ref={listeRef} id={listeId} role="listbox" aria-label={`Vorschläge zu ${beschriftung ?? ausFeld ?? "der Eingabe"}`}>
          {sichtbar.map((v, k) => (
            // onMouseDown statt onClick, damit die Auswahl vor dem blur greift
            <li
              key={schluessel(v)}
              id={zeilenId(k)}
              role="option"
              // Markiert = das, was Enter nehmen würde; ohne dieses Flag nennt
              // Vorlesesoftware die Zeile nur, ohne sie als gewählt auszuweisen.
              aria-selected={k === aktiv}
              className={k === aktiv ? "aktiv" : undefined}
              onMouseDown={(ev) => {
                ev.preventDefault();
                nehmen(v);
              }}
            >
              {zeile(v)}
            </li>
          ))}
        </ul>
      )}
      <span className="nur-vorlesen" role="status">
        {aufgeklappt ? `${sichtbar.length} ${sichtbar.length === 1 ? "Vorschlag" : "Vorschläge"}` : ""}
      </span>
    </span>
  );
}

export function Feld(props: { titel: string; schmal?: boolean; klasse?: string; children: ReactNode }) {
  return (
    <label className={["feld", props.schmal ? "schmal" : "", props.klasse ?? ""].filter(Boolean).join(" ")}>
      {props.titel}
      <FeldTitel.Provider value={props.titel}>{props.children}</FeldTitel.Provider>
    </label>
  );
}

export const zahl = (s: string): number => {
  const n = parseInt(s, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

/**
 * Satz für ein Zahlenfeld, dessen Eingabe begrenzt oder gerundet wurde — leer, wenn der Wert
 * unverändert übernommen wird (Audit Runde 7, R7-E6: 999 wurde still zu 99, −5 zu 0, 1,5 zu 1;
 * Runde 9, R9-E1: Komma und Minus verschwanden still). Rechnet wie {@link zahlLesen}.
 */
export function zahlBegrenzung(eingabe: string, opt: { min?: number; max?: number; einheit?: string } = {}): string {
  return zahlLesen(eingabe, opt).meldung;
}

/**
 * Zahlenfeld mit Text statt `type="number"`: Der Wert im Feld ist, was getippt wurde, bis das Feld
 * verlassen wird; ins Modell geht die gelesene ganze Zahl. Jede Abweichung (Komma gerundet, Minus
 * abgelehnt, Obergrenze) steht als Satz neben dem Feld (R9-E1). Leer ist 0 — oder, mit `leer`,
 * „nicht angegeben" (`undefined`); das Feld zeigt dann kein stehengebliebenes „0" (R9-E1).
 * Ziffernblock und „Weiter" der Tastatur (`inputMode`, `enterKeyHint`, R9-G6).
 */
export function useZahlEingabe(
  wert: number | undefined,
  setzen: (n: number | undefined) => void,
  regeln: ZahlRegeln & { leer?: boolean } = {},
): { eingabe: ComponentProps<"input">; meldung: string } {
  const anzeige = (w: number | undefined) => (w === undefined ? "" : String(w));
  const [text, setText] = useState(anzeige(wert));
  const [meldung, setMeldung] = useState("");
  const [abgelehnt, setAbgelehnt] = useState(false);
  const zuletzt = useRef(wert);
  useEffect(() => {
    // Von außen geändert (Schaltfläche +/−, Vorbelegung aus der Stärke): Feld und Satz folgen.
    if (wert !== zuletzt.current) {
      zuletzt.current = wert;
      setText(anzeige(wert));
      setMeldung("");
      setAbgelehnt(false);
    }
  }, [wert]);
  const aufnehmen = (roh: string) => {
    if (roh.trim() === "" && regeln.leer) {
      setText(roh);
      setMeldung("");
      setAbgelehnt(false);
      zuletzt.current = undefined;
      setzen(undefined);
      return;
    }
    const r = zahlLesen(roh, regeln);
    setMeldung(r.meldung);
    setAbgelehnt(r.wert === null);
    if (r.wert === null) {
      setText(roh);
      return;
    }
    // Führende Nullen („05") und begrenzte Werte zeigt das Feld sofort so, wie sie gelten.
    setText(r.begrenzt || /^0\d/.test(roh.trim()) ? String(r.wert) : roh);
    zuletzt.current = r.wert;
    setzen(r.wert);
  };
  return {
    meldung,
    eingabe: {
      type: "text",
      inputMode: "numeric",
      enterKeyHint: "next",
      autoComplete: "off",
      value: text,
      "aria-invalid": abgelehnt || undefined,
      onChange: (e) => aufnehmen(e.target.value),
      onBlur: () => setText(anzeige(zuletzt.current)),
    },
  };
}

/** Der Satz zu {@link useZahlEingabe}, direkt unter dem Feld. */
export function ZahlMeldung(props: { meldung: string; id?: string }) {
  if (!props.meldung) return null;
  return (
    <small className="hinweis warnung-text zahl-meldung" id={props.id} role="status">
      {props.meldung}
    </small>
  );
}

/** Ganzzahlfeld (Liter, Personen, Anzahl) mit {@link useZahlEingabe} und dem Satz darunter. */
export function ZahlFeld(props: {
  wert: number;
  setzen: (n: number) => void;
  min?: number;
  max?: number;
  einheit?: string;
  "aria-label"?: string;
  id?: string;
}) {
  const { meldung, eingabe } = useZahlEingabe(props.wert, (n) => props.setzen(n ?? 0), props);
  return (
    <>
      <input {...eingabe} id={props.id} aria-label={props["aria-label"]} />
      <ZahlMeldung meldung={meldung} />
    </>
  );
}

// Die Stärke-Notation „x / x / x / x" ist BOS-Konvention, aber nicht jedem
// geläufig — Tooltip/aria erklären sie, ohne die Anzeige aufzublähen.
export const STAERKE_LEGENDE = "Führer / Unterführer / Mannschaft / Gesamt";
/** Wofür die Aufteilung nach Geschlecht gebraucht wird (Unterbringung, WC/Dusche). */
export const MWD_LEGENDE = "Aufteilung nach Geschlecht — für Unterbringung und WC/Dusche";

export function staerkeVorlesen(s: { fuehrer: number; unterfuehrer: number; mannschaft: number; gesamt: number }): string {
  return `${s.fuehrer} Führer, ${s.unterfuehrer} Unterführer, ${s.mannschaft} Mannschaft, ${s.gesamt} gesamt`;
}

/**
 * Großer, touch-freundlicher Zähler (− / Zahl / +) für die Erfassung ohne
 * Tastatur am Tablet. Werte bleiben ≥ min; direkte Zahleneingabe bleibt möglich.
 */
export function Stepper(props: { titel: string; wert: number; setzen: (n: number) => void; min?: number }) {
  const min = props.min ?? 0;
  const setze = (n: number) => props.setzen(Math.max(min, n));
  const { eingabe, meldung } = useZahlEingabe(props.wert, (n) => setze(n ?? 0), { min, einheit: "Zahlen" });
  return (
    <div className="stepper-feld">
      <span className="stepper-titel">{props.titel}</span>
      <div className="stepper">
        <button
          type="button"
          aria-label={`${props.titel}: verringern`}
          disabled={props.wert <= min}
          onClick={() => setze(props.wert - 1)}
        >
          −
        </button>
        <input {...eingabe} aria-label={props.titel} />
        <button type="button" aria-label={`${props.titel}: erhöhen`} onClick={() => setze(props.wert + 1)}>
          +
        </button>
      </div>
      <ZahlMeldung meldung={meldung} />
    </div>
  );
}

/**
 * Plausibilitätshinweise (nicht blockierend) zum AKTUELLEN Schritt.
 *
 * Von den Prüfpunkten (pruefpunkte()) erscheinen nur die, die sich auf diesem
 * Schritt beheben lassen. Vorher standen auf Schritt 1 schon drei gelbe
 * Kästen, bevor irgendetwas eingegeben war — zwei davon zu Schritt 2 und 3,
 * antippbar, und wer ihnen folgte, sprang auf Schritt 3, bevor Schritt 1
 * fertig war. Wer auf dem ersten Bildschirm lernt, dass gelbe Kästen ohnehin
 * immer da sind, überliest später auch die, die zählen (kein Name, keine
 * Rufnummer). Die Gesamtliste über alle Schritte gehört in die Übersicht und
 * den Übergabe-Dialog, wo sie als Checkliste mit Sprung steht.
 *
 * `role="status"`, damit Vorlesesoftware neu auftauchende Hinweise aktiv
 * mitbekommt.
 */
export function Hinweise(props: {
  /** Nur-Text-Hinweise, die den aktuellen Schritt selbst betreffen. */
  hinweise?: string[];
  /** Hinweise mit Schrittbezug (pruefpunkte()); gezeigt werden die zu `aktuellerSchritt`. */
  punkte?: Hinweispunkt[];
  /** Schritt-Index (0-basiert, siehe SCHRITTE in app.tsx) — ohne Angabe erscheinen alle Punkte. */
  aktuellerSchritt?: number;
}) {
  const { hinweise = [], punkte = [], aktuellerSchritt } = props;
  const hier = aktuellerSchritt == null ? punkte : punkte.filter((p) => p.schritt === aktuellerSchritt);
  if (hinweise.length === 0 && hier.length === 0) return null;
  return (
    <div role="status">
      {hinweise.map((h) => (
        <p key={h} className="warnung">⚠ {h}</p>
      ))}
      {hier.map((p) => (
        <p key={p.text} className="warnung">⚠ {p.text}</p>
      ))}
    </div>
  );
}
