import "@fontsource/lilita-one/latin-400.css";
import "@fontsource/nunito/latin-600.css";
import "@fontsource/nunito/latin-800.css";
import "./style.css";
import { createGame } from "./game";
import { initApp } from "./ui/app";

const game = createGame();
initApp(game);

// Für automatische Tests: mit ?debug ist die Spielwelt von außen erreichbar
if (new URLSearchParams(location.search).has("debug")) (window as unknown as { __game: typeof game }).__game = game;
