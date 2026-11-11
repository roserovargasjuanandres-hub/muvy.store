// Cliente de la API de integraciones de Dropi (la misma que usa el plugin oficial de WooCommerce).
// El token se crea en Dropi → Mis tiendas, y se guarda en Cloudflare como secreto DROPI_TOKEN.

const IMG_BASE = "https://d39ru7awumhhs2.cloudfront.net/";

export class DropiError extends Error {
  constructor(msg, status = 502) { super(msg); this.status = status; }
}

export function dropiBase(env) {
  return (env.DROPI_API_URL || "https://api.dropi.co/integrations/").replace(/\/?$/, "/");
}

export async function dropi(env, path, body) {
  if (!env.DROPI_TOKEN) throw new DropiError("La tienda aún no está conectada a Dropi (falta DROPI_TOKEN).", 503);
  let res;
  try {
    res = await fetch(dropiBase(env) + path, {
      method: body === undefined ? "GET" : "POST",
      headers: { "Content-Type": "application/json;charset=UTF-8", "dropi-integration-key": env.DROPI_TOKEN },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(25000)
    });
  } catch (e) {
    throw new DropiError("No pudimos conectar con Dropi. Intenta de nuevo en un momento.");
  }
  const data = await res.json().catch(() => null);
  if (res.status === 401 || res.status === 403) throw new DropiError("Dropi rechazó el token de la tienda.", 502);
  if (!res.ok || !data || data.isSuccess === false) {
    const msg = data?.message || data?.error || `Dropi respondió ${res.status}`;
    throw new DropiError(typeof msg === "string" ? msg : JSON.stringify(msg).slice(0, 200));
  }
  return data;
}

const num = (v) => (v === null || v === undefined || v === "" || Number.isNaN(Number(v)) ? null : Number(v));
const sumStock = (list) => (Array.isArray(list) ? list.reduce((a, w) => a + (Number(w?.stock) || 0), 0) : 0);

function imageUrl(g) {
  const raw = g?.urlS3 || g?.url || "";
  if (!raw) return null;
  if (/^https?:\/\//.test(raw)) return raw;
  return IMG_BASE + raw.split("/").map((s) => encodeURIComponent(decodeURIComponent(s))).join("/");
}

function plainText(html) {
  return String(html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|div|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 2000);
}

function attrsOf(v) {
  const list = Array.isArray(v?.attribute_values) ? v.attribute_values : Array.isArray(v?.attributes) ? v.attributes : [];
  const out = {};
  list.forEach((a, i) => {
    const name = a?.attribute?.description || a?.attribute?.name || a?.attribute_name || a?.name || `Opción ${i + 1}`;
    const value = a?.value ?? a?.attribute_value ?? "";
    if (value !== "") out[String(name).trim()] = String(value).trim();
  });
  return out;
}

const round100 = (n) => Math.round(n / 100) * 100;

// Convierte la respuesta de Dropi al formato que usa la tienda.
export function mapProduct(p, entry, markup) {
  const retail = (salePrice, suggested) => {
    if (entry.price) return entry.price;
    if (suggested && salePrice && suggested >= salePrice) return suggested;
    if (suggested && !salePrice) return suggested;
    return salePrice ? round100(salePrice * markup) : null;
  };
  const productSale = num(p.sale_price);
  const productSuggested = num(p.suggested_price);
  const variations = (Array.isArray(p.variations) ? p.variations : []).map((v) => {
    const attrs = attrsOf(v);
    const sale = num(v.sale_price) ?? productSale;
    const suggested = num(v.suggested_price) ?? productSuggested;
    return {
      id: Number(v.id),
      attrs,
      label: Object.values(attrs).join(" / ") || v.sku || `Opción ${v.id}`,
      stock: Number(v.stock) || (v.warehouse_product_variation ? sumStock(v.warehouse_product_variation) : 0),
      price: retail(sale, suggested)
    };
  }).filter((v) => v.price);
  const isVariable = String(p.type || "").toUpperCase() === "VARIABLE" || variations.length > 0;
  const stock = isVariable
    ? variations.reduce((a, v) => a + (v.stock || 0), 0)
    : Number(p.stock) || (p.warehouse_product ? sumStock(p.warehouse_product) : 0);
  const prices = isVariable ? variations.filter((v) => v.stock > 0).map((v) => v.price) : [retail(productSale, productSuggested)];
  const images = (Array.isArray(p.gallery) ? p.gallery : []).map(imageUrl).filter(Boolean);
  return {
    id: String(p.id),
    dropiId: Number(p.id),
    name: entry.name || String(p.name || `Producto ${p.id}`),
    category: entry.category || "Hogar",
    featured: Boolean(entry.featured),
    description: plainText(p.description) || "",
    images,
    image: images[0] || null,
    type: isVariable ? "VARIABLE" : "SIMPLE",
    price: prices.length ? Math.min(...prices.filter(Boolean)) : null,
    stock,
    inStock: stock > 0,
    variations,
    supplierId: num(p.user_id) ?? num(p.user?.id)
  };
}

export async function getDropiProduct(env, id) {
  const d = await dropi(env, `products/v2/${id}`);
  if (!d.objects) throw new DropiError("Ese producto ya no está disponible en Dropi.", 404);
  return d.objects;
}

// Códigos de departamento que espera Dropi Colombia en los pedidos (los del plugin oficial).
export const DEPARTMENTS = {
  AMZ: "Amazonas", ANT: "Antioquia", ARU: "Arauca", ATL: "Atlántico", BOL: "Bolívar", BOY: "Boyacá",
  CAL: "Caldas", CAQ: "Caquetá", CAS: "Casanare", CAU: "Cauca", CES: "Cesar", CHOC: "Chocó",
  COR: "Córdoba", CUN: "Cundinamarca / Bogotá", GUA: "Guainía", GUV: "Guaviare", HUI: "Huila",
  GUJ: "La Guajira", MAG: "Magdalena", MET: "Meta", NAR: "Nariño", NOR: "Norte de Santander",
  PUT: "Putumayo", QUI: "Quindío", RIS: "Risaralda", SAP: "San Andrés y Providencia", SAN: "Santander",
  SUC: "Sucre", TOL: "Tolima", VAC: "Valle del Cauca", VAU: "Vaupés", VIC: "Vichada"
};

export async function createDropiOrder(env, payload) {
  const d = await dropi(env, "orders/myorders", payload);
  return d.objects?.id ?? null;
}
