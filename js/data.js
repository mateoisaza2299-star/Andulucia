import { isoAt, round1, ymdFromOffset } from "./model.js";

const ROTATION = [
  "Lomo de res",
  "Pechuga de pollo",
  "Crema de leche",
  "Spaghetti",
  "Gaseosa Coca-Cola",
  "Cerveza Club Colombia",
  "Mix de lechugas",
  "Aceite de oliva",
  "Tomate chonto",
  "Vino tinto de la casa",
  "Costilla de cerdo",
  "Queso parmesano",
  "Arroz arborio",
  "Agua con gas",
  "Servilletas",
  "Aguacate Hass",
];

const SCRIPT = [
  ["entrada", "salida", "salida", "merma"],
  ["salida", "salida", "salida"],
  ["entrada", "salida", "salida"],
  ["salida", "salida", "ajuste"],
  ["entrada", "salida", "merma", "salida"],
  ["salida", "salida"],
  ["entrada", "salida", "salida", "salida"],
  ["entrada", "salida", "salida"],
  ["salida", "salida"],
  ["entrada", "salida", "merma"],
  ["salida", "salida", "ajuste"],
  ["entrada", "salida"],
  ["salida", "salida"],
  ["entrada", "salida"],
];

const NOTES = {
  entrada: ["Compra semanal", "Reposición de proveedor", "Pedido de cocina"],
  salida: ["Servicio de almuerzo", "Servicio de cena", "Evento en el salón", "Pedido para llevar"],
  merma: ["Merma de preparación", "Producto dañado"],
  ajuste: ["Conteo de cierre"],
};

const HOURS = [8, 12, 15, 19];

function qtyFor(item, n) {
  if (item.unit === "kg") return round1(0.3 + (n % 4) * 0.3);
  if (item.unit === "L") return round1(0.5 + (n % 3) * 0.5);
  if (item.unit === "und") return 2 + (n % 5) * 2;
  return 1;
}

function item(row) {
  const [id, name, category, unit, stock, min, cost, supplier, expiryOffset] = row;
  return {
    id,
    name,
    category,
    unit,
    stock,
    min,
    cost,
    supplier,
    expiry: expiryOffset === null ? "" : ymdFromOffset(expiryOffset),
  };
}

function buildItems() {
  return [
    item(["i01", "Lomo de res", "carnes", "kg", 6.5, 3, 48000, "Carnes La Mesa", 14]),
    item(["i02", "Pechuga de pollo", "carnes", "kg", 2.4, 5, 15200, "Avícola Sumapaz", 11]),
    item(["i03", "Costilla de cerdo", "carnes", "kg", 4, 2, 19800, "Carnes La Mesa", 12]),
    item(["i04", "Camarón pelado", "carnes", "kg", 1.6, 1, 56000, "Pescadería del Río", 9]),
    item(["i05", "Chorizo santandereano", "carnes", "kg", 2.8, 1.5, 24000, "Carnes La Mesa", 20]),
    item(["i06", "Crema de leche", "lacteos", "L", 5, 2, 9800, "Lácteos de La Mesa", 3]),
    item(["i07", "Queso parmesano", "lacteos", "kg", 0.6, 1.2, 76000, "Lácteos de La Mesa", 45]),
    item(["i08", "Mantequilla sin sal", "lacteos", "kg", 1.8, 0.8, 28000, "Lácteos de La Mesa", 16]),
    item(["i09", "Queso mozzarella", "lacteos", "kg", 2.2, 1, 26000, "Lácteos de La Mesa", 13]),
    item(["i10", "Mix de lechugas", "verduras", "kg", 2.5, 1.2, 7200, "Huerta de La Mesa", 2]),
    item(["i11", "Tomate chonto", "verduras", "kg", 7, 3, 3400, "Huerta de La Mesa", 9]),
    item(["i12", "Cebolla blanca", "verduras", "kg", 4, 2, 2600, "Huerta de La Mesa", 15]),
    item(["i13", "Aguacate Hass", "verduras", "kg", 3.5, 1.5, 9200, "Huerta de La Mesa", 10]),
    item(["i14", "Limón Tahití", "verduras", "kg", 2.5, 1, 4100, "Huerta de La Mesa", 12]),
    item(["i15", "Spaghetti", "despensa", "kg", 6, 2, 6800, "Despensa Gourmet", 200]),
    item(["i16", "Aceite de oliva", "despensa", "L", 0.9, 2, 46000, "Despensa Gourmet", 240]),
    item(["i17", "Arroz arborio", "despensa", "kg", 5, 2, 11200, "Despensa Gourmet", 180]),
    item(["i18", "Harina de trigo", "despensa", "kg", 8, 3, 3600, "Despensa Gourmet", 150]),
    item(["i19", "Sal marina", "despensa", "kg", 3, 1, 2900, "Despensa Gourmet", 400]),
    item(["i20", "Gaseosa Coca-Cola", "bebidas", "und", 24, 12, 3800, "Bebidas Andinas", 120]),
    item(["i21", "Gaseosa Colombiana", "bebidas", "und", 16, 12, 3400, "Bebidas Andinas", 110]),
    item(["i22", "Jugo de naranja", "bebidas", "L", 6, 3, 7900, "Bebidas Andinas", 10]),
    item(["i23", "Agua con gas", "bebidas", "und", 0, 18, 2300, "Bebidas Andinas", 150]),
    item(["i24", "Cerveza Club Colombia", "licores", "und", 8, 24, 4200, "Distribuidora La Mesa", 70]),
    item(["i25", "Cerveza artesanal", "licores", "und", 12, 6, 8500, "Distribuidora La Mesa", 25]),
    item(["i26", "Vino tinto de la casa", "licores", "und", 7, 3, 42000, "Distribuidora La Mesa", 500]),
    item(["i27", "Aguardiente Antioqueño", "licores", "und", 3, 2, 48000, "Distribuidora La Mesa", 600]),
    item(["i28", "Servilletas", "aseo", "paq", 0, 8, 7200, "Aseo del Centro", null]),
    item(["i29", "Bolsas de basura", "aseo", "paq", 5, 2, 9400, "Aseo del Centro", null]),
    item(["i30", "Detergente lavaloza", "aseo", "L", 3, 1.5, 12500, "Aseo del Centro", null]),
  ];
}

export function createSeed() {
  const items = buildItems();
  const byName = Object.fromEntries(items.map((row) => [row.name, row]));
  const rotation = ROTATION.map((name) => byName[name]);
  const movements = [];
  let n = 0;
  SCRIPT.forEach((types, day) => {
    types.forEach((type, index) => {
      const row = rotation[n % rotation.length];
      const qty = qtyFor(row, n);
      const sign = type === "entrada" ? 1 : type === "ajuste" ? (day % 2 === 0 ? -1 : 1) : -1;
      movements.push({
        id: `m${String(n + 1).padStart(2, "0")}`,
        itemId: row.id,
        itemName: row.name,
        unit: row.unit,
        type,
        qty,
        sign,
        value: Math.round(qty * row.cost),
        note: NOTES[type][n % NOTES[type].length],
        at: isoAt(day, HOURS[index % HOURS.length]),
      });
      n += 1;
    });
  });
  movements.sort((a, b) => b.at.localeCompare(a.at));
  return { items, movements };
}
