// What the site reads from the private repository, through the GitHub API with each
// reader's own token. This is the only file that names the repository; the rest of the
// site is generic. A section that reads private material adds its source here.
const REPOSITORY = { owner: "andreagalle", repo: "agentic-ai-security" };

export const SOURCES = {
  // The single-file reveal.js deck that CI in the private repository force-pushes to
  // the 'deck' branch at every release.
  slides: { ...REPOSITORY, ref: "deck", path: "index.html" },
  // The document of the examples section, which the same release publishes beside the deck.
  examples: { ...REPOSITORY, ref: "deck", path: "examples.json" },
  // The document of the controls section, which the same release publishes beside the deck.
  controls: { ...REPOSITORY, ref: "deck", path: "controls.json" },
  // The document of the use cases section, which the same release publishes beside the deck.
  usecases: { ...REPOSITORY, ref: "deck", path: "usecases.json" },
  // The repository whose latest release the overview offers for download, once a section has
  // stored the reader's token.
  release: { ...REPOSITORY },
};
