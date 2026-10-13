import { SOURCES } from "../assets/config.js";
import { signIn } from "../assets/signin.js";

// Lays out a view document as tiles in groups. The document gives every text the page shows
// (title, lead, note), its fields, its groups, each with a tone from 1 (green) to 3 (red), and
// its items; this code knows only that structure.

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// Two decimals, with a true minus sign; a signed field also shows its plus sign.
function number(value, signed) {
  const digits = Math.abs(value).toFixed(2);
  if (value < 0) return `−${digits}`;
  return signed ? `+${digits}` : digits;
}

function tile(item, fields) {
  const card = element("article", "tile");
  const subtitle = element("p", "tile-subtitle");
  subtitle.append(element("span", "tag", item.tag), ` ${item.subtitle}`);
  const values = element("dl", "values");
  for (const field of fields) {
    const pair = element("div", field.highlight ? "highlight" : "");
    const term = element("dt");
    const label = element("abbr", "", field.label);
    label.title = field.title;
    term.append(label);
    pair.append(term, element("dd", "", number(item.values[field.key], field.signed)));
    values.append(pair);
  }
  card.append(
    element("p", "tile-kicker", item.kicker),
    element("h3", "", item.title),
    subtitle,
    element("p", "tile-text", item.text),
    values,
  );
  return card;
}

function show(text) {
  const view = JSON.parse(text).view;
  for (const key of ["title", "lead", "note"]) {
    document.querySelector(`[data-fill="${key}"]`).textContent = view[key];
  }

  const groups = document.getElementById("groups");
  for (const group of view.groups) {
    const members = view.items
      .filter((item) => item.group === group.id)
      .sort((a, b) => a.order - b.order);
    const section = element("section", `group tone-${group.tone}`);
    const head = element("header", "group-head");
    head.append(
      element("h2", "", group.title),
      element("span", "detail", group.detail),
      element("span", "count", `${members.length} of ${view.items.length}`),
    );
    const tiles = element("div", "tiles");
    tiles.append(...members.map((item) => tile(item, view.fields)));
    section.append(head, tiles);
    groups.append(section);
  }

  document.getElementById("gate").hidden = true;
  document.getElementById("content").hidden = false;
}

signIn(SOURCES.examples, show, { busy: "Opening the examples…" });
