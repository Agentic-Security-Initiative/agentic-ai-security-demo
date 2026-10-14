// The overview. Once a section has stored the reader's token, the help on creating one gives
// way to the download of the PDF of the latest release. The link leads to github.com, which
// serves the file under the name of the release asset to the account signed in there: the host
// of release assets allows no download from a page through the API. Without a token, or when
// GitHub answers with an error, the page stays as it is.
import { SOURCES } from "./config.js";
import { latestRelease } from "./github.js";
import { storedToken } from "./token.js";

const token = storedToken();
if (token) offer(token).catch(() => {});

async function offer(token) {
  const release = await latestRelease(SOURCES.release, token);
  const pdf = (release.assets || []).find((asset) => /\.pdf$/i.test(asset.name));
  if (!pdf || !/^(https:\/\/|\/[^/])/.test(pdf.browser_download_url)) return;

  const link = document.getElementById("release-link");
  link.href = pdf.browser_download_url;
  link.textContent = `Download ${release.tag_name} (PDF)`;
  document.getElementById("release-file").textContent = pdf.name;
  const published = new Date(release.published_at);
  document.getElementById("release-date").textContent = Number.isNaN(published.getTime())
    ? ""
    : `, released on ${published.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`;

  document.getElementById("token").hidden = true;
  document.getElementById("release").hidden = false;
}
