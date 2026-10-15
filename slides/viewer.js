import { SOURCES } from "../assets/config.js";
import { signIn } from "../assets/signin.js";

// The deck replaces this page in place: its scripts run, and the URL stays this page's,
// with the slide hash of reveal.js and the ?receiver query of its speaker view.
function show(html) {
  document.open();
  document.write(html);
  document.close();
  decorate();
}

// The deck brings its own document, so the site's icon and a way back to the overview are added
// to it: a small button with the logo in the top left corner, as on every page of the site. The
// speaker view (?receiver) and the print layout (?print-pdf) load the deck too, and stay bare.
function decorate() {
  const icon = document.createElement("link");
  icon.rel = "icon";
  icon.type = "image/png";
  icon.href = "../assets/favicon.png";
  document.head.append(icon);

  const params = new URLSearchParams(location.search);
  if (params.has("receiver") || params.has("print-pdf")) return;
  const home = document.createElement("a");
  home.href = "../";
  home.title = "Back to the overview";
  home.setAttribute("aria-label", "Back to the overview");
  const logo = document.createElement("img");
  logo.src = "../assets/logo.png";
  logo.alt = "";
  logo.width = 42;
  logo.height = 40;
  logo.style.display = "block";
  home.append(logo);
  Object.assign(home.style, {
    position: "fixed",
    zIndex: "40",
    top: "14px",
    left: "14px",
    padding: "4px 6px",
    borderRadius: "10px",
    background: "rgba(255, 255, 255, 0.9)",
    boxShadow: "0 1px 2px rgba(31, 56, 100, 0.2), 0 4px 12px rgba(31, 56, 100, 0.15)",
    opacity: "0.7",
    transition: "opacity 0.15s ease",
  });
  for (const [event, value] of [["mouseenter", "1"], ["mouseleave", "0.7"], ["focus", "1"], ["blur", "0.7"]]) {
    home.addEventListener(event, () => {
      home.style.opacity = value;
    });
  }
  document.body.append(home);
}

signIn(SOURCES.slides, show, { busy: "Opening the presentation…" });
