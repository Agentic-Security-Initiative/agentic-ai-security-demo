// The reader's GitHub token, shared by every section of the site. sessionStorage belongs
// to the origin and to the tab, so a token entered in one section serves the others until
// the tab closes; it is also copied into windows opened from the tab, such as the speaker
// view of reveal.js.
const KEY = "github-token";

export function storedToken() {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function storeToken(token) {
  try {
    sessionStorage.setItem(KEY, token);
  } catch {
    // Without storage the token lasts only as long as the page stays open.
  }
}

export function forgetToken() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Nothing was stored.
  }
}
