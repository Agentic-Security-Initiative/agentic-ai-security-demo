// Where the presentation lives: one file in a private GitHub repository, which the
// viewer reads through the GitHub API with each reader's own token. This is the only
// file that names the repository; the rest of the viewer is generic.
//
// The file is the single-file reveal.js deck that CI in the private repository
// force-pushes to the 'deck' branch at every release.
export const SOURCE = {
  owner: "andreagalle",
  repo: "agentic-ai-security",
  ref: "deck",
  path: "index.html",
};
