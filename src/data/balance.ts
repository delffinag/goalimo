// Balancing als Daten: Zahlen hier ändern, nicht im Code

/** Spielfeld in Welt-Pixeln. 100 px = ein Rasenstreifen */
export const W = 1800, H = 1100;

/** Fester Simulationstakt */
export const STEP = 1 / 60;

// Match
/** Fußball: Tore zum Sieg. Rugby: Versuche zum Sieg. */
export const WIN_GOALS = 3;
export const WIN_TRIES = 3;
export const MATCH_TIME = 180;
/** Bei Gleichstand nach Ablauf: Golden Goal. Fällt in dieser Zeit kein Tor, endet das Spiel unentschieden. */
export const GOLDEN_TIME = 60;
export const RESPAWN_TIME = 5;
export const COUNTDOWN_START = 3;
export const COUNTDOWN_AFTER_GOAL = 3.4;

// Ball
export const BALL_RADIUS = 16;
/** Reibung: Geschwindigkeit · exp(-BALL_FRICTION · t) */
export const BALL_FRICTION = 3;
export const KICK_DIST = 300;
export const SUPER_KICK_DIST = 500;
export const CARRY_SPEED = 0.75;
export const PICKUP_COOLDOWN = 0.6;
/** Ein gelungener Pass lädt den Super des Passgebers um diesen Anteil */
export const PASS_SUPER_BONUS = 0.25;

// Kampf
export const KICKER_RADIUS = 24;
export const SUPER_CHARGE_TIME = 18;
/** Geschosse fliegen langsamer als ihre Basisgeschwindigkeit, damit Ausweichen möglich ist */
export const PROJ_SPEED = 0.68;
export const LOB_TIME = 1.35;
export const ATTACK_COOLDOWN = 0.3;
export const TURBO_FACTOR = 1.6;
export const SHIELD_FACTOR = 0.5;
export const BUSH_REVEAL_DIST = 130;

// Bots: Zielfehler in Radiant (Gegner zielen bewusst ungenauer als Mitspieler)
export const AIM_NOISE_ALLY = 0.09;
export const AIM_NOISE_FOE = 0.2;
export const FOE_EXTRA_SHOOT_DELAY = 0.3;

// Trainingsstufe (1–5, als Sterne)
export const MAX_STUFE = 5;
export const STUFEN_BONUS = 0.08;
/** Kosten für die Stufe: [Taler, Trainingspunkte] */
export const TRAINING_COST: Record<number, [taler: number, training: number]> = {
  2: [50, 20], 3: [100, 40], 4: [180, 70], 5: [300, 100]
};

// Siegprämie: drei offene Angebote, der Spieler wählt genau eines. Keine Zufallsziehung, kein Kauf mit echtem Geld.
export type PraemieKind = "taler" | "training" | "kristalle";
export interface PraemieAngebot { k: PraemieKind; min: number; max: number }
export const PRAEMIE_ANGEBOTE: PraemieAngebot[] = [
  { k: "taler", min: 40, max: 60 },
  { k: "training", min: 15, max: 25 },
  { k: "kristalle", min: 2, max: 4 }
];

/** Niederlage kostet Kristalle, nie unter 0 */
export const LOSS_KRISTALLE = -3;
/** Erfahrung (EP) pro Figur. Steigt nur. */
export const ERFAHRUNG = { win: 10, draw: 5, loss: 2 } as const;

/**
 * Medaille: eine bleibende Auszeichnung, eine pro Sieg. Sie wird nur erspielt, nie gekauft,
 * und kann nie wieder verloren gehen. Medaillen bringen den Spieler den Belohnungsweg entlang.
 */
export const MEDAL_NAME = "Medaille";

/**
 * Belohnungsweg: feste Stationen, die bei einer bestimmten Zahl Medaillen erreicht sind.
 * Die Belohnungen sind offen sichtbar und werden automatisch gutgeschrieben – keine Zufallsziehung,
 * kein Kauf mit echtem Geld. Der Weg ist endlich; ist die letzte Station erreicht, ist er abgeschlossen.
 */
export interface PathStation { medals: number; k: PraemieKind; n: number }
export const REWARD_PATH: PathStation[] = [
  { medals: 1, k: "taler", n: 50 },
  { medals: 2, k: "training", n: 20 },
  { medals: 4, k: "kristalle", n: 3 },
  { medals: 6, k: "taler", n: 100 },
  { medals: 9, k: "training", n: 40 },
  { medals: 12, k: "kristalle", n: 5 },
  { medals: 16, k: "taler", n: 180 },
  { medals: 20, k: "training", n: 70 },
  { medals: 25, k: "kristalle", n: 8 },
  { medals: 30, k: "taler", n: 300 },
  { medals: 36, k: "training", n: 100 },
  { medals: 45, k: "kristalle", n: 12 }
];

export interface CosmeticReward { id: "krone" | "gold" | "spur"; cost: number; icon: string; name: string; desc: string }
export const REWARDS: CosmeticReward[] = [
  { id: "krone", cost: 10, icon: "👑", name: "Goldene Krone", desc: "Deine Figur trägt eine Krone." },
  { id: "gold", cost: 25, icon: "🥇", name: "Goldrand", desc: "Deine Figur leuchtet golden." },
  { id: "spur", cost: 45, icon: "✨", name: "Funkenspur", desc: "Beim Laufen sprühen Funken." }
];

export const NAME_MIN = 2, NAME_MAX = 12;
