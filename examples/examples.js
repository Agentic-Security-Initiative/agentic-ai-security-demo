import { SOURCES } from "../assets/config.js";
import { cardRouter, element, groupedTiles, rich } from "../assets/cards.js";
import { chart } from "../assets/chart.js";
import { signIn } from "../assets/signin.js";

// The examples section: a bar of the share of each group, a chart of every item, and the items as
// tiles in their groups, each opening its card (assets/cards.js).

// The share of the items in each group, as one stacked bar whose segments link to their group.
function spread(view, counts) {
  const bar = element("nav", "spread");
  bar.setAttribute("aria-label", view.groups.map((g) => `${g.title}: ${counts.get(g.id)}`).join(", "));
  for (const group of view.groups) {
    const count = counts.get(group.id);
    if (!count) continue;
    const segment = element("a", `segment tone-${group.tone}`);
    segment.href = `#group-${group.id}`;
    segment.title = `${group.title}: ${count} of ${view.items.length}`;
    segment.style.setProperty("--share", String(count));
    segment.append(element("span", "segment-title", group.title), element("span", "segment-count", String(count)));
    bar.append(segment);
  }
  return bar;
}

const open = cardRouter(document.getElementById("card"));

function show(text) {
  const view = JSON.parse(text).view;
  for (const key of ["title", "lead", "note"]) {
    rich(document.querySelector(`[data-fill="${key}"]`), view[key]);
  }
  const counts = new Map(view.groups.map((g) => [g.id, view.items.filter((i) => i.group === g.id).length]));
  const groups = document.getElementById("groups");
  groups.append(spread(view, counts));
  if (view.chart) groups.append(chart(view.chart, rich));
  groupedTiles(view, groups);

  document.getElementById("gate").hidden = true;
  document.getElementById("content").hidden = false;
  open(view);
}

signIn(SOURCES.examples, show, { busy: "Opening the examples\u2026" });
