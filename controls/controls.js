import { SOURCES } from "../assets/config.js";
import { signIn } from "../assets/signin.js";

// Lays out a catalog document: a summary, groups of filters and a search, then sections of groups
// of entries, then a key. Each entry carries tags; each group of filters keeps one choice, and an
// entry shows when it carries the tag of every choice and matches the search. The choices are the
// address after a #, joined by +, so that a link can open the catalog filtered; an entry's own id
// after a # brings it into view. The document gives every text; this code knows only that
// structure.

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function summaryNode(summary) {
  const box = element("section", "catalog-summary");
  const grid = element("div", "summary-grid");
  for (const item of summary.items) {
    const card = element("article", "summary-item");
    card.append(element("span", "entry-code", item.code), element("h3", "", item.title), element("p", "", item.text));
    grid.append(card);
  }
  box.append(element("h2", "", summary.title), grid);
  return box;
}

// A link that leaves the site opens apart, and tells the other site nothing of this one.
function link(label, href) {
  const node = element("a", "", label);
  node.href = href;
  if (/^https?:/.test(href)) {
    node.target = "_blank";
    node.rel = "noopener noreferrer";
  }
  return node;
}

// The sources: one line of their first links near the top, and the whole list with its links.
function sourcesLine(sources) {
  const line = element("p", "sources-line");
  line.append(element("span", "filter-label", sources.title));
  sources.items.forEach((item, i) => {
    if (i) line.append(" \u00b7 ");
    line.append(link(item.title, item.links[0].href));
  });
  return line;
}

function sourcesNode(sources) {
  const box = element("section", "catalog-sources");
  box.id = "sources";
  const list = element("ul");
  for (const item of sources.items) {
    const row = element("li");
    row.append(element("strong", "", item.title), " ", item.text, " ");
    item.links.forEach((each, i) => {
      if (i) row.append(" \u00b7 ");
      row.append(link(each.label, each.href));
    });
    list.append(row);
  }
  box.append(element("h2", "", sources.title), list);
  return box;
}

function metaNode(item) {
  const pair = element("div");
  const value = element("dd");
  if (item.links) {
    for (const id of item.links) {
      const link = element("a", "", id);
      link.href = `#${encodeURIComponent(id)}`;
      value.append(link, " ");
    }
  } else {
    value.textContent = item.value;
  }
  pair.append(element("dt", "", item.label), value);
  return pair;
}

// A text is written into its details only when they first open, so that a catalog of a thousand
// entries stays light.
function textNode(item) {
  const more = element("details");
  more.append(element("summary", "", item.label));
  const fill = () => {
    if (!more.dataset.filled) more.append(element("div", "entry-text", item.text));
    more.dataset.filled = "true";
  };
  more.addEventListener("toggle", fill);
  if (item.open) {
    fill();
    more.open = true;
  }
  return more;
}

function entryNode(entry) {
  const card = element("article", entry.sub ? "entry sub" : "entry");
  card.id = entry.id;
  const head = element("header", "entry-head");
  head.append(element("span", "entry-code", entry.code), element("h4", "entry-title", entry.title));
  const chips = element("div", "entry-chips");
  for (const chip of entry.chips) {
    const look = chip.tone ? `tone-${chip.tone}` : `kind-${chip.kind || "plain"}`;
    chips.append(element("span", `entry-chip ${look}`, chip.label));
  }
  const meta = element("dl", "entry-meta");
  for (const item of entry.meta) meta.append(metaNode(item));
  card.append(head, chips, meta, ...entry.texts.map(textNode));
  return card;
}

function show(text) {
  const view = JSON.parse(text).view;
  for (const key of ["title", "lead", "note"]) {
    document.querySelector(`[data-fill="${key}"]`).textContent = view[key];
  }
  const catalog = document.getElementById("catalog");
  if (view.sources) catalog.append(sourcesLine(view.sources));
  if (view.summary) catalog.append(summaryNode(view.summary));

  const records = [];
  const groups = [];
  const bar = element("div", "filters");
  catalog.append(bar);

  for (const section of view.sections) {
    const box = element("section", "catalog-section");
    box.append(element("h2", "", section.title));
    for (const group of section.groups) {
      const part = element("section", "catalog-group");
      part.id = group.id;
      const grid = element("div", "entries-grid");
      const heading = element("h3", "", group.title);
      const members = [];
      for (const entry of group.entries) {
        const node = entryNode(entry);
        const words = [entry.code, entry.title, ...entry.texts.map((t) => t.text)].join(" ").toLowerCase();
        const record = { node, tags: new Set(entry.tags), words };
        records.push(record);
        members.push(record);
        grid.append(node);
      }
      part.append(heading, grid);
      groups.push({ part, members });
      box.append(part);
    }
    catalog.append(box);
  }

  const empty = element("p", "catalog-empty", view.empty || "");
  empty.hidden = true;
  catalog.append(empty);

  if (view.legend) {
    const legend = element("section", "catalog-legend");
    const list = element("dl");
    for (const item of view.legend.entries) list.append(element("dt", "", item.term), element("dd", "", item.text));
    legend.append(element("h2", "", view.legend.title), list);
    catalog.append(legend);
  }
  if (view.sources) catalog.append(sourcesNode(view.sources));

  // One choice per group of filters, "all" by default; the search narrows every choice.
  const choice = new Map(view.filters.map((group) => [group.id, "all"]));
  const owner = new Map();
  const buttons = [];
  let query = "";

  function passes(record, skip) {
    for (const [group, option] of choice) {
      if (group !== skip && option !== "all" && !record.tags.has(option)) return false;
    }
    return !query || record.words.includes(query);
  }

  function apply(writeHash) {
    let shown = 0;
    for (const record of records) {
      record.node.hidden = !passes(record);
      if (!record.node.hidden) shown += 1;
    }
    for (const { part, members } of groups) part.hidden = members.every((r) => r.node.hidden);
    empty.hidden = shown > 0;
    for (const { group, option, button, count } of buttons) {
      button.setAttribute("aria-pressed", String(choice.get(group) === option));
      count.textContent = String(records.filter((r) => (option === "all" || r.tags.has(option)) && passes(r, group)).length);
    }
    if (writeHash) {
      const chosen = [...choice.values()].filter((option) => option !== "all");
      const address = chosen.length ? `#${chosen.join("+")}` : location.pathname + location.search;
      history.replaceState(null, "", address);
    }
  }

  for (const group of view.filters) {
    const row = element("div", "filter-group");
    row.setAttribute("role", "group");
    row.setAttribute("aria-label", group.label);
    row.append(element("span", "filter-label", group.label));
    for (const option of group.options) {
      if (option.id !== "all") owner.set(option.id, group.id);
      const button = element("button", option.tone ? `filter tone-${option.tone}` : "filter");
      button.type = "button";
      const count = element("span", "count");
      button.append(element("span", "", option.label), count);
      button.addEventListener("click", () => {
        choice.set(group.id, option.id);
        apply(true);
      });
      buttons.push({ group: group.id, option: option.id, button, count });
      row.append(button);
    }
    bar.append(row);
  }

  let search;
  if (view.search) {
    const row = element("div", "filter-group");
    const label = element("label", "filter-label", view.search.label);
    search = element("input", "filter-search");
    search.type = "search";
    search.id = "catalog-search";
    search.placeholder = view.search.placeholder;
    search.autocomplete = "off";
    label.htmlFor = search.id;
    search.addEventListener("input", () => {
      query = search.value.trim().toLowerCase();
      apply(false);
    });
    row.append(label, search);
    bar.append(row);
  }

  function route() {
    const hash = decodeURIComponent(location.hash.slice(1));
    const parts = hash ? hash.split("+") : [];
    for (const group of choice.keys()) choice.set(group, "all");
    for (const node of catalog.querySelectorAll(".spotlight")) node.classList.remove("spotlight");
    if (parts.length && parts.every((part) => owner.has(part))) {
      for (const part of parts) choice.set(owner.get(part), part);
      return apply(false);
    }
    query = "";
    if (search) search.value = "";
    apply(false);
    const target = hash && document.getElementById(hash);
    if (target && target.classList.contains("entry")) {
      const first = target.querySelector("details");
      if (first) first.open = true;
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
