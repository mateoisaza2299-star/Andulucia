import { esc, fmtQty, money } from "./model.js";

export function donutSvg(slices, total) {
  if (!total) {
    return `<p class="empty">Todavía no hay valor en la cocina. Agrega un producto con precio.</p>`;
  }
  const r = 68;
  const c = 2 * Math.PI * r;
  let angle = -90;
  const rings = slices
    .map((slice) => {
      const frac = slice.value / total;
      const arc = frac * c;
      const gap = Math.min(5, arc * 0.12);
      const dash = Math.max(0, arc - gap);
      const rot = angle;
      angle += frac * 360;
      const pct = Math.round(frac * 100);
      const tip = `${slice.name}: ${money(slice.value)} · ${pct}%`;
      return `<circle class="seg" r="${r}" cx="100" cy="100" fill="none" stroke="${slice.color}" stroke-width="24" stroke-dasharray="${dash} ${c - dash}" transform="rotate(${rot} 100 100)" data-action="filter-category" data-category="${esc(slice.id)}" data-tip="${esc(tip)}" />`;
    })
    .join("");
  return `<svg class="donut" viewBox="0 0 200 200" role="img" aria-label="Distribución del valor por categoría">${rings}</svg>`;
}

export function weekSvg(days) {
  const max = Math.max(1, ...days.flatMap((day) => [day.in, day.out]));
  const w = 360;
  const base = 124;
  const gw = w / days.length;
  const bars = days
    .map((day, index) => {
      const x = index * gw + gw / 2;
      const hIn = (day.in / max) * 102;
      const hOut = (day.out / max) * 102;
      const inBar = day.in > 0 ? `<rect x="${x - 16}" y="${base - hIn}" width="14" height="${hIn}" rx="4" fill="var(--teal)"></rect>` : "";
      const outBar = day.out > 0 ? `<rect x="${x + 2}" y="${base - hOut}" width="14" height="${hOut}" rx="4" fill="var(--terracotta)"></rect>` : "";
      return `${inBar}${outBar}<text x="${x}" y="148" text-anchor="middle">${esc(day.label)}</text>`;
    })
    .join("");
  return `<svg class="week" viewBox="0 0 ${w} 160" role="img" aria-label="Entradas y salidas de los últimos 7 días">${bars}</svg>`;
}

export function criticalHtml(items) {
  if (!items.length) return `<p class="empty">Aún no hay productos para comparar.</p>`;
  return `<ol class="hbars">${items
    .map((item) => {
      const max = Math.max(item.stock, item.min, 0.0001);
      const stockPct = Math.max(0, Math.min(100, (item.stock / max) * 100));
      const minPct = Math.max(0, Math.min(100, (item.min / max) * 100));
      const tone = item.stock <= 0 ? "out" : item.stock <= item.min ? "low" : "ok";
      return `<li>
        <div class="hbar-top"><span>${esc(item.name)}</span><b>${fmtQty(item.stock)} / ${fmtQty(item.min)} ${esc(item.unit)}</b></div>
        <div class="track">
          <span class="fill ${tone}" style="width:${stockPct}%"></span>
          <i class="mark" style="left:${minPct}%"></i>
        </div>
      </li>`;
    })
    .join("")}</ol>`;
}
