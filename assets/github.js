// Reads one file of a repository through the GitHub REST API, as raw text, with the
// reader's token. GitHub checks the token on every request; this code grants nothing.

const API = "https://api.github.com";

// An error the reader can act on. forgetToken is true when the token itself is the
// problem, so that it is not kept for the next visit.
export class ReadError extends Error {
  constructor(message, { forgetToken }) {
    super(message);
    this.name = "ReadError";
    this.forgetToken = forgetToken;
  }
}

export async function readFile({ owner, repo, ref, path }, token) {
  const file = path.split("/").map(encodeURIComponent).join("/");
  const url =
    `${API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}` +
    `/contents/${file}?ref=${encodeURIComponent(ref)}`;

  let response;
  try {
    response = await fetch(url, {
      headers: {
        // The raw media type returns the file itself, up to 100 MB, not base64 JSON.
        Accept: "application/vnd.github.raw+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
      credentials: "omit",
      referrerPolicy: "no-referrer",
    });
  } catch {
    throw new ReadError("GitHub could not be reached. Check your connection and try again.", {
      forgetToken: false,
    });
  }
  if (response.ok) return response.text();
  throw explain(response);
}

// GitHub answers 404, not 403, for a private repository the token cannot see, so that
// its existence is not disclosed; a missing file reads the same way.
function explain(response) {
  const limited =
    response.status === 429 ||
    (response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0");
  if (limited) {
    return new ReadError("GitHub is limiting requests from this token. Wait a few minutes and try again.", {
      forgetToken: false,
    });
  }
  switch (response.status) {
    case 401:
      return new ReadError("GitHub did not accept this token: it may be mistyped, expired, or revoked.", {
        forgetToken: true,
      });
    case 403:
      return new ReadError(
        "This token may not read repository contents. Create one with the Contents permission set to read-only.",
        { forgetToken: true },
      );
    case 404:
      return new ReadError(
        "This token cannot see the presentation: your GitHub account has no read access to it, " +
          "or the token does not include its repository.",
        { forgetToken: true },
      );
    default:
      return new ReadError(`GitHub answered with HTTP ${response.status}. Try again later.`, {
        forgetToken: false,
      });
  }
}
