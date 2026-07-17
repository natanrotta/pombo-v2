import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { initErrorReporter } from "./shared/lib/error-reporter";
import { installStaleChunkReloadListener } from "./shared/utils/chunkReload";
import "./shared/i18n";
import { App } from "./app/App";

initErrorReporter();
// Self-heal a stale chunk graph (a new deploy in prod / a Vite re-optimize in
// dev) by reloading once when a dynamic import fails outside a lazy boundary.
installStaleChunkReloadListener();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
