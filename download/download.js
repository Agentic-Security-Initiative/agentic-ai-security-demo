import { SOURCES } from "../assets/config.js";
import { latestPdf } from "../assets/release.js";
import { storedToken } from "../assets/token.js";

// The download page: it explains what github.com asks before it serves the file, then offers
// the link to the PDF of the latest release, read with the token a section has stored. Without
// a token it sends the reader to sign in first.

const { owner, repo } = SOURCES.release;
document.getElementById("invitations").href =
  `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/invitations`;

const status = document.getElementById("status");
const token = storedToken();

if (!token) {
  status.textContent = "Sign in to a section of this site with your token first, then come back to this page.";
} else {
  status.textContent = "Reading the latest release…";
  latestPdf(token)
    .then((pdf) => {
      if (!pdf) {
        status.textContent = "The latest release holds no PDF yet.";
        return;
      }
      const link = document.getElementById("continue");
      link.href = pdf.url;
      link.textContent = `${link.textContent} (${pdf.tag})`;
      if (/^https?:/.test(pdf.url)) link.rel = "noopener noreferrer";
      link.hidden = false;
      document.getElementById("file-name").textContent = pdf.name;
      document.getElementById("file-date").textContent = pdf.date ? `, released on ${pdf.date}` : "";
      document.getElementById("file").hidden = false;
      status.textContent = "";
    })
    .catch((error) => {
      status.textContent = error.message || "GitHub did not return the latest release. Try again later.";
      status.dataset.kind = "error";
    });
}
