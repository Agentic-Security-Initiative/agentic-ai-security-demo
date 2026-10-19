// Draws a chart document as SVG: two axes with their ticks, regions in the three tones, boundary
// lines, and points, each point with a tooltip and, when it has one, a link, and with its label
// placed clear of the other labels and points; a legend names the regions. The document gives
// every number and every label; this code only lays them out. The chart is drawn at the width it
// is given, and drawn again when that width changes, so that its text keeps its size on every
// screen.

const SVG = "http://www.w3.org/2000/svg";

function node(tag, attributes = {}, text) {
  const element = document.createElementNS(SVG, tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, String(value));
  if (text !== undefined) element.textContent = text;
  return element;
}

function html(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

const MARGIN = { top: 14, right: 18, bottom: 46, left: 54 };
const LABEL_HEIGHT = 14;
const CHAR_WIDTH = 6.6;

function draw(spec, canvas) {
  const width = canvas.clientWidth;
  if (!width) return;
  const height = spec.square
    ? Math.min(width, 440)
    : Math.max(280, Math.min(440, Math.round(width * 0.58)));
  const plot = {
    width: width - MARGIN.left - MARGIN.right,
    height: height - MARGIN.top - MARGIN.bottom,
  };
  const sx = (x) => MARGIN.left + ((x - spec.x.min) / (spec.x.max - spec.x.min)) * plot.width;
  const sy = (y) => MARGIN.top + (1 - (y - spec.y.min) / (spec.y.max - spec.y.min)) * plot.height;
  const path = (points) => points.map(([x, y]) => `${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join(" ");

  const svg = node("svg", { width, height, viewBox: `0 0 ${width} ${height}`, role: "img" });
  svg.append(node("title", {}, spec.title));

  const regions = node("g", { class: "regions" });
  for (const region of spec.regions) {
    regions.append(node("polygon", { class: `region tone-${region.tone}`, points: path(region.points) }));
  }
  svg.append(regions);

  const grid = node("g", { class: "grid" });
  for (const tick of spec.x.ticks) {
    grid.append(node("line", { x1: sx(tick.at), x2: sx(tick.at), y1: MARGIN.top, y2: MARGIN.top + plot.height }));
  }
  for (const tick of spec.y.ticks) {
    grid.append(node("line", { x1: MARGIN.left, x2: MARGIN.left + plot.width, y1: sy(tick.at), y2: sy(tick.at) }));
  }
  svg.append(grid);

  for (const line of spec.lines || []) {
    svg.append(node("polyline", { class: "boundary", points: path(line.points), fill: "none" }));
  }
  svg.append(node("rect", {
    class: "frame", x: MARGIN.left, y: MARGIN.top, width: plot.width, height: plot.height, fill: "none",
  }));

  const axes = node("g", { class: "axes" });
  for (const tick of spec.x.ticks) {
    axes.append(node("text", { x: sx(tick.at), y: MARGIN.top + plot.height + 16, "text-anchor": "middle" }, tick.label));
  }
  for (const tick of spec.y.ticks) {
    axes.append(node("text", { x: MARGIN.left - 8, y: sy(tick.at) + 4, "text-anchor": "end" }, tick.label));
  }
  axes.append(node("text", {
    class: "axis-label", x: MARGIN.left + plot.width / 2, y: height - 8, "text-anchor": "middle",
  }, spec.x.label));
  const yLabel = node("text", {
    class: "axis-label", x: 0, y: 0, "text-anchor": "middle",
    transform: `translate(14 ${MARGIN.top + plot.height / 2}) rotate(-90)`,
  }, spec.y.label);
  axes.append(yLabel);
  svg.append(axes);

  // The drawing goes in the page first, so that each label can be measured before it is placed.
  canvas.replaceChildren(svg);
  const marks = node("g", { class: "points" });
  svg.append(marks);
  placeLabels(spec.points.map((point) => ({ point, px: sx(point.x), py: sy(point.y) })), marks, {
    left: MARGIN.left, top: MARGIN.top, right: MARGIN.left + plot.width, bottom: MARGIN.top + plot.height,
  });
}

const RADIUS = 6;
const GAP = 4;

function overlap(a, b) {
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return w > 0 && h > 0 ? w * h : 0;
}

// The boxes a label may take around its point: beside it, then above and below it, then further
// out and slid along, each nearer place tried first. A box away from the point is joined to it by a leader line.
function candidates(px, py, width) {
  const h = LABEL_HEIGHT;
  const near = RADIUS + GAP;
  const boxes = [
    { left: px + near, top: py - h / 2 },
    { left: px - near - width, top: py - h / 2 },
    { left: px - width / 2, top: py - near - h },
    { left: px - width / 2, top: py + near },
    { left: px + near, top: py - near - h },
    { left: px + near, top: py + near },
    { left: px - near - width, top: py - near - h },
    { left: px - near - width, top: py + near },
  ];
  for (let step = 1; step <= 6; step += 1) {
    const dy = near + step * h;
    for (const top of [py - dy - h, py + dy]) {
      boxes.push({ left: px + near, top, leader: true });
      boxes.push({ left: px - near - width, top, leader: true });
      for (const share of [0.5, 0.25, 0.75, 0, 1]) boxes.push({ left: px - share * width, top, leader: true });
    }
  }
  return boxes.map((box) => ({ ...box, right: box.left + width, bottom: box.top + h }));
}

// Places the labels one point at a time, from the most crowded point to the least, each in the
// first box that overlaps no frame edge, no point, and no other label, or else in the box that
// overlaps least.
function placeLabels(items, marks, frame) {
  const dots = items.map(({ px, py }) => ({
    left: px - RADIUS - 2, right: px + RADIUS + 2, top: py - RADIUS - 2, bottom: py + RADIUS + 2,
  }));
  const groups = items.map(({ point, px, py }) => {
    const group = node("g", { class: "point" });
    group.append(node("title", {}, point.title || point.label));
    const text = node("text", { x: px, y: py }, point.label);
    group.append(text);
    group.append(node("circle", { cx: px, cy: py, r: RADIUS }));
    if (point.href) {
      const link = node("a", { href: point.href });
      link.append(group);
      marks.append(link);
    } else {
      marks.append(group);
    }
    return { group, text, width: text.getComputedTextLength() || point.label.length * CHAR_WIDTH };
  });

  const crowding = items.map((a) => items.reduce((sum, b) => sum + 1 / (1 + Math.hypot(a.px - b.px, a.py - b.py)), 0));
  const order = items.map((_, i) => i).sort((a, b) => crowding[b] - crowding[a]);
  const boxes = items.map(({ px, py }, i) => candidates(px, py, groups[i].width));
  const placed = [];
  const choose = (i) => {
    let best;
    let bestCost = Infinity;
    for (const box of boxes[i]) {
      let cost = ((box.right - box.left) * (box.bottom - box.top) - overlap(box, frame)) * 4;
      for (let j = 0; j < placed.length; j += 1) if (j !== i && placed[j]) cost += overlap(box, placed[j]) * 4;
      for (let j = 0; j < dots.length; j += 1) if (j !== i) cost += overlap(box, dots[j]) * 2;
      if (cost < bestCost) {
        best = box;
        bestCost = cost;
      }
      if (cost === 0) break;
    }
    return best;
  };
  // A first pass places each label against those placed before it; the rounds after place each
  // one again against all the others, so that a label placed early can make way for a later one.
  for (const i of order) placed[i] = choose(i);
  for (let round = 0; round < 3; round += 1) for (const i of order) placed[i] = choose(i);

  for (const i of order) {
    const { px, py } = items[i];
    const { group, text } = groups[i];
    const best = placed[i];
    text.setAttribute("x", best.left);
    text.setAttribute("y", best.bottom - 3);
    if (best.leader) {
      const ty = best.top > py ? best.top : best.bottom;
      const tx = best.left > px ? best.left : best.right < px ? best.right : px;
      const reach = Math.hypot(tx - px, ty - py);
      group.prepend(node("line", {
        class: "leader",
        x1: px + ((tx - px) / reach) * RADIUS, y1: py + ((ty - py) / reach) * RADIUS, x2: tx, y2: ty,
      }));
    }
  }
}

// A figure with a title, the drawing, a legend of the regions, and a note; rich() lays out a text
// of the document, which may carry a superscript.
export function chart(spec, rich) {
  const figure = html("figure", "chart");
  figure.append(rich(html("figcaption", "chart-title"), spec.title));
  const canvas = html("div", "chart-canvas");
  figure.append(canvas);

  const legend = html("ul", "chart-legend");
  for (const region of spec.regions) {
    if (!region.label) continue;
    const entry = html("li", `tone-${region.tone}`);
    entry.append(html("span", "swatch"), rich(html("span"), region.label));
    legend.append(entry);
  }
  figure.append(legend);
  if (spec.note) figure.append(rich(html("p", "chart-note"), spec.note));

  let frame = 0;
  new ResizeObserver(() => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => draw(spec, canvas));
  }).observe(canvas);
  return figure;
}
