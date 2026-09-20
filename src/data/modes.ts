import {
  BALL_FRICTION, ICE_FRICTION, ICE_KICK_FACTOR, KICK_DIST, SUPER_KICK_DIST, WIN_GOALS, WIN_TRIES
} from "./balance";

/**
 * Wie ein Punkt fällt:
 * - `kick`: der Ball muss ins gegnerische Tor (Fußball)
 * - `carry`: eine Figur muss den Ball selbst über die gegnerische Linie tragen (Rugby)
 */
export type ScoreBy = "kick" | "carry";

/** Wie das Spielfeld aussieht und sich anfühlt */
export type FieldLook = "rasen" | "eis";

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
  /** Aussehen des Spielfelds und des Spielgeräts */
  field: FieldLook;
  /** Reibung des Balls: Geschwindigkeit · exp(-friction · t) */
  friction: number;
  /** Streckt Schuss- und Superschussweite, z. B. auf dem Eis */
  kickFactor: number;
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
    scoreBy: "kick", winScore: WIN_GOALS, field: "rasen", friction: BALL_FRICTION, kickFactor: 1,
    word: "goal", label: "Tore", goldenLabel: "Golden Goal!",
    head: ["Tor für dein Team!", "Tor für die Gegner!"],
    hint: "Lauf in den Ball, um ihn zu führen. Schießen kickt ihn aufs Tor.<small>Ein Pass zu einem Mitspieler lädt deinen Super um 25 %. Wirst du ausgeschaltet, verlierst du den Ball.</small>",
    tutorial: `Stark. Jetzt Fußball: Lauf in den Ball, um ihn zu führen. Schießen kickt ihn. Wer zuerst ${WIN_GOALS} Tore schießt, gewinnt.`
  },
  rugby: {
    key: "rugby", name: "Rugby", icon: "🏉",
    desc: `Trag den Ball selbst über die gegnerische Linie. Wer zuerst ${WIN_TRIES} Versuche legt, gewinnt.`,
    scoreBy: "carry", winScore: WIN_TRIES, field: "rasen", friction: BALL_FRICTION, kickFactor: 1,
    word: "try", label: "Versuche", goldenLabel: "Golden Try!",
    head: ["Versuch für dein Team!", "Versuch für die Gegner!"],
    hint: "Lauf in den Ball und trag ihn über die gegnerische Linie.<small>Geschossen zählt nicht. Ein Pass lädt deinen Super um 25 %. Wirst du ausgeschaltet, verlierst du den Ball.</small>",
    tutorial: `Stark. Jetzt Rugby: Lauf in den Ball und trag ihn über die gegnerische Linie. Ein Schuss zählt nicht. Wer zuerst ${WIN_TRIES} Versuche legt, gewinnt.`
  },
  eishockey: {
    key: "eishockey", name: "Eishockey", icon: "🏒",
    desc: `Schieß den Puck ins gegnerische Tor. Auf dem Eis gleitet er weit. Wer zuerst ${WIN_GOALS} Treffer macht, gewinnt.`,
    scoreBy: "kick", winScore: WIN_GOALS, field: "eis", friction: ICE_FRICTION, kickFactor: ICE_KICK_FACTOR,
    word: "goal", label: "Treffer", goldenLabel: "Golden Goal!",
    head: ["Treffer für dein Team!", "Treffer für die Gegner!"],
    hint: "Lauf in den Puck, um ihn zu führen. Schießen schickt ihn aufs Tor.<small>Auf dem Eis gleitet er weit – auch Pässe kommen von weiter her an. Ein Pass lädt deinen Super um 25 %.</small>",
    tutorial: `Stark. Jetzt Eishockey: Der Puck gleitet auf dem Eis viel weiter als ein Ball. Wer zuerst ${WIN_GOALS} Treffer macht, gewinnt.`
  }
};

/** Schussweite im jeweiligen Modus */
export const kickDist = (m: GameMode) => KICK_DIST * m.kickFactor;
export const superKickDist = (m: GameMode) => SUPER_KICK_DIST * m.kickFactor;

export const MODE_KEYS = Object.keys(MODES);
export const DEFAULT_MODE = "fussball";
export const modeOf = (key: string | null | undefined): GameMode => MODES[key || ""] || MODES[DEFAULT_MODE];
