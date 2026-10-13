import { ReadError, readFile } from "./github.js";
import { forgetToken, storedToken, storeToken } from "./token.js";

// The sign-in of a section that reads private material. The page holds the form
// (#signin, its fieldset, #token) and the line #status; the token is the one every section
// shares. Once GitHub returns the file of the source, show receives its text; a failure of
// show leaves the token in place, since the token was not the problem.
export function signIn(source, show, { busy }) {
  const form = document.getElementById("signin");
  const fields = form.querySelector("fieldset");
  const input = document.getElementById("token");
  const status = document.getElementById("status");

  function report(message, kind) {
    status.textContent = message;
    status.dataset.kind = kind;
  }

  async function open(token) {
    fields.disabled = true;
    report(busy, "busy");
    let text;
    try {
      text = await readFile(source, token);
    } catch (error) {
      const known = error instanceof ReadError;
      if (!known || error.forgetToken) forgetToken();
      report(known ? error.message : "The material could not be read. Try again.", "error");
      fields.disabled = false;
      input.focus();
      return;
    }
    storeToken(token);
    try {
      show(text);
    } catch (error) {
      report("The material was read but could not be shown. Reload the page to try again.", "error");
      fields.disabled = false;
      throw error;
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
}
