import { SOURCE } from "./config.js";
import { ReadError, readFile } from "./github.js";

// The token is kept in sessionStorage: it survives a reload of this tab and is copied
// into the speaker view that reveal.js opens from it, and it is gone when the tab closes.
const TOKEN_KEY = "presentation-viewer-token";

const form = document.getElementById("signin");
const fields = form.querySelector("fieldset");
const input = document.getElementById("token");
const status = document.getElementById("status");

function storedToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function storeToken(token) {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Without storage the token lasts only as long as the presentation stays open.
  }
}

function forgetToken() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nothing was stored.
  }
}

function report(message, kind) {
  status.textContent = message;
  status.dataset.kind = kind;
}

// The deck replaces this page in place: its scripts run, and the URL stays this page's,
// with the slide hash of reveal.js and the ?receiver query of its speaker view.
function show(html) {
  document.open();
  document.write(html);
  document.close();
}

async function open(token) {
  fields.disabled = true;
  report("Opening the presentation…", "busy");
  try {
    const html = await readFile(SOURCE, token);
    storeToken(token);
    show(html);
  } catch (error) {
    const known = error instanceof ReadError;
    if (!known || error.forgetToken) forgetToken();
    report(known ? error.message : "The presentation could not be opened. Try again.", "error");
    fields.disabled = false;
    input.focus();
  }
}

const params = new URLSearchParams(location.search);
if (params.has("signout")) {
  forgetToken();
  history.replaceState(null, "", location.pathname);
  report("Signed out: this tab no longer keeps the token.", "info");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const token = input.value.trim();
  if (!/^[A-Za-z0-9_]+$/.test(token)) {
    report("Paste the token exactly as GitHub shows it.", "error");
    return;
  }
  open(token);
});

const token = storedToken();
if (token) open(token);
