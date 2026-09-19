import "@fontsource/lilita-one/latin-400.css";
import "@fontsource/nunito/latin-600.css";
import "@fontsource/nunito/latin-800.css";
import "./style.css";
import { createGame } from "./game";

const game = createGame();
// Vorläufig: direkt ins Match. Lobby, Namen und Fortschritt kommen mit den Modulen meta und ui.
game.play({ figure: "brecher", name: "", level: 1, cosmetics: { krone: false, gold: false, spur: false } }, false);
