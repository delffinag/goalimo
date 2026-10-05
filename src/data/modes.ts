import {
  BALL_BOUNCE, BALL_FRICTION, ICE_BOUNCE, ICE_FRICTION, ICE_KICK_DIST, ICE_SUPER_KICK_DIST, KICK_DIST, SUPER_KICK_DIST,
  WIN_GOALS, WIN_TRIES
} from "./balance";
import { FROSTBAHN, GRABENFELD, STADTWIESE } from "./maps";
import type { MapDef } from "./types";

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
  /** Karte des Modus */
  map: MapDef;
  /** Aussehen des Spielfelds und des Spielgeräts */
  field: FieldLook;
  /** Reibung des Balls: Geschwindigkeit · exp(-friction · t) */
  friction: number;
  /** Weite von Schuss und Super-Schuss in px */
  kick: number;
  superKick: number;
  /** Anteil des Tempos, der beim Abprallen an Mauer oder Rand erhalten bleibt */
  bounce: number;
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
    scoreBy: "kick", winScore: WIN_GOALS, map: STADTWIESE, field: "rasen",
    friction: BALL_FRICTION, kick: KICK_DIST, superKick: SUPER_KICK_DIST, bounce: BALL_BOUNCE,
    word: "goal", label: "Tore", goldenLabel: "Golden Goal!",
    head: ["Tor für dein Team!", "Tor für die Gegner!"],
    hint: "Lauf in den Ball, um ihn zu führen. Schießen kickt ihn aufs Tor.<small>Ein Pass zu einem Mitspieler lädt deinen Super um 25 %. Wirst du ausgeschaltet, verlierst du den Ball.</small>",
    tutorial: `Stark. Jetzt Fußball: Lauf in den Ball, um ihn zu führen. Schießen kickt ihn. Wer zuerst ${WIN_GOALS} Tore schießt, gewinnt.`
  },
  rugby: {
    key: "rugby", name: "Rugby", icon: "🏉",
    desc: `Trag den Ball selbst über die gegnerische Linie. Wer zuerst ${WIN_TRIES} Versuche legt, gewinnt.`,
    scoreBy: "carry", winScore: WIN_TRIES, map: GRABENFELD, field: "rasen",
    friction: BALL_FRICTION, kick: KICK_DIST, superKick: SUPER_KICK_DIST, bounce: BALL_BOUNCE,
    word: "try", label: "Versuche", goldenLabel: "Golden Try!",
    head: ["Versuch für dein Team!", "Versuch für die Gegner!"],
    hint: "Lauf in den Ball und trag ihn über die gegnerische Linie.<small>Geschossen zählt nicht. Ein Pass lädt deinen Super um 25 %. Wirst du ausgeschaltet, verlierst du den Ball.</small>",
    tutorial: `Stark. Jetzt Rugby: Lauf in den Ball und trag ihn über die gegnerische Linie. Ein Schuss zählt nicht. Wer zuerst ${WIN_TRIES} Versuche legt, gewinnt.`
  },
  eishockey: {
    key: "eishockey", name: "Eishockey", icon: "🏒",
    desc: `Schieß den Puck ins gegnerische Tor. Er gleitet über das ganze Feld und prallt von der Bande ab. Wer zuerst ${WIN_GOALS} Treffer macht, gewinnt.`,
    scoreBy: "kick", winScore: WIN_GOALS, map: FROSTBAHN, field: "eis",
    friction: ICE_FRICTION, kick: ICE_KICK_DIST, superKick: ICE_SUPER_KICK_DIST, bounce: ICE_BOUNCE,
    word: "goal", label: "Treffer", goldenLabel: "Golden Goal!",
    head: ["Treffer für dein Team!", "Treffer für die Gegner!"],
    hint: "Lauf in den Puck, um ihn zu führen. Schießen schickt ihn aufs Tor.<small>Der Puck gleitet über das ganze Feld und prallt von der Bande ab – auch über Bande kannst du treffen. Ein Pass lädt deinen Super um 25 %.</small>",
    tutorial: `Stark. Jetzt Eishockey: Der Puck gleitet über das ganze Feld und prallt von der Bande ab. Wer zuerst ${WIN_GOALS} Treffer macht, gewinnt.`
  }
};

/** Schussweite im jeweiligen Modus */
export const kickDist = (m: GameMode) => m.kick;
export const superKickDist = (m: GameMode) => m.superKick;

export const MODE_KEYS = Object.keys(MODES);
export const DEFAULT_MODE = "fussball";
export const modeOf = (key: string | null | undefined): GameMode => MODES[key || ""] || MODES[DEFAULT_MODE];
