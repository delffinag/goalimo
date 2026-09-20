import type {
  BulletSpec, DashSpec, FigureType, Gun, HealSpec, LobSpec, Look, ShieldSpec, ShotSpec, SpreadSpec, SuperSpec, TurboSpec
} from "./types";
import { STUFEN_BONUS, MAX_STUFE } from "./balance";

// Figuren-Daten: Balancing passiert hier, nicht im Code
// Figuren-Baukasten: Angriffe (S) und Supers (U)
const S = {
  spread: (p: number, sp: number, dmg: number, speed = 760): SpreadSpec => ({ kind: "spread", pellets: p, spread: sp, dmg, speed }),
  bullet: (dmg: number, speed = 1100): BulletSpec => ({ kind: "bullet", dmg, speed }),
  lob: (dmg: number, radius = 75, dur = 0.65): LobSpec => ({ kind: "lob", dmg, radius, dur })
};
const U = {
  spread: (p: number, sp: number, dmg: number, range: number): SpreadSpec => ({ kind: "spread", pellets: p, spread: sp, dmg, speed: 820, range }),
  pierce: (dmg: number, range = 760): BulletSpec => ({ kind: "bullet", dmg, speed: 1400, range, pierce: true, big: true }),
  big: (dmg: number, range = 600): BulletSpec => ({ kind: "bullet", dmg, speed: 1100, range, big: true }),
  lob: (dmg: number, radius = 150, range = 480): LobSpec => ({ kind: "lob", dmg, radius, dur: 0.9, range }),
  dash: (dmg: number, dist = 300): DashSpec => ({ kind: "dash", dmg, dist }),
  heal: (amount = 3000, radius = 260): HealSpec => ({ kind: "heal", amount, radius }),
  shield: (time = 3): ShieldSpec => ({ kind: "shield", time }),
  turbo: (time = 3): TurboSpec => ({ kind: "turbo", time })
};

type RosterRow = [key: string, name: string, role: string, hp: number, speed: number, range: number, reload: number,
  shot: ShotSpec, superCost: number, sup: SuperSpec, look: Look];

// Schlüssel, Name, Rolle, Leben, Tempo, Reichweite, Nachladen, Angriff, Super-Kosten, Super, Aussehen [Zubehör 0-5, Farbe]
export const ROSTER_ALL: RosterRow[] = [
  ["brecher", "Rumpel", "Nahkampf, hält viel aus", 8000, 190, 280, 1.5, S.spread(5, .5, 340), 4200, U.spread(11, 1.0, 380, 360), [0, "#5a3a22"]],
  ["schuetze", "Falka", "Große Reichweite", 5000, 200, 540, 1.25, S.bullet(1100, 1150), 3300, U.pierce(2300), [3, "#2d4a6b"]],
  ["werfer", "Kabumm", "Wirft über Mauern", 5200, 185, 430, 1.6, S.lob(1250, 75, .65), 3800, U.lob(2500, 150, 480), [2, "#ffd23f"]],
  ["flitzer", "Zisch", "Sehr schnell", 4200, 245, 360, 1.0, S.bullet(750, 1250), 3000, U.dash(1600, 300), [4, "#e84a5f"]],
  ["heilerin", "Lumi", "Hält ihr Team am Leben", 4200, 190, 440, 1.35, S.bullet(900, 1000), 3000, U.heal(3000, 260), [5, "#57d96e"]],
  ["bolzen", "Bolzen", "Schwerer Schlagschütze", 7200, 185, 260, 1.4, S.spread(3, .3, 520), 4000, U.dash(2000, 240), [1, "#8a8f99"]],
  ["glimmer", "Glimmer", "Heilt aus der Ferne", 3800, 200, 480, 1.3, S.bullet(800, 1100), 3000, U.heal(2500, 320), [2, "#b388ff"]],
  ["knall", "Knall", "Bombenleger", 4800, 190, 400, 1.5, S.lob(1350, 85, .7), 3800, U.lob(2800, 170, 460), [3, "#ff5252"]],
  ["mauli", "Mauli", "Robuster Beschützer", 8200, 180, 250, 1.5, S.spread(6, .6, 290), 3600, U.shield(4), [5, "#6d4c41"]],
  ["pixel", "Pixel", "Präzise und flink", 3600, 215, 520, 1.1, S.bullet(950, 1250), 3200, U.turbo(3), [0, "#00e5ff"]],
  ["grummel", "Grummel", "Langsam, aber zäh", 8500, 175, 270, 1.6, S.spread(5, .45, 360), 4500, U.shield(4), [1, "#4e342e"]],
  ["sprotte", "Sprotte", "Wendiger Flitzer", 4000, 250, 330, 0.9, S.bullet(650, 1300), 2800, U.dash(1400, 340), [4, "#26c6da"]],
  ["tueftel", "Tüftel", "Tüftler mit Mega-Laser", 4400, 195, 460, 1.3, S.bullet(950, 1100), 3600, U.pierce(2600, 820), [2, "#ff9800"]],
  ["kiesel", "Kiesel", "Steinwerfer", 5600, 190, 420, 1.5, S.lob(1150, 70, .6), 3600, U.lob(2400, 140, 500), [0, "#9e9e9e"]],
  ["wirbel", "Wirbel", "Sturm auf kurze Distanz", 6000, 215, 280, 1.2, S.spread(4, .4, 380), 3600, U.dash(1800, 280), [4, "#7e57c2"]],
  ["broesel", "Brösel", "Streut Krümel-Schrot", 6400, 195, 300, 1.35, S.spread(7, .7, 250), 4000, U.spread(14, 1.2, 300, 340), [5, "#d7a86e"]],
  ["funko", "Funko", "Funkenschütze", 4600, 205, 420, 1.15, S.bullet(880, 1150), 3200, U.big(2400, 620), [2, "#ff7043"]],
  ["zacke", "Zacke", "Scharfschützin", 3200, 200, 560, 1.4, S.bullet(1300, 1300), 3600, U.pierce(2800, 900), [3, "#37474f"]],
  ["blubb", "Blubb", "Blasenwerfer", 5000, 190, 440, 1.55, S.lob(1200, 90, .75), 3400, U.heal(2200, 240), [5, "#4fc3f7"]],
  ["rasselbart", "Rasselbart", "Alter Haudegen", 7600, 185, 290, 1.45, S.spread(5, .55, 330), 4000, U.spread(12, 1.1, 360, 380), [0, "#795548"]],
  ["nebelfee", "Nebelfee", "Heimliche Heilerin", 3800, 210, 440, 1.3, S.bullet(820, 1050), 2900, U.heal(2800, 280), [5, "#ce93d8"]],
  ["donnerbolz", "Donnerbolz", "Wuchtiger Sprinter", 7000, 195, 260, 1.4, S.spread(3, .35, 480), 3800, U.dash(2200, 280), [1, "#ffd54f"]],
  ["floeckchen", "Flöckchen", "Leicht und schnell", 3400, 240, 380, 0.95, S.bullet(700, 1250), 2700, U.turbo(3.5), [2, "#e1f5fe"]],
  ["kralle", "Kralle", "Nahkampf-Jägerin", 6200, 220, 240, 1.2, S.spread(3, .5, 440), 3400, U.dash(1900, 300), [1, "#a1887f"]],
  ["pfeffer", "Pfeffer", "Scharfe Streuschüsse", 5800, 200, 320, 1.3, S.spread(5, .4, 330), 3600, U.turbo(3), [4, "#d32f2f"]],
  ["sumsi", "Sumsi", "Summt um Gegner herum", 3800, 245, 350, 0.95, S.bullet(700, 1200), 2800, U.dash(1300, 360), [2, "#fbc02d"]],
  ["klotz", "Klotz", "Wandelnde Mauer", 9000, 170, 240, 1.6, S.spread(4, .5, 380), 4800, U.shield(5), [0, "#607d8b"]],
  ["quirl", "Quirl", "Wirbelnder Werfer", 4600, 210, 400, 1.4, S.lob(1100, 80, .6), 3500, U.turbo(3), [4, "#ab47bc"]],
  ["schnuff", "Schnuff", "Treuer Helfer", 5200, 200, 380, 1.25, S.bullet(850, 1100), 3200, U.heal(2600, 260), [5, "#bcaaa4"]],
  ["tatze", "Tatze", "Kräftige Pranke", 7400, 195, 260, 1.4, S.spread(4, .45, 420), 4000, U.dash(2000, 260), [5, "#8d6e63"]],
  ["russ", "Ruß", "Rauchbomben-Werfer", 5000, 195, 430, 1.5, S.lob(1300, 80, .7), 3700, U.shield(3), [3, "#424242"]],
  ["gloeckchen", "Glöckchen", "Klingende Heilerin", 4000, 200, 420, 1.3, S.bullet(860, 1050), 3000, U.heal(3200, 240), [2, "#ffe082"]],
  ["stachel", "Stachel", "Stachelschütze", 4400, 205, 460, 1.2, S.spread(2, .12, 700, 1000), 3400, U.pierce(2400), [4, "#558b2f"]],
  ["muckel", "Muckel", "Kleiner Kraftprotz", 6800, 205, 270, 1.35, S.spread(4, .5, 380), 3600, U.turbo(3), [5, "#ff8a65"]],
  ["pogo", "Pogo", "Springt durchs Feld", 4200, 235, 360, 1.05, S.bullet(760, 1200), 3000, U.dash(1500, 380), [2, "#f06292"]],
  ["zunder", "Zunder", "Heiße Bomben", 4600, 195, 440, 1.5, S.lob(1400, 70, .65), 3900, U.lob(3000, 160, 460), [4, "#ff5722"]],
  ["nuss", "Nuss", "Harte Schale", 7800, 185, 280, 1.5, S.spread(5, .5, 320), 4200, U.shield(4), [0, "#a1887f"]],
  ["wusel", "Wusel", "Hektischer Dauerschütze", 4000, 230, 340, 0.8, S.bullet(600, 1200), 2600, U.turbo(3), [4, "#ffca28"]],
  ["schleuder", "Schleuder", "Weitwerfer", 4400, 195, 480, 1.6, S.lob(1150, 70, .8), 3700, U.lob(2600, 140, 560), [3, "#8bc34a"]],
  ["kometa", "Kometa", "Blitzschnelle Schützin", 3600, 230, 500, 1.2, S.bullet(1000, 1300), 3400, U.big(2600, 700), [2, "#80deea"]],
  ["hagel", "Hagel", "Streut Eiskörner", 5400, 195, 340, 1.3, S.spread(8, .8, 220), 3800, U.spread(16, 1.4, 260, 360), [1, "#b3e5fc"]],
  ["borke", "Borke", "Knorriger Verteidiger", 8400, 175, 300, 1.55, S.spread(5, .5, 340), 4300, U.heal(2000, 220), [1, "#6d4c41"]],
  ["flunder", "Flunder", "Glitschiger Ausweicher", 4800, 225, 380, 1.15, S.bullet(820, 1150), 3000, U.turbo(4), [5, "#4db6ac"]],
  ["zottel", "Zottel", "Wuscheliger Brecher", 7600, 190, 270, 1.45, S.spread(6, .6, 300), 4000, U.dash(1700, 260), [4, "#a1887f"]],
  ["blitzi", "Blitzi", "Schnellster Schütze", 3400, 250, 400, 0.85, S.bullet(640, 1350), 2700, U.dash(1500, 320), [2, "#fff176"]],
  ["kruemel", "Krümel", "Klein, aber gemein", 3600, 235, 320, 1.0, S.spread(3, .35, 300), 2800, U.turbo(3), [5, "#d7ccc8"]],
  ["rabauke", "Rabauke", "Wilder Raufbold", 7000, 205, 260, 1.3, S.spread(4, .5, 400), 3800, U.dash(2100, 300), [1, "#e53935"]],
  ["topas", "Topas", "Edelstein-Scharfschütze", 3800, 200, 540, 1.35, S.bullet(1200, 1250), 3500, U.pierce(2600, 860), [3, "#ffb300"]],
  ["wolke", "Wolke", "Schwebende Heilerin", 4600, 195, 460, 1.35, S.lob(900, 100, .7), 3200, U.heal(3000, 300), [2, "#eceff1"]],
  ["orkan", "Orkan", "Sturm mit Riesenschrot", 7200, 200, 300, 1.4, S.spread(6, .7, 320), 4200, U.spread(13, 1.3, 380, 400), [4, "#5c6bc0"]]
];

function gunOf(T: Pick<FigureType, "shot" | "sup" | "range" | "reload">): Gun {
  if (T.sup.kind === "heal") return "orb";
  if (T.shot.kind === "spread") return "shotgun";
  if (T.shot.kind === "lob") return "bomb";
  if (T.range >= 480) return "rifle";
  if (T.reload <= 1.05) return "twin";
  return "pistol";
}
const CLASS_NAME: Record<Gun, string> = {
  shotgun: "Nahkämpfer", rifle: "Scharfschütze", bomb: "Werfer", twin: "Flitzer", orb: "Heiler", pistol: "Allrounder"
};

export function descShot(s: ShotSpec): string {
  if (s.kind === "spread") return s.pellets <= 3 ? `Wuchtiger Schrot (${s.pellets} Kugeln)` : `Streuschuss (${s.pellets} Kugeln)`;
  if (s.kind === "lob") return s.radius >= 90 ? "Große Bombe über Mauern" : "Bombe über Mauern";
  return s.dmg >= 1100 ? "Starker Fernschuss" : s.speed >= 1250 ? "Schneller Schuss" : "Energiekugel";
}
export function descSup(u: SuperSpec): string {
  switch (u.kind) {
    case "spread": return "Riesige Schrotladung";
    case "bullet": return u.pierce ? "Laser durch alle Gegner" : "Riesenkugel mit viel Schaden";
    case "lob": return "Mega-Bombe";
    case "dash": return "Sprint durch Gegner mit Schaden";
    case "heal": return "Heilt sich und das Team in der Nähe";
    case "shield": return `Schild: ${u.time} s nur halber Schaden`;
    case "turbo": return `Turbo: ${u.time} s viel schneller`;
  }
}

// Aktuelle Aufstellung: 3 Figuren, jede mit eigener Farbe und Stärke (weitere liegen in ROSTER_ALL bereit)
const LINEUP: [key: string, color: string, strength: string][] = [
  ["brecher", "#e53935", "Hält am meisten aus"],
  ["flitzer", "#fdd835", "Am schnellsten"],
  ["schuetze", "#1e88e5", "Größte Reichweite"]
];

export const FIGURES: Record<string, FigureType> = {};
for (const [k, color, strength] of LINEUP) {
  const row = ROSTER_ALL.find(r => r[0] === k);
  if (!row) throw new Error(`Figur ${k} fehlt in ROSTER_ALL`);
  const [key, name, role, hp, speed, range, reload, shot, superCost, sup, look] = row;
  const gun = gunOf({ shot, sup, range, reload });
  FIGURES[key] = { key, name, className: CLASS_NAME[gun], role, strength, hp, speed, range, reload, ammo: 3, shot, superCost, sup,
    look: [look[0], color], gun };
}
export const FIGURE_KEYS = LINEUP.map(l => l[0]);
export const DEFAULT_FIGURE = FIGURE_KEYS[0];

export const clampStufe = (lv: number | undefined) => Math.min(MAX_STUFE, Math.max(1, lv || 1));

/** Jede Stufe über 1 gibt +8 % Leben, Schaden und Heilung */
export function scaledType(key: string, stufe: number): FigureType {
  const T = FIGURES[key], m = 1 + STUFEN_BONUS * (clampStufe(stufe) - 1);
  if (m === 1) return T;
  const sc = <X extends SuperSpec>(o: X): X => {
    const c = { ...o };
    if ("dmg" in c) c.dmg = Math.round(c.dmg * m);
    if ("amount" in c) c.amount = Math.round(c.amount * m);
    return c;
  };
  return { ...T, hp: Math.round(T.hp * m), shot: sc(T.shot), sup: sc(T.sup) };
}
