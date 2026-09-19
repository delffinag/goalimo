// Teamfarben: Team 0 (eigenes Team) = Feuer, Team 1 (Gegner) = Eis
export const FIRE = "#ff7a2f", FIRE_D = "#a8420c", ICE = "#3fb8f0", ICE_D = "#16648c";
export const teamColor = (team: number) => (team ? ICE : FIRE);
