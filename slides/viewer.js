import { SOURCES } from "../assets/config.js";
import { signIn } from "../assets/signin.js";

// The deck replaces this page in place: its scripts run, and the URL stays this page's,
// with the slide hash of reveal.js and the ?receiver query of its speaker view.
function show(html) {
  document.open();
  document.write(html);
  document.close();
}

signIn(SOURCES.slides, show, { busy: "Opening the presentation…" });
