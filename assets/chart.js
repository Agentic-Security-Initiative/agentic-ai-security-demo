// Draws a chart document as SVG: two axes with their ticks, regions in the three tones, boundary
// lines, and points, each point with a tooltip and, when it has one, a link; a legend names the
// regions. The document gives every number and every label; this code only lays them out. The
// chart is drawn at the width it is given, and drawn again when that width changes, so that its
// text keeps its size on every screen.

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

  // Labels sit beside their points, on the side with room, and move down when they would overlap.
  const placed = [];
  const marks = node("g", { class: "points" });
  const ordered = [...spec.points].sort((a, b) => sy(a.y) - sy(b.y));
  for (const point of ordered) {
    const px = sx(point.x);
    const py = sy(point.y);
    const right = px < MARGIN.left + plot.width * 0.72;
    const labelWidth = point.label.length * CHAR_WIDTH;
    const left = right ? px + 10 : px - 10 - labelWidth;
    let ly = py + 4;
    for (const other of placed) {
      const apart = left + labelWidth < other.left || other.left + other.width < left;
      if (!apart && Math.abs(ly - other.y) < LABEL_HEIGHT) ly = other.y + LABEL_HEIGHT;
    }
    placed.push({ left, width: labelWidth, y: ly });

    const group = node("g", { class: "point" });
    group.append(node("title", {}, point.title || point.label));
    group.append(node("circle", { cx: px, cy: py, r: 6 }));
    group.append(node("text", { x: right ? px + 10 : px - 10, y: ly, "text-anchor": right ? "start" : "end" }, point.label));
    if (point.href) {
      const link = node("a", { href: point.href });
      link.append(group);
      marks.append(link);
    } else {
      marks.append(group);
    }
  }
  svg.append(marks);

  canvas.replaceChildren(svg);
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
