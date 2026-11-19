const ATTRS = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';

const PATHS = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  box: '<path d="M3 8l9-4 9 4-9 4-9-4z"/><path d="M3 8v8l9 4 9-4V8"/><path d="M12 12v8"/>',
  swap: '<path d="M7 7h11l-3-3"/><path d="M17 17H6l3 3"/>',
  cart: '<circle cx="9" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/><path d="M3 5h2l2.2 9.2a1 1 0 0 0 1 .8h8.6a1 1 0 0 0 1-.8L20 8H7"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-3.5-3.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  pencil: '<path d="M4 20l4.2-1 10-10a1.8 1.8 0 0 0-2.5-2.5l-10 10L4 20z"/>',
  trash: '<path d="M4 7h16"/><path d="M9 7V5h6v2"/><path d="M8 7l1 12h6l1-12"/>',
  alert: '<path d="M12 4 20 18H4L12 4z"/><path d="M12 10v4M12 16.5h.01"/>',
  ban: '<circle cx="12" cy="12" r="8"/><path d="M8 8l8 8"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/>',
  coins: '<ellipse cx="12" cy="7" rx="7" ry="3"/><path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7"/><path d="M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/>',
  meat: '<path d="M5 14c0-5 4-8 8-8 3 0 5 2 6 4-2 1-3 3-3 5 0 2-2 4-5 4-3 0-6-2-6-5z"/>',
  milk: '<path d="M8 4h8l1 3v13H7V7l1-3z"/><path d="M7 8h10"/>',
  leaf: '<path d="M5 19C5 11 11 5 20 4 19 13 13 19 5 19z"/><path d="M8 16c2-2 4-5 6-8"/>',
  jar: '<path d="M8 8h8v11a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V8z"/><path d="M9 8V5h6v3"/>',
  cup: '<path d="M6 8h10v5a4 4 0 0 1-4 4H9a3 3 0 0 1-3-4V8z"/><path d="M16 9h2a2 2 0 0 1 0 4h-2"/>',
  bottle: '<path d="M10 3h4v3l2 3v11a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V9l2-3V3z"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>',
  refresh: '<path d="M20 12a8 8 0 1 1-2.2-5.5"/><path d="M20 4v5h-5"/>',
  chev: '<path d="M6 9l6 6 6-6"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
};

export function icon(name) {
  return `<svg class="ico" ${ATTRS}>${PATHS[name] || PATHS.box}</svg>`;
}
