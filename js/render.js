import { criticalHtml, donutSvg, weekSvg } from "./charts.js";
import { icon } from "./icons.js";
import {
  CATEGORIES,
  MOVE_TYPES,
  STATUSES,
  UNITS,
  alertDetail,
  alertItems,
  badgeList,
  category,
  categorySlices,
  countWhere,
  criticalItems,
  esc,
  expiryLabel,
  filteredItems,
  filteredMoves,
  flags,
  fmtQty,
  hitItem,
  hitMove,
  inventoryValue,
  longDate,
  money,
  norm,
  moneyShort,
  plainQty,
  purchaseGroups,
  statusLabel,
  stepFor,
  stockTone,
  suggestedQty,
  weekSeries,
  whenLabel,
} from "./model.js";

const NAV = [
  ["dashboard", "Dashboard", "grid"],
  ["insumos", "Insumos", "box"],
  ["movimientos", "Movimientos", "swap"],
  ["compras", "Compras", "cart"],
];

const PAGES = {
  dashboard: ["Hoy en cocina", ""],
  insumos: ["Insumos", "Existencias, mínimos y vencimientos"],
  movimientos: ["Movimientos", "Entradas, salidas, mermas y ajustes"],
  compras: ["Compras", "Pedido sugerido cuando el stock llega al mínimo"],
};

export function htmlShell() {
  return `
    <a class="skip" href="#view">Saltar al contenido</a>
    <div class="layout">
      <aside class="sidebar">
        <div class="brand">
          <img class="logo" src="assets/logo-andalucia.jpg" alt="Andalucía" width="84" height="84">
          <div>
            <p class="brand-kicker">La Mesa · Cundinamarca</p>
            <p class="brand-name">Andalucía</p>
            <p class="brand-sub">Inventario de cocina</p>
          </div>
        </div>
        <nav class="nav" aria-label="Secciones">${navButtons("nav-btn")}</nav>
        <div class="side-foot">
          <button type="button" class="nav-btn quiet" data-action="reset-ask">${icon("refresh")}<span>Restablecer demo</span></button>
          <p class="side-note">Los cambios se guardan en este navegador.</p>
        </div>
      </aside>
      <div class="content">
        <div class="content-inner">
          <header class="topbar">
            <div class="topbar-brand">
              <img class="logo" src="assets/logo-andalucia.jpg" alt="" width="48" height="48">
              <div class="topbar-titles">
                <p class="brand-kicker">La Mesa</p>
                <p class="topbar-title">Andalucía</p>
              </div>
              <button type="button" class="icon-btn mobile-reset" data-action="reset-ask" aria-label="Restablecer demo">${icon("refresh")}</button>
            </div>
            <div class="topbar-tools">
              <label class="search">
                <span class="sr">Buscar</span>
                ${icon("search")}
                <input id="q" type="search" placeholder="Buscar insumo, proveedor o movimiento" autocomplete="off" enterkeyhint="search">
              </label>
              <button type="button" class="btn olive desktop-only" data-action="open-move">${icon("plus")} Registrar</button>
            </div>
          </header>
          <main id="view"></main>
        </div>
      </div>
    </div>
    <nav class="tabbar" aria-label="Secciones">${navButtons("tab-btn")}</nav>
    <button type="button" class="fab" data-action="open-move" aria-label="Registrar">${icon("plus")}</button>
  `;
}

function navButtons(className) {
  return NAV.map(
    ([view, label, name]) => `
      <button type="button" class="${className}" data-action="nav" data-view="${view}">
        ${icon(name)}
        <span>${label}</span>
        ${view === "compras" ? '<span class="pill" data-buy-count hidden></span>' : ""}
      </button>`,
  ).join("");
}

export function htmlView(state) {
  const page = PAGES[state.view];
  const lede = state.view === "dashboard" ? longDate() : page[1];
  const body =
    state.view === "dashboard"
      ? htmlDashboard(state)
      : state.view === "insumos"
        ? htmlItems(state)
        : state.view === "movimientos"
          ? htmlMoves(state)
          : htmlPurchases(state);
  return `
    <div class="page-head">
      <h1>${page[0]}</h1>
      <p class="lede">${esc(lede)}</p>
    </div>
    ${body}`;
}

function htmlDashboard(state) {
  const items = state.items;
  const total = inventoryValue(items);
  const low = countWhere(items, (item) => flags(item).low);
  const out = countWhere(items, (item) => flags(item).out);
  const soon = countWhere(items, (item) => flags(item).soon);
  const slices = categorySlices(items);
  const alerts = alertItems(items).filter((item) => hitItem(item, state.query));
  const recent = [...state.movements].sort((a, b) => b.at.localeCompare(a.at)).filter((move) => hitMove(move, state.query)).slice(0, 6);
  const days = weekSeries(state.movements);
  const kpis = [
    ["all", "Valor del inventario", money(total), total, "money", "coins", "olive", "Ver todo el inventario"],
    ["low", "Stock bajo", String(low), low, "num", "alert", "low", "Ver insumos con stock bajo"],
    ["out", "Agotados", String(out), out, "num", "ban", "out", "Ver insumos agotados"],
    ["soon", "Por vencer", String(soon), soon, "num", "clock", "soon", "Ver insumos por vencer en 7 días"],
  ];
  return `
    <section class="kpis">
      ${kpis
        .map(
          ([status, label, text, count, format, name, tone, aria]) => `
          <button type="button" class="kpi" data-action="filter-status" data-status="${status}" aria-label="${aria}">
            <span class="kpi-icon" style="--tone: var(--${tone})">${icon(name)}</span>
            <span>
              <strong class="kpi-value" data-count="${count}" data-format="${format}">${text}</strong>
              <span class="kpi-label">${label}</span>
            </span>
          </button>`,
        )
        .join("")}
    </section>
    <div class="split">
      <section class="card">
        <div class="card-head"><h2>Valor por categoría</h2></div>
        <div class="donut-layout">
          <div class="donut-wrap">
            ${donutSvg(slices.rows, slices.total)}
            <div class="donut-center"><span>Total</span><strong>${moneyShort(slices.total)}</strong></div>
          </div>
          <ul class="legend">
            ${slices.rows
              .map((slice) => {
                const pct = Math.round((slice.value / slices.total) * 100);
                return `<li><button type="button" data-action="filter-category" data-category="${esc(slice.id)}"><i style="background:${slice.color}"></i><span>${esc(slice.name)}</span><b>${pct}%</b></button></li>`;
              })
              .join("")}
          </ul>
        </div>
      </section>
      <section class="card">
        <div class="card-head"><h2>Alertas</h2><span class="muted">${alerts.length}</span></div>
        ${alerts.length ? `<div class="alerts">${alerts.map(htmlAlert).join("")}</div>` : `<p class="empty">Sin alertas para esta búsqueda.</p>`}
      </section>
    </div>
    <section class="card">
      <div class="card-head"><h2>Stock más crítico</h2><span class="muted">Stock contra mínimo</span></div>
      ${criticalHtml(criticalItems(items))}
      <p class="caption">La marca vertical indica el mínimo.</p>
    </section>
    <div class="split">
      <section class="card">
        <div class="card-head"><h2>Últimos 7 días</h2></div>
        <div class="legend-inline">
          <span><i class="swatch teal"></i>Entradas</span>
          <span><i class="swatch terra"></i>Salidas</span>
        </div>
        ${weekSvg(days)}
        <p class="caption">Cantidad de movimientos. Las mermas y los ajustes se suman al lado que correspondan.</p>
      </section>
      <section class="card">
        <div class="card-head">
          <h2>Últimos movimientos</h2>
          <button type="button" class="text-link" data-action="nav" data-view="movimientos">Ver todos</button>
        </div>
        ${recent.length ? `<div class="moves">${recent.map(htmlMove).join("")}</div>` : `<p class="empty">No hay movimientos para esta búsqueda.</p>`}
      </section>
    </div>`;
}

function htmlAlert(item) {
  return `
    <article class="alert ${stockTone(item)}">
      <div>
        <strong>${esc(item.name)}</strong>
        <p>${esc(alertDetail(item))}</p>
      </div>
      <button type="button" class="btn olive" data-action="reponer" data-id="${esc(item.id)}">Reponer</button>
    </article>`;
}

function htmlItems(state) {
  const items = filteredItems(state);
  const active = state.category !== "all" || state.status !== "all" || state.query;
  return `
    <div class="toolbar">
      <div class="chips" role="group" aria-label="Categorías">
        ${chip("set-category", "all", "Todas", countItems(state, "all", "category"), state.category === "all")}
        ${CATEGORIES.map((cat) => chip("set-category", cat.id, cat.short, countItems(state, cat.id, "category"), state.category === cat.id, cat.color)).join("")}
      </div>
      <div class="chips" role="group" aria-label="Estado">
        ${STATUSES.map((status) => chip("set-status", status.id, status.label, countItems(state, status.id, "status"), state.status === status.id)).join("")}
      </div>
      <div class="toolbar-row">
        <label class="field grow">Orden
          <select id="sort">
            <option value="name" ${state.sort === "name" ? "selected" : ""}>Nombre</option>
            <option value="stock" ${state.sort === "stock" ? "selected" : ""}>Menor stock</option>
            <option value="expiry" ${state.sort === "expiry" ? "selected" : ""}>Vence antes</option>
            <option value="value" ${state.sort === "value" ? "selected" : ""}>Mayor valor</option>
          </select>
        </label>
        <div class="seg" role="group" aria-label="Vista">
          <button type="button" data-action="set-layout" data-layout="table" aria-pressed="${state.layout === "table"}">Tabla</button>
          <button type="button" data-action="set-layout" data-layout="cards" aria-pressed="${state.layout === "cards"}">Tarjetas</button>
        </div>
        <button type="button" class="btn primary" data-action="open-item">${icon("plus")} Nuevo insumo</button>
      </div>
      <p class="result-line">${items.length} insumo${items.length === 1 ? "" : "s"}${active ? ` <button type="button" class="text-link" data-action="clear-filters">Quitar filtros</button>` : ""}</p>
    </div>
    ${items.length ? (state.layout === "cards" ? htmlCards(items, state) : htmlTable(items, state)) : `<p class="empty card">Ningún insumo coincide con estos filtros.</p>`}`;
}

function chip(action, id, label, count, pressed, color) {
  const attr = action === "set-category" ? "category" : "status";
  const style = color ? ` style="--chip:${color}"` : "";
  return `<button type="button" class="chip" data-action="${action}" data-${attr}="${esc(id)}" aria-pressed="${pressed}"${style}>${esc(label)} <span>${count}</span></button>`;
}

function countItems(state, id, kind) {
  return state.items.filter((item) => {
    const categoryOk = kind === "category" ? id === "all" || item.category === id : state.category === "all" || item.category === state.category;
    const statusOk = kind === "status" ? id === "all" || flags(item)[id] : state.status === "all" || flags(item)[state.status];
    return categoryOk && statusOk && hitItem(item, state.query);
  }).length;
}

function htmlTable(items, state) {
  return `
    <div class="sheet is-table">
      <div class="thead"><span>Producto</span><span>Stock</span><span>Costo</span><span>Proveedor</span><span>Vence</span><span></span></div>
      ${items.map((item) => htmlRow(item, state, "table")).join("")}
    </div>`;
}

function htmlCards(items, state) {
  return `<div class="cards">${items.map((item) => htmlRow(item, state, "card")).join("")}</div>`;
}

function htmlRow(item, state, mode) {
  const cat = category(item.category);
  const tone = stockTone(item);
  const pct = item.min > 0 ? Math.max(0, Math.min(100, (item.stock / item.min) * 100)) : item.stock > 0 ? 100 : 0;
  const step = stepFor(item.unit);
  const flash = state.flashId === item.id ? " flash" : "";
  const badges = badgeList(item)
    .map((code) => `<span class="badge ${code}">${statusLabel(code, item)}</span>`)
    .join("");
  const actions = `
    <div class="actions">
      <button type="button" class="icon-btn" data-action="adjust" data-id="${esc(item.id)}" data-sign="-1" aria-label="Restar ${plainQty(step)} ${esc(item.unit)} de ${esc(item.name)}">−</button>
      <button type="button" class="icon-btn" data-action="adjust" data-id="${esc(item.id)}" data-sign="1" aria-label="Sumar ${plainQty(step)} ${esc(item.unit)} a ${esc(item.name)}">+</button>
      <button type="button" class="btn ghost slim" data-action="edit-item" data-id="${esc(item.id)}" aria-label="Editar ${esc(item.name)}">${icon("pencil")}<span>Editar</span></button>
      <button type="button" class="btn ghost slim danger-text" data-action="delete-item" data-id="${esc(item.id)}" aria-label="Eliminar ${esc(item.name)}">${icon("trash")}<span>Eliminar</span></button>
    </div>`;
  if (mode === "card") {
    return `
      <article class="item card-item${flash}" data-id="${esc(item.id)}" style="--stripe:${cat.color}">
        <div class="item-top">${htmlCat(cat)}${badges}</div>
        <h3>${esc(item.name)}</h3>
        <div class="meter ${tone}" aria-hidden="true"><span style="width:${pct}%"></span></div>
        <p class="stock-line">${fmtQty(item.stock)} ${esc(item.unit)} · mín ${fmtQty(item.min)}</p>
        <dl>
          <div><dt>Costo</dt><dd>${money(item.cost)} / ${esc(item.unit)}</dd></div>
          <div><dt>Proveedor</dt><dd>${esc(item.supplier || "Sin proveedor")}</dd></div>
          <div><dt>Vencimiento</dt><dd>${esc(expiryLabel(item))}</dd></div>
        </dl>
        ${actions}
      </article>`;
  }
  return `
    <article class="tr${flash}" data-id="${esc(item.id)}">
      <div class="product">
        <div class="item-top"><strong>${esc(item.name)}</strong>${badges}</div>
        ${htmlCat(cat)}
      </div>
      <div>
        <div class="meter ${tone}" aria-hidden="true"><span style="width:${pct}%"></span></div>
        <p class="stock-line">${fmtQty(item.stock)} ${esc(item.unit)} · mín ${fmtQty(item.min)}</p>
      </div>
      <p><span class="k">Costo</span>${money(item.cost)}</p>
      <p><span class="k">Proveedor</span>${esc(item.supplier || "Sin proveedor")}</p>
      <p><span class="k">Vence</span>${esc(expiryLabel(item))}</p>
      ${actions}
    </article>`;
}

function htmlCat(cat) {
  return `<span class="cat" style="--c:${cat.color}">${icon(cat.icon)}${esc(cat.short)}</span>`;
}

function htmlMoves(state) {
  const moves = filteredMoves(state);
  const options = [...state.items].sort((a, b) => a.name.localeCompare(b.name, "es"));
  return `
    <div class="filters">
      <label class="field">Insumo
        <select id="mov-item">
          <option value="all">Todos</option>
          ${options.map((item) => `<option value="${esc(item.id)}" ${state.movItem === item.id ? "selected" : ""}>${esc(item.name)}</option>`).join("")}
        </select>
      </label>
      <label class="field">Tipo
        <select id="mov-type">
          <option value="all">Todos</option>
          ${MOVE_TYPES.map((type) => `<option value="${type.id}" ${state.movType === type.id ? "selected" : ""}>${type.label}</option>`).join("")}
        </select>
      </label>
      <label class="field">Desde<input id="mov-from" type="date" value="${esc(state.movFrom)}"></label>
      <label class="field">Hasta<input id="mov-to" type="date" value="${esc(state.movTo)}"></label>
    </div>
    <p class="result-line">${moves.length} movimiento${moves.length === 1 ? "" : "s"}</p>
    ${moves.length ? `<div class="moves card">${moves.map(htmlMove).join("")}</div>` : `<p class="empty card">No hay movimientos con estos filtros.</p>`}`;
}

function htmlMove(move) {
  const type = MOVE_TYPES.find((row) => row.id === move.type);
  const sign = move.sign > 0 ? "+" : "−";
  return `
    <article class="move">
      <span class="move-qty ${move.sign > 0 ? "in" : "out"}">${sign} ${fmtQty(move.qty)} ${esc(move.unit || "")}</span>
      <div>
        <strong>${esc(move.itemName)}</strong>
        <p>${esc(type ? type.label : move.type)}${move.note ? ` · ${esc(move.note)}` : ""}</p>
      </div>
      <time datetime="${esc(move.at)}">${esc(whenLabel(move.at))}</time>
    </article>`;
}

function htmlPurchases(state) {
  const groups = purchaseGroups(state.items.filter((item) => hitItem(item, state.query)));
  const total = groups.reduce((sum, group) => sum + group.total, 0);
  const lines = groups.reduce((sum, group) => sum + group.rows.length, 0);
  if (!lines) {
    return `<p class="empty card">No hay insumos por reponer. El stock está por encima del mínimo.</p>`;
  }
  return `
    <section class="card purchase-head">
      <div>
        <h2>${lines} insumo${lines === 1 ? "" : "s"} para pedir</h2>
        <p>Cantidad sugerida: mínimo × 2 − stock. Costo estimado ${money(total)}.</p>
      </div>
      <button type="button" class="btn wa" data-action="copy-order" data-supplier="*">Copiar para WhatsApp</button>
    </section>
    <div class="purchase-list">
      ${groups
        .map(
          (group) => `
          <section class="card">
            <div class="card-head"><h2>${esc(group.supplier)}</h2><span class="muted">${money(group.total)}</span></div>
            ${group.rows
              .map(
                (row) => `
                <article class="buy-row">
                  <div>
                    <strong>${esc(row.name)}</strong>
                    <p>Stock ${fmtQty(row.stock)} ${esc(row.unit)} · mín ${fmtQty(row.min)}</p>
                  </div>
                  <p class="buy-qty">Pedir ${fmtQty(row.suggest)} ${esc(row.unit)}<span>${money(row.estimated)}</span></p>
                </article>`,
              )
              .join("")}
            <button type="button" class="btn ghost" data-action="copy-order" data-supplier="${esc(group.supplier)}">Copiar este pedido</button>
          </section>`,
        )
        .join("")}
    </div>`;
}

function field(id, label, control, error) {
  return `<label class="field ${error ? "has-error" : ""}" for="${id}">${label}${control}${error ? `<span class="err">${esc(error)}</span>` : ""}</label>`;
}

export function htmlItemModal(draft, errors = {}) {
  const more = Boolean(draft.more || draft.supplier || draft.expiry);
  return `
    <form id="item-form" class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal-head">
        <h2 id="modal-title">${draft.id ? "Editar insumo" : "Nuevo insumo"}</h2>
        <button type="button" class="icon-btn" data-action="close-modal" aria-label="Cerrar">${icon("x")}</button>
      </div>
      ${field("f-name", "Nombre", `<input id="f-name" maxlength="80" value="${esc(draft.name)}" placeholder="Ej. Lomo de res">`, errors.name)}
      ${field(
        "f-cat",
        "Categoría",
        `<select id="f-cat">${CATEGORIES.map((cat) => `<option value="${cat.id}" ${draft.category === cat.id ? "selected" : ""}>${esc(cat.name)}</option>`).join("")}</select>`,
        errors.category,
      )}
      ${field(
        "f-unit",
        "Unidad",
        `<select id="f-unit">${UNITS.map((unit) => `<option value="${unit}" ${draft.unit === unit ? "selected" : ""}>${unit}</option>`).join("")}</select>`,
        errors.unit,
      )}
      <div class="grid-2">
        ${field("f-stock", draft.id ? "Stock" : "Stock inicial", `<input id="f-stock" inputmode="decimal" value="${esc(plainQty(draft.stock))}">`, errors.stock)}
        ${field("f-min", "Mínimo", `<input id="f-min" inputmode="decimal" value="${esc(plainQty(draft.min))}">`, errors.min)}
      </div>
      ${field("f-cost", "Costo", `<input id="f-cost" inputmode="numeric" value="${esc(draft.cost ?? "")}" placeholder="Precio por unidad">`, errors.cost)}
      <button type="button" class="more-btn" data-action="toggle-more" aria-expanded="${more ? "true" : "false"}"><span>Más opciones</span>${icon("chev")}</button>
      <div id="more-box" class="more-box" ${more ? "" : "hidden"}>
        ${field("f-supplier", "Proveedor", `<input id="f-supplier" maxlength="80" value="${esc(draft.supplier)}" placeholder="Opcional">`, "")}
        ${field("f-expiry", "Vencimiento", `<input id="f-expiry" type="date" value="${esc(draft.expiry || "")}">`, errors.expiry)}
      </div>
      <div class="modal-actions">
        <button type="button" class="btn ghost" data-action="close-modal">Cancelar</button>
        <button type="submit" class="btn primary">${draft.id ? "Guardar cambios" : "Crear insumo"}</button>
      </div>
    </form>`;
}

export function htmlMoveModal(draft, items) {
  const selected = items.find((item) => item.id === draft.itemId);
  const preview = previewStock(selected, draft);
  return `
    <form id="move-form" class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal-head">
        <h2 id="modal-title">Registrar</h2>
        <button type="button" class="icon-btn" data-action="close-modal" aria-label="Cerrar">${icon("x")}</button>
      </div>
      <div class="field">
        <span>Producto</span>
        ${
          selected
            ? `<div class="picked"><div><strong>${esc(selected.name)}</strong><p>${fmtQty(selected.stock)} ${esc(selected.unit)} disponibles</p></div><button type="button" class="btn ghost slim" data-action="clear-product">Cambiar</button></div>`
            : `<input id="prod-q" placeholder="Buscar producto" value="${esc(draft.query)}" autocomplete="off" autofocus>
               <div id="prod-results" class="results">${htmlProductResults(draft, items)}</div>`
        }
      </div>
      <div class="type-grid" role="group" aria-label="Tipo de movimiento">
        ${MOVE_TYPES.map(
          (type) => `<button type="button" data-action="set-type" data-type="${type.id}" aria-pressed="${draft.type === type.id}">${type.label}</button>`,
        ).join("")}
      </div>
      ${
        draft.type === "ajuste"
          ? `<div class="type-grid two" role="group" aria-label="Dirección del ajuste">
              <button type="button" data-action="set-dir" data-dir="add" aria-pressed="${draft.dir === "add"}">Sumar</button>
              <button type="button" data-action="set-dir" data-dir="sub" aria-pressed="${draft.dir !== "add"}">Restar</button>
            </div>`
          : ""
      }
      <div class="qty-row">
        <button type="button" class="qty-btn" data-action="step-qty" data-delta="-1" aria-label="Disminuir cantidad">−</button>
        <input id="move-qty" inputmode="decimal" value="${esc(plainQty(draft.qty))}" aria-label="Cantidad" ${selected ? "autofocus" : ""}>
        <button type="button" class="qty-btn" data-action="step-qty" data-delta="1" aria-label="Aumentar cantidad">+</button>
      </div>
      <p class="caption center" id="move-preview">${selected ? `${esc(selected.unit)}${preview ? ` · ${esc(preview)}` : ""}` : "Elige el producto, el tipo y la cantidad."}</p>
      <label class="field">Nota (opcional)<input id="move-note" maxlength="140" value="${esc(draft.note)}" placeholder="Ej. servicio de cena"></label>
      <button type="submit" class="btn primary block">Guardar</button>
    </form>`;
}

export function htmlProductResults(draft, items) {
  const q = draft.query.trim();
  const rows = items
    .filter((item) => !q || norm(`${item.name} ${item.supplier}`).includes(norm(q)))
    .sort((a, b) => a.name.localeCompare(b.name, "es"))
    .slice(0, 6);
  if (!rows.length) return `<p class="empty">Sin coincidencias.</p>`;
  return rows
    .map(
      (item) => `<button type="button" data-action="pick-product" data-id="${esc(item.id)}"><span>${esc(item.name)}</span><small>${fmtQty(item.stock)} ${esc(item.unit)}</small></button>`,
    )
    .join("");
}

function previewStock(item, draft) {
  if (!item) return "";
  const raw = String(draft.qty ?? "").trim().replace(",", ".");
  const qty = Number(raw);
  if (!(qty > 0)) return "";
  const sign = draft.type === "entrada" || (draft.type === "ajuste" && draft.dir === "add") ? 1 : -1;
  const next = sign < 0 ? Math.max(0, roundSafe(item.stock - Math.min(qty, item.stock))) : roundSafe(item.stock + qty);
  return `Quedaría en ${fmtQty(next)} ${item.unit}`;
}

function roundSafe(n) {
  return Math.round((n + Number.EPSILON) * 10) / 10;
}

export function htmlConfirm({ title, text, confirm, tone }) {
  return `
    <div class="modal confirm" role="alertdialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-text">
      <h2 id="modal-title">${esc(title)}</h2>
      <p id="modal-text">${esc(text)}</p>
      <div class="modal-actions">
        <button type="button" class="btn ghost" data-action="close-modal">Cancelar</button>
        <button type="button" class="btn ${tone || "danger"}" data-action="confirm-ok">${esc(confirm)}</button>
      </div>
    </div>`;
}
