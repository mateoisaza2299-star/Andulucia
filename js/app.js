import {
  htmlConfirm,
  htmlItemModal,
  htmlMoveModal,
  htmlProductResults,
  htmlShell,
  htmlView,
} from "./render.js";
import {
  CATEGORIES,
  UNITS,
  hitItem,
  money,
  orderText,
  parseNum,
  plainQty,
  purchaseGroups,
  round1,
  stepFor,
  suggestedQty,
} from "./model.js";
import { addItem, adjust, boot, deleteItem, registerMovement, resetDemo, state, updateItem } from "./store.js";

let modal = null;
let flashTimer = 0;

boot();
state.layout = window.innerWidth >= 1100 ? "table" : "cards";
document.getElementById("app").innerHTML = htmlShell();
bind();
render();
setupLogos();

function bind() {
  document.addEventListener("click", onClick);
  document.addEventListener("change", onChange);
  document.addEventListener("submit", onSubmit);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal) closeModal();
  });
  document.addEventListener("input", (event) => {
    if (event.target.id !== "prod-q" || modal?.kind !== "move") return;
    modal.draft.query = event.target.value;
    const box = document.getElementById("prod-results");
    if (box) box.innerHTML = htmlProductResults(modal.draft, state.items);
  });
  const search = document.getElementById("q");
  search.addEventListener("input", () => {
    state.query = search.value;
    render();
  });
  search.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    state.view = "insumos";
    render({ scroll: true });
  });
  const tip = document.getElementById("tip");
  document.addEventListener("pointerover", (event) => {
    const seg = event.target.closest?.("[data-tip]");
    if (!seg) return;
    tip.textContent = seg.dataset.tip;
    tip.hidden = false;
    placeTip(event);
  });
  document.addEventListener("pointermove", (event) => {
    if (!tip.hidden) placeTip(event);
  });
  document.addEventListener("pointerout", (event) => {
    if (event.target.closest?.("[data-tip]")) tip.hidden = true;
  });
}

function render({ scroll = false } = {}) {
  document.getElementById("view").innerHTML = htmlView(state);
  const buying = state.items.filter((item) => item.stock <= item.min).length;
  document.querySelectorAll("[data-buy-count]").forEach((el) => {
    el.textContent = buying ? String(buying) : "";
    el.hidden = !buying;
  });
  document.querySelectorAll("[data-action='nav']").forEach((el) => {
    if (el.dataset.view === state.view) el.setAttribute("aria-current", "page");
    else el.removeAttribute("aria-current");
  });
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) animateKpis();
  if (scroll) window.scrollTo(0, 0);
}

function animateKpis() {
  document.querySelectorAll("[data-count]").forEach((el) => {
    const target = Number(el.dataset.count) || 0;
    const moneyMode = el.dataset.format === "money";
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / 680);
      const value = target * (1 - (1 - progress) ** 3);
      el.textContent = moneyMode ? money(value) : String(Math.round(value));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

function onClick(event) {
  if (event.target.classList?.contains("modal-back")) {
    closeModal();
    return;
  }
  const el = event.target.closest?.("[data-action]");
  if (!el) return;
  const action = el.dataset.action;
  if (action === "nav") {
    state.view = el.dataset.view;
    render({ scroll: true });
  } else if (action === "filter-status") {
    state.status = el.dataset.status;
    state.category = "all";
    state.view = "insumos";
    render({ scroll: true });
  } else if (action === "filter-category") {
    state.category = el.dataset.category;
    state.status = "all";
    state.view = "insumos";
    render({ scroll: true });
  } else if (action === "set-category") {
    state.category = el.dataset.category;
    render();
  } else if (action === "set-status") {
    state.status = el.dataset.status;
    render();
  } else if (action === "set-layout") {
    state.layout = el.dataset.layout;
    render();
  } else if (action === "clear-filters") {
    state.category = "all";
    state.status = "all";
    state.query = "";
    document.getElementById("q").value = "";
    render();
  } else if (action === "open-item") {
    openItem();
  } else if (action === "edit-item") {
    openItem(el.dataset.id);
  } else if (action === "delete-item") {
    askDelete(el.dataset.id);
  } else if (action === "adjust") {
    const result = adjust(el.dataset.id, Number(el.dataset.sign));
    if (!result.ok) toast(result.error);
    render();
  } else if (action === "open-move") {
    openMove();
  } else if (action === "reponer") {
    const item = state.items.find((row) => row.id === el.dataset.id);
    if (item) openMove({ itemId: item.id, type: "entrada", qty: suggestedQty(item) });
  } else if (action === "close-modal") {
    closeModal();
  } else if (action === "toggle-more") {
    const box = document.getElementById("more-box");
    const willOpen = box.hidden;
    box.hidden = !willOpen;
    el.setAttribute("aria-expanded", String(willOpen));
    modal.draft.more = willOpen;
  } else if (action === "confirm-ok") {
    modal?.onConfirm?.();
  } else if (action === "reset-ask") {
    askReset();
  } else if (action === "copy-order") {
    copyOrder(el.dataset.supplier);
  } else if (action === "set-type") {
    readMove();
    modal.draft.type = el.dataset.type;
    renderModal();
  } else if (action === "set-dir") {
    readMove();
    modal.draft.dir = el.dataset.dir;
    renderModal();
  } else if (action === "step-qty") {
    readMove();
    const item = state.items.find((row) => row.id === modal.draft.itemId);
    const step = item ? stepFor(item.unit) : 1;
    const current = parseNum(modal.draft.qty) ?? step;
    modal.draft.qty = round1(Math.max(step, current + Number(el.dataset.delta) * step));
    renderModal();
  } else if (action === "pick-product") {
    readMove();
    modal.draft.itemId = el.dataset.id;
    renderModal();
  } else if (action === "clear-product") {
    readMove();
    modal.draft.itemId = "";
    modal.draft.query = "";
    renderModal();
  }
}

function onChange(event) {
  const target = event.target;
  if (target.id === "sort") state.sort = target.value;
  else if (target.id === "mov-item") state.movItem = target.value;
  else if (target.id === "mov-type") state.movType = target.value;
  else if (target.id === "mov-from") state.movFrom = target.value;
  else if (target.id === "mov-to") state.movTo = target.value;
  else return;
  render();
}

function onSubmit(event) {
  if (event.target.id === "item-form") {
    event.preventDefault();
    saveItem();
  }
  if (event.target.id === "move-form") {
    event.preventDefault();
    saveMove();
  }
}

function openItem(id) {
  if (id) {
    const item = state.items.find((row) => row.id === id);
    if (!item) return;
    modal = { kind: "item", draft: { ...item, more: Boolean(item.supplier || item.expiry) }, errors: {} };
  } else {
    modal = {
      kind: "item",
      draft: { name: "", category: "carnes", unit: "kg", stock: "", min: "", cost: "", supplier: "", expiry: "", more: false },
      errors: {},
    };
  }
  renderModal();
}

function saveItem() {
  const raw = readItem();
  const errors = {};
  if (!raw.name.trim()) errors.name = "Escribe el nombre del producto.";
  if (!CATEGORIES.some((cat) => cat.id === raw.category)) errors.category = "Elige una categoría.";
  if (!UNITS.includes(raw.unit)) errors.unit = "Elige la unidad.";
  const stock = parseNum(raw.stock);
  const min = parseNum(raw.min);
  const cost = parseNum(raw.cost);
  if (stock === null || stock < 0) errors.stock = "Escribe la cantidad con un número desde cero.";
  if (min === null || min < 0) errors.min = "Escribe con cuánto hay que avisar, desde cero.";
  if (cost === null || cost < 0) errors.cost = "Escribe el precio de compra, desde cero.";
  if (raw.expiry && !/^\d{4}-\d{2}-\d{2}$/.test(raw.expiry)) errors.expiry = "Revisa la fecha de vencimiento.";
  if (Object.keys(errors).length) {
    modal.draft = { ...modal.draft, ...raw };
    modal.errors = errors;
    renderModal();
    return;
  }
  const value = { ...raw, stock, min, cost };
  if (modal.draft.id) {
    updateItem(modal.draft.id, value);
    closeModal();
    render();
    toast("Cambios guardados");
    return;
  }
  const item = addItem(value);
  state.view = "insumos";
  state.category = "all";
  state.status = "all";
  state.query = "";
  document.getElementById("q").value = "";
  state.flashId = item.id;
  closeModal();
  render();
  toast("Producto agregado");
  armFlash(item.id);
}

function readItem() {
  const more = document.getElementById("more-box");
  return {
    name: valueOf("f-name"),
    category: valueOf("f-cat"),
    unit: valueOf("f-unit"),
    stock: valueOf("f-stock"),
    min: valueOf("f-min"),
    cost: valueOf("f-cost"),
    supplier: valueOf("f-supplier"),
    expiry: valueOf("f-expiry"),
    more: more ? !more.hidden : false,
  };
}

function askDelete(id) {
  const item = state.items.find((row) => row.id === id);
  if (!item) return;
  modal = {
    kind: "confirm",
    title: "Eliminar producto",
    text: `Vas a borrar ${item.name}. No se puede deshacer.`,
    confirm: "Eliminar",
    tone: "danger",
    onConfirm: () => {
      if (state.movItem === id) state.movItem = "all";
      deleteItem(id);
      closeModal();
      render();
      toast("Producto eliminado");
    },
  };
  renderModal();
}

function openMove(preset = {}) {
  modal = {
    kind: "move",
    draft: {
      itemId: preset.itemId || "",
      query: "",
      type: preset.type || "entrada",
      qty: preset.qty ?? 1,
      dir: "sub",
      note: "",
    },
  };
  renderModal();
}

function readMove() {
  if (modal?.kind !== "move") return;
  const note = document.getElementById("move-note");
  const qty = document.getElementById("move-qty");
  const query = document.getElementById("prod-q");
  if (note) modal.draft.note = note.value;
  if (qty) modal.draft.qty = qty.value;
  if (query) modal.draft.query = query.value;
}

function saveMove() {
  readMove();
  const draft = modal.draft;
  const result = registerMovement({
    itemId: draft.itemId,
    type: draft.type,
    qty: parseNum(draft.qty),
    note: draft.note.trim(),
    direction: draft.dir,
  });
  if (!result.ok) {
    toast(result.error);
    return;
  }
  const labels = {
    entrada: "Anotamos la entrada",
    salida: "Anotamos la salida",
    merma: "Anotamos lo que se dañó",
    ajuste: "Anotamos la corrección",
  };
  const message = labels[draft.type] || "Anotación guardada";
  closeModal();
  render();
  toast(message);
}

function askReset() {
  modal = {
    kind: "confirm",
    title: "Volver a los datos de ejemplo",
    text: "Se borran tus cambios en este navegador y vuelven los 30 productos de ejemplo. No se puede deshacer.",
    confirm: "Volver a los datos",
    tone: "olive",
    onConfirm: () => {
      resetDemo();
      state.category = "all";
      state.status = "all";
      state.query = "";
      state.sort = "name";
      state.movItem = "all";
      state.movType = "all";
      state.movFrom = "";
      state.movTo = "";
      state.flashId = "";
      document.getElementById("q").value = "";
      closeModal();
      render();
      toast("Volvieron los datos de ejemplo");
    },
  };
  renderModal();
}

function copyOrder(supplier) {
  const groups = purchaseGroups(state.items.filter((item) => hitItem(item, state.query)));
  const chosen = supplier === "*" ? groups : groups.filter((group) => group.supplier === supplier);
  if (!chosen.length) {
    toast("No hay nada para copiar");
    return;
  }
  copyText(orderText(chosen));
}

async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      toast("Pedido copiado para WhatsApp");
      return;
    }
  } catch {
    /* sigue el respaldo */
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  const ok = document.execCommand("copy");
  area.remove();
  toast(ok ? "Pedido copiado para WhatsApp" : "No se pudo copiar");
}

function renderModal() {
  const root = document.getElementById("modal-root");
  if (!modal) {
    root.innerHTML = "";
    document.body.classList.remove("modal-open");
    return;
  }
  document.body.classList.add("modal-open");
  const inner =
    modal.kind === "item"
      ? htmlItemModal(modal.draft, modal.errors)
      : modal.kind === "move"
        ? htmlMoveModal(modal.draft, state.items)
        : htmlConfirm(modal);
  root.innerHTML = `<div class="modal-back">${inner}</div>`;
  const bad = root.querySelector(".has-error input, .has-error select");
  const focus = bad || root.querySelector("[autofocus], input, select, button");
  focus?.focus();
}

function closeModal() {
  modal = null;
  renderModal();
}

function valueOf(id) {
  return document.getElementById(id)?.value ?? "";
}

function toast(message) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  document.getElementById("toasts").appendChild(el);
  setTimeout(() => el.remove(), 2800);
}

function armFlash(id) {
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => {
    if (state.flashId !== id) return;
    state.flashId = "";
    document.querySelector(`[data-id="${CSS.escape(id)}"]`)?.classList.remove("flash");
  }, 1600);
}

function placeTip(event) {
  const tip = document.getElementById("tip");
  const width = tip.offsetWidth;
  const height = tip.offsetHeight;
  let x = event.clientX + 14;
  let y = event.clientY + 14;
  if (x + width > window.innerWidth - 8) x = event.clientX - width - 14;
  if (y + height > window.innerHeight - 8) y = event.clientY - height - 14;
  tip.style.left = `${Math.max(8, x)}px`;
  tip.style.top = `${Math.max(8, y)}px`;
}

function setupLogos() {
  let painted = false;
  document.querySelectorAll(".logo").forEach((img) => {
    const show = () => {
      if (!painted) {
        painted = true;
        applyPalette(img);
      }
    };
    const fail = () => {
      const mark = document.createElement("span");
      mark.className = "logo-fallback";
      mark.setAttribute("aria-hidden", "true");
      mark.textContent = "A";
      img.replaceWith(mark);
    };
    if (img.complete && img.naturalWidth) show();
    else {
      img.addEventListener("load", show, { once: true });
      img.addEventListener("error", fail, { once: true });
    }
  });
}

function applyPalette(img) {
  try {
    const size = 48;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);
    const buckets = { olive: [], sunflower: [], cream: [], terracotta: [], teal: [] };
    for (let i = 0; i < data.length; i += 4) {
      const pixel = [data[i], data[i + 1], data[i + 2]];
      if (data[i + 3] < 220) continue;
      const hsl = rgbToHsl(...pixel);
      if (hsl.l > 0.86 && hsl.s < 0.45) buckets.cream.push(pixel);
      else if (hsl.h >= 38 && hsl.h <= 62 && hsl.s > 0.35 && hsl.l > 0.35 && hsl.l < 0.78) buckets.sunflower.push(pixel);
      else if (hsl.h >= 8 && hsl.h <= 32 && hsl.s > 0.35 && hsl.l > 0.28 && hsl.l < 0.62) buckets.terracotta.push(pixel);
      else if (hsl.h >= 155 && hsl.h <= 190 && hsl.s > 0.25 && hsl.l > 0.18 && hsl.l < 0.55) buckets.teal.push(pixel);
      else if (hsl.h >= 70 && hsl.h <= 150 && hsl.l < 0.42 && hsl.s > 0.12) buckets.olive.push(pixel);
    }
    const root = document.documentElement.style;
    const olive = average(buckets.olive);
    const cream = average(buckets.cream);
    if (olive && rgbToHsl(...olive).l < 0.45) {
      root.setProperty("--olive", rgb(olive));
      root.setProperty("--olive-deep", rgb(shade(olive, 0.62)));
      root.setProperty("--olive-soft", rgb(shade(olive, 1.35)));
    }
    if (cream && rgbToHsl(...cream).l > 0.88) root.setProperty("--cream", rgb(cream));
    const sunflower = average(buckets.sunflower);
    const terracotta = average(buckets.terracotta);
    const teal = average(buckets.teal);
    if (sunflower) root.setProperty("--sunflower", rgb(sunflower));
    if (terracotta) root.setProperty("--terracotta", rgb(terracotta));
    if (teal) root.setProperty("--teal", rgb(teal));
  } catch {
    /* conserva la paleta declarada en CSS */
  }
}

function average(pixels) {
  if (pixels.length < 12) return null;
  const sum = pixels.reduce((acc, pixel) => [acc[0] + pixel[0], acc[1] + pixel[1], acc[2] + pixel[2]], [0, 0, 0]);
  return sum.map((channel) => Math.round(channel / pixels.length));
}

function shade(pixel, amount) {
  return pixel.map((channel) => Math.max(0, Math.min(255, Math.round(channel * amount))));
}

function rgb(pixel) {
  return `rgb(${pixel[0]} ${pixel[1]} ${pixel[2]})`;
}

function rgbToHsl(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return { h: h * 60, s, l };
}
