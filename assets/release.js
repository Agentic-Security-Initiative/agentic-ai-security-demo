// The PDF of the latest release of the repository, read through the API with the reader's token:
// its tag, its name, its date, and the address at which github.com serves it. github.com serves
// it only to a browser signed in there with an account that can read the repository; the host of
// release assets sends no CORS header, so a page cannot download the file with the token.
import { SOURCES } from "./config.js";
import { latestRelease } from "./github.js";

export async function latestPdf(token) {
  const release = await latestRelease(SOURCES.release, token);
  const pdf = (release.assets || []).find((asset) => /\.pdf$/i.test(asset.name));
  if (!pdf || !/^(https:\/\/|\/[^/])/.test(pdf.browser_download_url)) return null;
  const published = new Date(release.published_at);
  return {
    tag: release.tag_name,
    name: pdf.name,
    url: pdf.browser_download_url,
    date: Number.isNaN(published.getTime())
      ? ""
      : published.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
  };
}
