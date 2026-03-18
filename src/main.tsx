import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Global handler: catch Firestore b815/ca9 internal assertion errors
// and prevent them from crashing the entire app with a blank screen.
window.addEventListener('error', (event) => {
  if (
    event.message?.includes('INTERNAL ASSERTION FAILED') &&
    (event.message?.includes('b815') || event.message?.includes('ca9'))
  ) {
    console.warn('[Firestore Recovery] Caught internal assertion error, preventing crash.');
    event.preventDefault();
    event.stopPropagation();
    return true;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const msg = event.reason?.message || String(event.reason || '');
  if (msg.includes('INTERNAL ASSERTION FAILED') && (msg.includes('b815') || msg.includes('ca9'))) {
    console.warn('[Firestore Recovery] Caught internal assertion rejection, preventing crash.');
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);