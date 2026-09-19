// Balancing als Daten: Zahlen hier ändern, nicht im Code

/** Spielfeld in Welt-Pixeln. 100 px = ein Rasenstreifen */
export const W = 1800, H = 1100;

/** Fester Simulationstakt */
export const STEP = 1 / 60;

// Match
export const WIN_GOALS = 2;
export const MATCH_TIME = 150;
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

// Kampf
export const BRAWLER_RADIUS = 24;
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

// Power-Level
export const MAX_LEVEL = 5;
export const LEVEL_BONUS = 0.08;
/** Kosten für die Stufe: [Münzen, Powerpunkte] */
export const UPGRADE_COST: Record<number, [coins: number, pp: number]> = {
  2: [50, 20], 3: [100, 40], 4: [180, 70], 5: [300, 100]
};

// Belohnungen
export const BOX_ITEMS = 3;
export type LootKind = "coins" | "pp" | "gems";
/** Wahrscheinlichkeit bis zu dieser Schwelle, Menge min–max */
export const LOOT_TABLE: { k: LootKind; upTo: number; min: number; max: number }[] = [
  { k: "coins", upTo: 0.5, min: 10, max: 30 },
  { k: "pp", upTo: 0.85, min: 5, max: 15 },
  { k: "gems", upTo: 1, min: 1, max: 4 }
];
export const LOSS_GEMS = -3;
export const FIGURE_GEMS = { win: 8, draw: 2, loss: -4 } as const;

export interface CosmeticReward { id: "krone" | "gold" | "spur"; cost: number; icon: string; name: string; desc: string }
export const REWARDS: CosmeticReward[] = [
  { id: "krone", cost: 10, icon: "👑", name: "Goldene Krone", desc: "Deine Figur trägt eine Krone." },
  { id: "gold", cost: 25, icon: "🥇", name: "Goldrand", desc: "Deine Figur leuchtet golden." },
  { id: "spur", cost: 45, icon: "✨", name: "Funkenspur", desc: "Beim Laufen sprühen Funken." }
];

export const NAME_MIN = 2, NAME_MAX = 12;
