import { SOURCES } from "../assets/config.js";
import { signIn } from "../assets/signin.js";

// Lays out a catalog document: filters, then sections of groups of entries, then a legend. Each
// entry carries tags, and a filter shows the entries that carry its id; the filter in use is the
// address after a #, so that a link can open the catalog filtered, and an entry's own id, after
// a #, brings it into view. The document gives every text; this code knows only that structure.

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function entryNode(entry) {
  const card = element("article", "entry");
  card.id = entry.id;
  card.dataset.tags = entry.tags.join(" ");
  const head = element("header", "entry-head");
  head.append(element("span", "entry-code", entry.code), element("h4", "entry-title", entry.title));
  const chips = element("div", "entry-chips");
  for (const chip of entry.chips) chips.append(element("span", `entry-chip tone-${chip.tone}`, chip.label));
  const meta = element("dl", "entry-meta");
  for (const item of entry.meta) {
    const pair = element("div");
    pair.append(element("dt", "", item.label), element("dd", "", item.value));
    meta.append(pair);
  }
  const more = element("details");
  more.append(element("summary", "", entry.textLabel), element("p", "", entry.text));
  card.append(head, chips, meta, more);
  return card;
}

function show(text) {
  const view = JSON.parse(text).view;
  for (const key of ["title", "lead", "note"]) {
    document.querySelector(`[data-fill="${key}"]`).textContent = view[key];
  }
  const catalog = document.getElementById("catalog");
  const entries = [];
  const groups = [];

  const bar = element("div", "filters");
  bar.setAttribute("role", "toolbar");
  const buttons = new Map();
  catalog.append(bar);

  for (const section of view.sections) {
    const box = element("section", "catalog-section");
    box.append(element("h2", "", section.title));
    for (const group of section.groups) {
      const part = element("section", "catalog-group");
      part.id = group.id;
      const grid = element("div", "entries-grid");
      for (const entry of group.entries) {
        const node = entryNode(entry);
        entries.push(node);
        grid.append(node);
      }
      part.append(element("h3", "", group.title), grid);
      groups.push(part);
      box.append(part);
    }
    catalog.append(box);
  }

  if (view.legend) {
    const legend = element("section", "catalog-legend");
    const list = element("dl");
    for (const item of view.legend.entries) list.append(element("dt", "", item.term), element("dd", "", item.text));
    legend.append(element("h2", "", view.legend.title), list);
    catalog.append(legend);
  }

  function apply(id, fromHash) {
    for (const node of entries) {
      node.hidden = id !== "all" && !node.dataset.tags.split(" ").includes(id);
    }
    for (const part of groups) part.hidden = [...part.querySelectorAll(".entry")].every((node) => node.hidden);
    for (const [key, button] of buttons) button.setAttribute("aria-pressed", String(key === id));
    if (!fromHash) history.replaceState(null, "", id === "all" ? location.pathname + location.search : `#${id}`);
  }

  for (const filter of view.filters) {
    const count = filter.id === "all"
      ? entries.length
      : entries.filter((node) => node.dataset.tags.split(" ").includes(filter.id)).length;
    const button = element("button", filter.tone ? `filter tone-${filter.tone}` : "filter");
    button.type = "button";
    button.append(element("span", "", filter.label), element("span", "count", String(count)));
    button.addEventListener("click", () => apply(filter.id, false));
    buttons.set(filter.id, button);
    bar.append(button);
  }

  function route() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (buttons.has(id)) return apply(id, true);
    apply("all", true);
    const target = id && document.getElementById(id);
    if (target && target.classList.contains("entry")) {
      target.querySelector("details").open = true;
      target.scrollIntoView({ block: "center" });
      target.classList.add("spotlight");
    }
  }

  document.getElementById("gate").hidden = true;
  document.getElementById("content").hidden = false;
  window.addEventListener("hashchange", route);
  route();
}

signIn(SOURCES.controls, show, { busy: "Opening the catalog…" });
