export interface SpreadSpec { kind: "spread"; pellets: number; spread: number; dmg: number; speed: number; range?: number }
export interface BulletSpec { kind: "bullet"; dmg: number; speed: number; range?: number; pierce?: boolean; big?: boolean }
export interface LobSpec { kind: "lob"; dmg: number; radius: number; dur: number; range?: number }
export interface DashSpec { kind: "dash"; dmg: number; dist: number }
export interface HealSpec { kind: "heal"; amount: number; radius: number }
export interface ShieldSpec { kind: "shield"; time: number }
export interface TurboSpec { kind: "turbo"; time: number }

export type ShotSpec = SpreadSpec | BulletSpec | LobSpec;
export type SuperSpec = ShotSpec | DashSpec | HealSpec | ShieldSpec | TurboSpec;

export type Gun = "shotgun" | "rifle" | "bomb" | "twin" | "orb" | "pistol";

/** Aussehen: [Zubehör 0–5, Farbe] */
export type Look = [accessory: number, color: string];

export interface FigureType {
  key: string;
  /** Name der Figur, z. B. „Rumpel“ */
  name: string;
  /** Klasse, z. B. „Nahkämpfer“ */
  className: string;
  role: string;
  strength: string;
  hp: number;
  speed: number;
  range: number;
  reload: number;
  ammo: number;
  shot: ShotSpec;
  superCost: number;
  sup: SuperSpec;
  look: Look;
  gun: Gun;
}

export interface Rect { x: number; y: number; w: number; h: number }
export interface Point { x: number; y: number }

export type RectTuple = [x: number, y: number, w: number, h: number];

/** Karte: nur die linke Hälfte definieren, rechts wird gespiegelt */
export interface MapDef {
  walls: RectTuple[];
  bushes: RectTuple[];
  spawns: [x: number, y: number][];
}
