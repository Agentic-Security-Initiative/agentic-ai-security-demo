import { SOURCES } from "../assets/config.js";
import { cardRouter, groupedTiles, rich } from "../assets/cards.js";
import { signIn } from "../assets/signin.js";

// The use cases section: the items as tiles in their groups, each opening its card
// (assets/cards.js), which follows the steps the document gives.

const open = cardRouter(document.getElementById("card"));

function show(text) {
  const view = JSON.parse(text).view;
  for (const key of ["title", "lead", "note"]) {
    rich(document.querySelector(`[data-fill="${key}"]`), view[key]);
  }
  groupedTiles(view, document.getElementById("groups"));

  document.getElementById("gate").hidden = true;
  document.getElementById("content").hidden = false;
  open(view);
}

signIn(SOURCES.usecases, show, { busy: "Opening the use cases\u2026" });
