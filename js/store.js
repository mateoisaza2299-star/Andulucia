import { createSeed } from "./data.js";
import { round1, stepFor } from "./model.js";

const KEY = "andalucia-inventario-v1";

export const state = {
  items: [],
  movements: [],
  view: "dashboard",
  query: "",
  category: "all",
  status: "all",
  sort: "name",
  layout: "table",
  movItem: "all",
  movType: "all",
  movFrom: "",
  movTo: "",
  flashId: "",
};

function valid(data) {
  return Boolean(
    data &&
      Array.isArray(data.items) &&
      Array.isArray(data.movements) &&
      data.items.every((item) => item && item.id && item.name && typeof item.stock === "number"),
  );
}

function read() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || "null");
    return valid(data) ? data : null;
  } catch {
    return null;
  }
}

function save() {
  localStorage.setItem(KEY, JSON.stringify({ items: state.items, movements: state.movements, version: 1 }));
}

function uid(prefix) {
  return `${prefix}${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
}

export function boot() {
  const saved = read();
  if (saved) {
    state.items = saved.items;
    state.movements = saved.movements;
    return;
  }
  const seed = createSeed();
  state.items = seed.items;
  state.movements = seed.movements;
}

export function resetDemo() {
  localStorage.removeItem(KEY);
  const seed = createSeed();
  state.items = seed.items;
  state.movements = seed.movements;
}

function pushMove(item, type, qty, sign, note) {
  const applied = round1(qty);
  state.movements.unshift({
    id: uid("m"),
    itemId: item.id,
    itemName: item.name,
    unit: item.unit,
    type,
    qty: applied,
    sign,
    value: Math.round(applied * item.cost),
    note: note || "",
    at: new Date().toISOString(),
  });
}

export function addItem(input) {
  const item = {
    id: uid("i"),
    name: input.name.trim(),
    category: input.category,
    unit: input.unit,
    stock: round1(input.stock),
    min: round1(input.min),
    cost: Math.round(input.cost),
    supplier: input.supplier.trim(),
    expiry: input.expiry || "",
  };
  state.items.push(item);
  if (item.stock > 0) pushMove(item, "entrada", item.stock, 1, "Cantidad inicial");
  save();
  return item;
}

export function updateItem(id, input) {
  const item = state.items.find((row) => row.id === id);
  if (!item) return null;
  const nextStock = round1(input.stock);
  const diff = round1(nextStock - item.stock);
  item.name = input.name.trim();
  item.category = input.category;
  item.unit = input.unit;
  item.stock = nextStock;
  item.min = round1(input.min);
  item.cost = Math.round(input.cost);
  item.supplier = input.supplier.trim();
  item.expiry = input.expiry || "";
  if (diff !== 0) pushMove(item, "ajuste", Math.abs(diff), diff > 0 ? 1 : -1, "Cambio de cantidad");
  save();
  return item;
}

export function deleteItem(id) {
  const item = state.items.find((row) => row.id === id) || null;
  state.items = state.items.filter((row) => row.id !== id);
  save();
  return item;
}

export function registerMovement({ itemId, type, qty, note, direction }) {
  const item = state.items.find((row) => row.id === itemId);
  if (!item) return { ok: false, error: "Elige un producto" };
  const amount = round1(qty);
  if (!(amount > 0)) return { ok: false, error: "La cantidad debe ser mayor a cero" };
  const sign = type === "entrada" ? 1 : type === "ajuste" ? (direction === "add" ? 1 : -1) : -1;
  if (sign < 0 && item.stock <= 0) return { ok: false, error: "Ya no queda. Anota una entrada primero." };
  const applied = sign < 0 ? round1(Math.min(amount, item.stock)) : amount;
  item.stock = round1(item.stock + sign * applied);
  pushMove(item, type, applied, sign, note);
  save();
  return { ok: true, item, applied };
}

export function adjust(id, direction) {
  const item = state.items.find((row) => row.id === id);
  if (!item) return { ok: false, error: "Ese producto ya no está" };
  return registerMovement({
    itemId: id,
    type: direction > 0 ? "entrada" : "salida",
    qty: stepFor(item.unit),
    note: "Cambio con los botones",
    direction: direction > 0 ? "add" : "sub",
  });
}
