import "@fontsource/lilita-one/latin-400.css";
import "@fontsource/nunito/latin-600.css";
import "@fontsource/nunito/latin-800.css";
import "./style.css";
import { createGame } from "./game";
import { initApp } from "./ui/app";

const game = createGame();
initApp(game);

// Offline-Start: nur im fertigen Build, damit der Cache die Entwicklung nicht stört
if (import.meta.env.PROD && "serviceWorker" in navigator)
  addEventListener("load", () => { navigator.serviceWorker.register("./sw.js").catch(() => { /* z. B. kein HTTPS */ }); });

// Für automatische Tests: mit ?debug ist die Spielwelt von außen erreichbar
if (new URLSearchParams(location.search).has("debug")) (window as unknown as { __game: typeof game }).__game = game;
