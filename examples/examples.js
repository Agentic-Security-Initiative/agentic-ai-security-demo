import { SOURCES } from "../assets/config.js";
import { signIn } from "../assets/signin.js";

// Lays out a view document as tiles in groups. The document gives every text the page shows
// (title, lead, note), its fields (with the ends of each scale), its groups, each with a tone
// from 1 (green) to 3 (red), and its items; this code knows only that structure. Color never
// carries a meaning alone: every group, segment, and badge also carries its label.

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

// A text of the document may mark a superscript as ^(...); the rest stays plain text.
function rich(node, text) {
  const parts = text.split(/\^\(([^)]*)\)/);
  parts.forEach((part, i) => node.append(i % 2 ? element("sup", "", part) : part));
  return node;
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

function tile(item, fields, group) {
  const card = element("article", "tile");
  const top = element("div", "tile-top");
  top.append(element("p", "tile-kicker", item.kicker), element("span", "tag", item.tag));

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
  card.append(
    top,
    element("h3", "", item.title),
    element("p", "tile-subtitle", item.subtitle),
    element("p", "tile-text", item.text),
    foot,
  );
  return card;
}

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

function show(text) {
  const view = JSON.parse(text).view;
  for (const key of ["title", "lead", "note"]) {
    rich(document.querySelector(`[data-fill="${key}"]`), view[key]);
  }

  const counts = new Map(view.groups.map((g) => [g.id, view.items.filter((i) => i.group === g.id).length]));
  const groups = document.getElementById("groups");
  groups.append(spread(view, counts));
  for (const group of view.groups) {
    const members = view.items
      .filter((item) => item.group === group.id)
      .sort((a, b) => a.order - b.order);
    const section = element("section", `group tone-${group.tone}`);
    section.id = `group-${group.id}`;
    const head = element("header", "group-head");
    head.append(
      element("span", "dot"),
      element("h2", "", group.title),
      rich(element("span", "detail"), group.detail),
      element("span", "count", `${members.length} of ${view.items.length}`),
    );
    const tiles = element("div", "tiles");
    tiles.append(...members.map((item) => tile(item, view.fields, group)));
    section.append(head, tiles);
    groups.append(section);
  }

  document.getElementById("gate").hidden = true;
  document.getElementById("content").hidden = false;
}

signIn(SOURCES.examples, show, { busy: "Opening the examples…" });
