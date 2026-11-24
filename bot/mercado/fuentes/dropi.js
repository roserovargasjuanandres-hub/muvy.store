// Lee costos, precio sugerido y stock desde Dropi con el mismo token de la tienda (DROPI_TOKEN).

const BASE = (process.env.DROPI_API_URL || "https://api.dropi.co/integrations/").replace(/\/?$/, "/");

async function dropi(path, body) {
  const token = (process.env.DROPI_TOKEN || "").trim();
  if (!token) throw new Error("Falta el secreto DROPI_TOKEN");
  const res = await fetch(BASE + path, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      "dropi-integration-key": token,
      "User-Agent": process.env.DROPI_USER_AGENT || "WordPress/6.6.2; https://muvy.shop"
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(30000)
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data || data.isSuccess === false) {
    throw new Error(`Dropi ${path}: HTTP ${res.status} ${JSON.stringify(data?.message || "").slice(0, 150)}`);
  }
  return data;
}

const num = (v) => (v === null || v === undefined || v === "" || Number.isNaN(Number(v)) ? null : Number(v));
const sumStock = (l) => (Array.isArray(l) ? l.reduce((a, w) => a + (Number(w?.stock) || 0), 0) : 0);

export function normalizar(p) {
  const variaciones = Array.isArray(p.variations) ? p.variations : [];
  const stock = variaciones.length
    ? variaciones.reduce((a, v) => a + (Number(v.stock) || sumStock(v.warehouse_product_variation)), 0)
    : Number(p.stock) || sumStock(p.warehouse_product);
  return {
    dropiId: Number(p.id),
    nombre: String(p.name || `Producto ${p.id}`).trim(),
    costo: num(p.sale_price) ?? num(variaciones[0]?.sale_price),
    sugeridoDropi: num(p.suggested_price) ?? num(variaciones[0]?.suggested_price),
    stock,
    categoria: p.categories?.[0]?.name || null,
    proveedor: p.user?.name || p.user?.store_name || null
  };
}

export async function producto(id) {
  const d = await dropi(`products/v2/${id}`);
  return normalizar(d.objects);
}

// Búsqueda en el catálogo de Dropi (la misma que usa el plugin de WooCommerce).
export async function buscar(palabra, cantidad = 30) {
  const d = await dropi("products/index", {
    pageSize: cantidad,
    startData: 0,
    keywords: palabra,
    no_count: true,
    order_by: "id",
    order_type: "desc",
    active: true,
    privated_product: false
  });
  const lista = Array.isArray(d.objects) ? d.objects : Array.isArray(d.objects?.data) ? d.objects.data : [];
  return lista.map(normalizar).filter((p) => p.costo);
}
