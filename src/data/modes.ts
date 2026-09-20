import { WIN_GOALS, WIN_TRIES } from "./balance";

/**
 * Wie ein Punkt fällt:
 * - `kick`: der Ball muss ins gegnerische Tor (Fußball)
 * - `carry`: eine Figur muss den Ball selbst über die gegnerische Linie tragen (Rugby)
 */
export type ScoreBy = "kick" | "carry";

export interface GameMode {
  key: string;
  /** Name in der Lobby */
  name: string;
  /** Symbol im Spielstand */
  icon: string;
  /** Kurzbeschreibung in der Lobby */
  desc: string;
  scoreBy: ScoreBy;
  /** Punkte zum Sieg */
  winScore: number;
  /** Wort in der englischen Punktmeldung: „<Name> scored a goal“ */
  word: "goal" | "try";
  /** Überschrift im Spielstand am Ende */
  label: string;
  /** Meldung, wenn die Verlängerung beginnt */
  goldenLabel: string;
  /** Banner, wenn ein Punkt fällt */
  head: [eigen: string, gegner: string];
  /** Hinweis am Anfang eines Matches */
  hint: string;
  /** Letzter Schritt der Übungsrunde */
  tutorial: string;
}

export const MODES: Record<string, GameMode> = {
  fussball: {
    key: "fussball", name: "Fußball", icon: "⚽",
    desc: `Bring den Ball ins gegnerische Tor. Wer zuerst ${WIN_GOALS} Tore schießt, gewinnt.`,
    scoreBy: "kick", winScore: WIN_GOALS, word: "goal", label: "Tore", goldenLabel: "Golden Goal!",
    head: ["Tor für dein Team!", "Tor für die Gegner!"],
    hint: "Lauf in den Ball, um ihn zu führen. Schießen kickt ihn aufs Tor.<small>Ein Pass zu einem Mitspieler lädt deinen Super um 25 %. Wirst du ausgeschaltet, verlierst du den Ball.</small>",
    tutorial: `Stark. Jetzt Fußball: Lauf in den Ball, um ihn zu führen. Schießen kickt ihn. Wer zuerst ${WIN_GOALS} Tore schießt, gewinnt.`
  },
  rugby: {
    key: "rugby", name: "Rugby", icon: "🏉",
    desc: `Trag den Ball selbst über die gegnerische Linie. Wer zuerst ${WIN_TRIES} Versuche legt, gewinnt.`,
    scoreBy: "carry", winScore: WIN_TRIES, word: "try", label: "Versuche", goldenLabel: "Golden Try!",
    head: ["Versuch für dein Team!", "Versuch für die Gegner!"],
    hint: "Lauf in den Ball und trag ihn über die gegnerische Linie.<small>Geschossen zählt nicht. Ein Pass lädt deinen Super um 25 %. Wirst du ausgeschaltet, verlierst du den Ball.</small>",
    tutorial: `Stark. Jetzt Rugby: Lauf in den Ball und trag ihn über die gegnerische Linie. Ein Schuss zählt nicht. Wer zuerst ${WIN_TRIES} Versuche legt, gewinnt.`
  }
};

export const MODE_KEYS = Object.keys(MODES);
export const DEFAULT_MODE = "fussball";
export const modeOf = (key: string | null | undefined): GameMode => MODES[key || ""] || MODES[DEFAULT_MODE];
