export const CATEGORIES = [
  { id: "carnes", name: "Carnes y proteínas", short: "Carnes", color: "#C4623E", icon: "meat" },
  { id: "lacteos", name: "Lácteos", short: "Lácteos", color: "#C49612", icon: "milk" },
  { id: "verduras", name: "Verduras y frutas", short: "Verduras", color: "#5E7A3A", icon: "leaf" },
  { id: "despensa", name: "Despensa", short: "Despensa", color: "#A6843E", icon: "jar" },
  { id: "bebidas", name: "Bebidas", short: "Bebidas", color: "#2E6F68", icon: "cup" },
  { id: "licores", name: "Licores y cerveza", short: "Licores", color: "#8C3A4B", icon: "bottle" },
  { id: "aseo", name: "Desechables y aseo", short: "Aseo", color: "#6E6A62", icon: "spark" },
];

export const UNITS = ["kg", "g", "L", "ml", "und", "paq", "atado"];

export const STATUSES = [
  { id: "all", label: "Todos" },
  { id: "ok", label: "OK" },
  { id: "low", label: "Bajo" },
  { id: "out", label: "Agotado" },
  { id: "soon", label: "Por vencer" },
];

export const MOVE_TYPES = [
  { id: "entrada", label: "Entrada" },
  { id: "salida", label: "Salida" },
  { id: "merma", label: "Merma" },
  { id: "ajuste", label: "Ajuste" },
];

const FALLBACK_CATEGORY = { id: "otra", name: "Otra", short: "Otra", color: "#6E6A62", icon: "box" };

export function round1(n) {
  return Math.round((Number(n) + Number.EPSILON) * 10) / 10;
}

export function category(id) {
  return CATEGORIES.find((c) => c.id === id) || FALLBACK_CATEGORY;
}

export function stepFor(unit) {
  if (unit === "kg" || unit === "L") return 0.5;
  if (unit === "g" || unit === "ml") return 100;
  return 1;
}

export function bogotaParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  return { y: get("year"), m: get("month"), d: get("day"), hh: get("hour"), mm: get("minute") };
}

export function ymdFromOffset(offset) {
  const { y, m, d } = bogotaParts();
  const dt = new Date(Date.UTC(y, m - 1, d + offset));
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${dt.getUTCFullYear()}-${mm}-${dd}`;
}

export function isoAt(daysAgo, hourBogota) {
  const { y, m, d } = bogotaParts();
  return new Date(Date.UTC(y, m - 1, d - daysAgo, hourBogota + 5, 0, 0)).toISOString();
}

export function dateKey(value) {
  const { y, m, d } = bogotaParts(value instanceof Date ? value : new Date(value));
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function daysUntil(ymd) {
  if (!ymd) return null;
  const today = Date.parse(`${ymdFromOffset(0)}T00:00:00Z`);
  const exp = Date.parse(`${ymd}T00:00:00Z`);
  if (Number.isNaN(exp)) return null;
  return Math.round((exp - today) / 86400000);
}

export function flags(item) {
  const soon = item.stock > 0 && daysUntil(item.expiry) !== null && daysUntil(item.expiry) <= 7;
  const out = item.stock <= 0;
  const low = item.stock > 0 && item.stock <= item.min;
  return { out, low, soon, ok: !out && !low && !soon };
}

export function money(n) {
  const v = Math.round(Number(n) || 0);
  const body = Math.abs(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${v < 0 ? "−" : ""}$ ${body}`;
}

export function moneyShort(n) {
  const v = Math.round(Number(n) || 0);
  const abs = Math.abs(v);
  if (abs >= 1000000) {
    const m = abs / 1000000;
    const text = (m >= 10 ? m.toFixed(0) : m.toFixed(1)).replace(".", ",");
    return `${v < 0 ? "−" : ""}$ ${text} M`;
  }
  return money(v);
}

export function fmtQty(n) {
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(round1(n) || 0);
}

export function plainQty(n) {
  if (n === "" || n === null || n === undefined) return "";
  const v = round1(n);
  if (!Number.isFinite(v)) return "";
  return Number.isInteger(v) ? String(v) : String(v).replace(".", ",");
}

export function parseNum(raw) {
  if (raw === null || raw === undefined) return null;
  const text = String(raw).trim().replace(",", ".");
  if (!text) return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

export function norm(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

export function expiryLabel(item) {
  if (!item.expiry) return "Sin vencimiento";
  const d = daysUntil(item.expiry);
  if (d === null) return "Sin vencimiento";
  if (d < 0) return `Venció hace ${Math.abs(d)} día${Math.abs(d) === 1 ? "" : "s"}`;
  if (d === 0) return "Vence hoy";
  if (d === 1) return "Vence mañana";
  return `Vence en ${d} días`;
}

export function stockTone(item) {
  if (item.stock <= 0) return "out";
  if (item.stock <= item.min) return "low";
  return "ok";
}

export function badgeList(item) {
  const f = flags(item);
  if (f.out) return ["out"];
  const list = [];
  if (f.low) list.push("low");
  if (f.soon) list.push("soon");
  return list.length ? list : ["ok"];
}

export function statusLabel(code, item) {
  if (code === "out") return "Agotado";
  if (code === "low") return "Bajo";
  if (code === "soon") {
    const d = item ? daysUntil(item.expiry) : 1;
    return d !== null && d < 0 ? "Vencido" : "Por vencer";
  }
  return "OK";
}

export function hitItem(item, query) {
  if (!query) return true;
  const cat = category(item.category);
  return norm(`${item.name} ${item.supplier} ${cat.name} ${item.unit}`).includes(norm(query));
}

export function hitMove(move, query) {
  if (!query) return true;
  return norm(`${move.itemName} ${move.note} ${move.type}`).includes(norm(query));
}

export function filteredItems(state) {
  return state.items
    .filter((item) => {
      if (state.category !== "all" && item.category !== state.category) return false;
      if (state.status !== "all" && !flags(item)[state.status]) return false;
      return hitItem(item, state.query);
    })
    .sort(sorter(state.sort));
}

function sorter(sort) {
  if (sort === "stock") return (a, b) => a.stock - b.stock || a.name.localeCompare(b.name, "es");
  if (sort === "expiry") {
    return (a, b) => {
      const da = a.expiry ? daysUntil(a.expiry) ?? 9999 : 9999;
      const db = b.expiry ? daysUntil(b.expiry) ?? 9999 : 9999;
      return da - db || a.name.localeCompare(b.name, "es");
    };
  }
  if (sort === "value") return (a, b) => b.stock * b.cost - a.stock * a.cost;
  return (a, b) => a.name.localeCompare(b.name, "es");
}

export function inventoryValue(items) {
  return items.reduce((sum, item) => sum + item.stock * item.cost, 0);
}

export function alertItems(items) {
  return items
    .filter((item) => {
      const f = flags(item);
      return f.out || f.low || f.soon;
    })
    .sort((a, b) => {
      const rank = (item) => (flags(item).out ? 0 : flags(item).soon ? 1 : 2);
      return rank(a) - rank(b) || a.name.localeCompare(b.name, "es");
    });
}

export function alertDetail(item) {
  const parts = [];
  if (item.stock <= 0) parts.push(`Agotado · mín ${fmtQty(item.min)} ${item.unit}`);
  else if (item.stock <= item.min) parts.push(`Stock ${fmtQty(item.stock)} ${item.unit} · mín ${fmtQty(item.min)}`);
  if (flags(item).soon) parts.push(expiryLabel(item));
  return parts.join(" · ");
}

export function suggestedQty(item) {
  let qty = round1(item.min * 2 - item.stock);
  if (qty <= 0) qty = round1(item.min > 0 ? item.min : 1);
  return qty;
}

export function purchaseGroups(items) {
  const lines = items
    .filter((item) => item.stock <= item.min)
    .map((item) => {
      const suggest = suggestedQty(item);
      return { ...item, suggest, estimated: Math.round(suggest * item.cost) };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
  const map = new Map();
  for (const line of lines) {
    const key = line.supplier.trim() || "Sin proveedor";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(line);
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], "es"))
    .map(([supplier, rows]) => ({
      supplier,
      rows,
      total: rows.reduce((sum, row) => sum + row.estimated, 0),
    }));
}

export function orderText(groups) {
  const body = groups
    .map((group) => {
      const lines = group.rows.map((row) => `• ${row.name} — ${fmtQty(row.suggest)} ${row.unit}`);
      return [`*${group.supplier}*`, ...lines].join("\n");
    })
    .join("\n\n");
  return [`*Pedido Andalucía — La Mesa*`, "", body, "", "Quedo atento. Gracias."].join("\n");
}

export function criticalItems(items) {
  const score = (item) => {
    if (item.stock <= 0) return -1000 - item.min;
    if (item.min <= 0) return 1000 + item.stock;
    return item.stock / item.min;
  };
  return [...items].sort((a, b) => score(a) - score(b) || a.name.localeCompare(b.name, "es")).slice(0, 8);
}

export function categorySlices(items) {
  const rows = CATEGORIES.map((cat) => ({
    ...cat,
    value: items.filter((item) => item.category === cat.id).reduce((sum, item) => sum + item.stock * item.cost, 0),
  })).filter((row) => row.value > 0);
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  return { rows, total };
}

export function weekSeries(movements) {
  const days = [];
  for (let ago = 6; ago >= 0; ago -= 1) {
    const key = ymdFromOffset(-ago);
    days.push({ key, label: weekdayLabel(key), in: 0, out: 0 });
  }
  const map = new Map(days.map((day) => [day.key, day]));
  for (const move of movements) {
    const bucket = map.get(dateKey(move.at));
    if (!bucket) continue;
    if (move.sign > 0) bucket.in += 1;
    else bucket.out += 1;
  }
  return days;
}

export function weekdayLabel(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 17, 0, 0));
  const name = new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", weekday: "short" }).format(dt);
  const clean = name.replace(".", "");
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

export function whenLabel(iso) {
  const key = dateKey(iso);
  const time = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
  if (key === ymdFromOffset(0)) return `Hoy · ${time}`;
  if (key === ymdFromOffset(-1)) return `Ayer · ${time}`;
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 17, 0, 0));
  const day = new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", day: "numeric", month: "short" }).format(dt);
  return `${day} · ${time}`;
}

export function longDate(date = new Date()) {
  const text = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function filteredMoves(state) {
  return [...state.movements]
    .filter((move) => {
      if (state.movItem !== "all" && move.itemId !== state.movItem) return false;
      if (state.movType !== "all" && move.type !== state.movType) return false;
      const key = dateKey(move.at);
      if (state.movFrom && key < state.movFrom) return false;
      if (state.movTo && key > state.movTo) return false;
      return hitMove(move, state.query);
    })
    .sort((a, b) => b.at.localeCompare(a.at));
}

export function countWhere(items, pred) {
  return items.reduce((sum, item) => sum + (pred(item) ? 1 : 0), 0);
}
