// The overview. Once a section has stored the reader's token, the help on creating one gives
// way to the latest release, with a button to the download page, which explains what github.com
// asks before it serves the file. Without a token, or when GitHub answers with an error, the page
// stays as it is.
import { latestPdf } from "./release.js";
import { storedToken } from "./token.js";

const token = storedToken();
if (token) offer(token).catch(() => {});

async function offer(token) {
  const pdf = await latestPdf(token);
  if (!pdf) return;
  const link = document.getElementById("release-link");
  link.textContent = `${link.textContent} (${pdf.tag})`;
  document.getElementById("release-file").textContent = pdf.name;
  document.getElementById("release-date").textContent = pdf.date ? `, released on ${pdf.date}` : "";
  document.getElementById("token").hidden = true;
  document.getElementById("release").hidden = false;
}
