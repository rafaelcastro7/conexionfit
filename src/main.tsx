import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Desregistrar cualquier Service Worker previo (cacheaba HTML roto tras deploys).
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => reg.unregister().catch(() => {}));
  }).catch(() => {});
}

createRoot(document.getElementById("root")!).render(<App />);
