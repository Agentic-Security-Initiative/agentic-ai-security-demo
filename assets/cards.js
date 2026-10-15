import { chart } from "./chart.js";

// The tiles and the cards of a view document, shared by the sections that lay one out. A view
// gives every text the page shows, its fields (with the ends of each scale), its groups, each with
// a tone from 1 (green) to 3 (red), its items, and the blocks of each item's card; this code knows
// only that structure. Color never carries a meaning alone: every group, segment, region, chip,
// and badge also carries its label. A card has an address of its own, the item's id after a #, so
// that it can be linked to and closed with the browser's back button.

export function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// A text of the document may mark a superscript as ^(...); the rest stays plain text.
export function rich(node, text) {
  const parts = text.split(/\^\(([^)]*)\)/);
  parts.forEach((part, i) => node.append(i % 2 ? element("sup", "", part) : part));
  return node;
}

// Two decimals, with a true minus sign; a signed field also shows its plus sign.
export function number(value, signed) {
  const digits = Math.abs(value).toFixed(2);
  if (value < 0) return `−${digits}`;
  return signed ? `+${digits}` : digits;
}

function label(field) {
  const name = element("abbr", "", field.label);
  name.title = field.title;
  return name;
}

// A bar from the start of the scale, or, on a scale that spans zero, from zero; the widths go
// through the CSSOM, which the page's Content Security Policy allows, not a style attribute.
function meter(field, value) {
  const span = field.max - field.min;
  const at = (x) => `${(100 * (x - field.min)) / span}%`;
  const origin = field.min < 0 && field.max > 0 ? 0 : field.min;
  const track = element("span", origin === field.min ? "track" : "track centered");
  const fill = element("span", "fill");
  fill.style.setProperty("--from", at(Math.min(origin, value)));
  fill.style.setProperty("--to", at(Math.max(origin, value)));
  track.setAttribute("aria-hidden", "true");
  track.append(fill);
  return track;
}

// The values of an item: a meter for each field, and the highlighted one as a badge.
function values(item, fields, group) {
  const meters = element("dl", "meters");
  let badge = null;
  for (const field of fields) {
    const value = item.values[field.key];
    if (field.highlight) {
      badge = element("div", "badge");
      badge.title = `${field.title}: ${number(value, field.signed)} (${group.title})`;
      const term = element("span", "badge-label");
      term.append(label(field));
      badge.append(term, element("span", "badge-value", number(value, field.signed)), element("span", "badge-group", group.title));
      continue;
    }
    const row = element("div", "meter");
    const term = element("dt");
    term.append(label(field));
    const detail = element("dd");
    detail.append(meter(field, value), element("span", "num", number(value, field.signed)));
    row.append(term, detail);
    meters.append(row);
  }
  const foot = element("div", "tile-foot");
  foot.append(meters);
  if (badge) foot.append(badge);
  return foot;
}

function heading(item) {
  const top = element("div", "tile-top");
  top.append(element("p", "tile-kicker", item.kicker), element("span", "tag", item.tag));
  return top;
}

// The title links to the card; its link covers the whole tile.
export function tile(item, fields, group) {
  const card = element("article", "tile");
  const title = element("h3");
  const link = element("a", "", item.title);
  link.href = `#${item.id}`;
  title.append(link);
  card.append(
    heading(item),
    title,
    element("p", "tile-subtitle", item.subtitle),
    element("p", "tile-text", item.text),
    values(item, fields, group),
  );
  return card;
}

// --- The blocks of a card -----------------------------------------------------------------

function scale(block) {
  const box = element("figure", "scale");
  box.append(rich(element("figcaption", "scale-title"), block.title));
  const span = block.max - block.min;
  const at = (x) => `${(100 * (x - block.min)) / span}%`;
  const bar = element("div", "scale-bar");
  const track = element("div", "scale-track");
  for (const band of block.bands) {
    const segment = element("span", `scale-band tone-${band.tone}`);
    segment.style.setProperty("--from", at(band.from));
    segment.style.setProperty("--to", at(band.to));
    track.append(segment);
  }
  bar.append(track);
  const marker = element("span", "scale-marker");
  marker.style.setProperty("--at", at(block.value));
  marker.append(rich(element("span", "scale-marker-label"), block.label));
  bar.append(marker);
  const ticks = element("div", "scale-ticks");
  for (const tick of block.ticks) {
    const mark = element("span", "", tick.label);
    mark.style.setProperty("--at", at(tick.at));
    ticks.append(mark);
  }
  box.append(bar, ticks);
  return box;
}

function facts(block) {
  const list = element("dl", "facts");
  for (const fact of block.facts) {
    const row = element("div", fact.current ? "fact current" : "fact");
    const detail = element("dd");
    detail.append(rich(element("span", "fact-value"), fact.value));
    if (fact.note) detail.append(rich(element("span", "fact-note"), fact.note));
    row.append(rich(element("dt"), fact.label), detail);
    list.append(row);
  }
  return list;
}

function entries(block) {
  const list = element("dl", "entries");
  for (const entry of block.entries) {
    list.append(rich(element("dt"), entry.term), rich(element("dd"), entry.text));
  }
  return list;
}

function table(block) {
  const box = element("div", "table-scroll");
  const grid = element("table", "card-table");
  const head = element("tr");
  for (const column of block.columns) head.append(rich(element("th"), column));
  const thead = element("thead");
  thead.append(head);
  grid.append(thead);
  const body = element("tbody");
  for (const row of block.rows) {
    const line = element("tr");
    row.forEach((cell, i) => {
      const td = element(i === 0 ? "th" : "td");
      if (i === 0) td.scope = "row";
      line.append(rich(td, cell));
    });
    body.append(line);
  }
  grid.append(body);
  box.append(grid);
  return box;
}

function text(block) {
  const paragraph = element("p", "card-text");
  if (block.lead) paragraph.append(element("strong", "", block.lead), " ");
  return rich(paragraph, block.text);
}

// Codes in groups, each with its title as a tooltip, and a link to where they are told in full.
// Groups of codes, each group of a kind that sets its look, each code with its title on hover and,
// when the document gives one, a link; then the links of the block.
function list(block) {
  const box = element("div", "id-list");
  for (const group of block.groups) {
    const row = element("div", group.kind ? `id-group kind-${group.kind}` : "id-group");
    const items = element("ul", "id-items");
    for (const item of group.items) {
      const entry = element("li", "id-item");
      const label = item.href ? element("a", "", item.code) : document.createTextNode(item.code);
      if (item.href) label.href = item.href;
      entry.title = item.title;
      entry.append(label);
      items.append(entry);
    }
    row.append(rich(element("p", "id-group-title"), group.title), items);
    box.append(row);
  }
  const links = block.links || (block.href ? [{ href: block.href, label: block.link }] : []);
  if (links.length) {
    const row = element("p", "id-links");
    for (const item of links) {
      const link = element("a", "id-link", item.label);
      link.href = item.href;
      if (/^https?:/.test(item.href)) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
      row.append(link);
    }
    box.append(row);
  }
  return box;
}

// A sequence of steps, each a chip and a word, joined by arrows; a step that loops back is drawn
// dashed. The steps come from the document, in order.
function flow(block) {
  const row = element("ol", "flow");
  block.steps.forEach((step, i) => {
    if (i) row.append(element("li", "flow-arrow", "\u2192"));
    const item = element("li", step.loop ? "flow-step loop" : "flow-step");
    item.append(element("span", "chip", step.label), element("span", "flow-title", step.title));
    row.append(item);
  });
  return row;
}

const BLOCKS = {
  chart: (block) => chart(block, rich),
  scale,
  facts,
  entries,
  table,
  text,
  note: (block) => rich(element("p", "card-note"), block.text),
  placeholder: (block) => rich(element("p", "placeholder"), block.text),
  list,
  flow,
};

function section(spec) {
  const box = element("section", `card-section${spec.layout ? ` ${spec.layout}` : ""}`);
  const head = element("header", "card-section-head");
  head.append(element("span", "chip", spec.kicker), rich(element("h3"), spec.title));
  box.append(head);
  const blocks = spec.blocks.map((block) => BLOCKS[block.type](block));
  if (spec.layout === "split") {
    const first = element("div", "split-main");
    const rest = element("div", "split-side");
    first.append(blocks[0]);
    rest.append(...blocks.slice(1));
    box.append(first, rest);
  } else {
    box.append(...blocks);
  }
  return box;
}

export function card(item, view) {
  const group = view.groups.find((g) => g.id === item.group);
  const body = element("div", "card-body");
  const head = element("header", "card-head");
  head.append(heading(item), element("h2", "", item.title), element("p", "tile-subtitle", item.subtitle));
  body.append(head, element("p", "card-lead", item.text), values(item, view.fields, group));
  for (const spec of item.detail.sections) body.append(section(spec));
  return { body, tone: group.tone };
}

// The items as tiles, in their groups, each group headed by its title, its detail, and its count.
export function groupedTiles(view, container) {
  for (const group of view.groups) {
    const members = view.items
      .filter((item) => item.group === group.id)
      .sort((a, b) => a.order - b.order);
    const box = element("section", `group tone-${group.tone}`);
    box.id = `group-${group.id}`;
    const head = element("header", "group-head");
    head.append(
      element("span", "dot"),
      element("h2", "", group.title),
      rich(element("span", "detail"), group.detail),
      element("span", "count", `${members.length} of ${view.items.length}`),
    );
    const tiles = element("div", "tiles");
    tiles.append(...members.map((item) => tile(item, view.fields, group)));
    box.append(head, tiles);
    container.append(box);
  }
}

// The card of an item, opened in the page's dialog at the item's address. Closing a card leaves
// its address: back to the page when the card was opened from it, otherwise, for a card opened
// from a link, the address loses its #. Returns the function that opens the card the address
// names, to call once the view is laid out.
export function cardRouter(dialog) {
  const slot = dialog.querySelector(".card-slot");
  let items = new Map();
  let openedFromPage = false;
  let current = null;

  const itemOfHash = () => items.get(decodeURIComponent(location.hash.slice(1)));

  function route(view, initial) {
    if (view) items = new Map(view.items.map((item) => [item.id, { item, view }]));
    const entry = itemOfHash();
    if (entry) {
      const { body, tone } = card(entry.item, entry.view);
      slot.replaceChildren(body);
      dialog.className = `card-dialog tone-${tone}`;
      openedFromPage = !initial;
      current = entry.item.id;
      if (!dialog.open) dialog.showModal();
      dialog.scrollTop = 0;
    } else if (dialog.open) {
      current = null;
      dialog.close();
    }
  }

  window.addEventListener("hashchange", () => route(null, false));
  dialog.querySelector(".card-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => {
    if (current && itemOfHash()) {
      if (openedFromPage) history.back();
      else history.replaceState(null, "", location.pathname + location.search);
    }
    current = null;
  });
  return (view) => route(view, true);
}
