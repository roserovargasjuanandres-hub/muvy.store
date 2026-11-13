import { CATALOG, DEFAULT_MARKUP, lineTotal } from "./catalog.js";
import { DropiError, getDropiProduct, mapProduct, createDropiOrder, DEPARTMENTS } from "./dropi.js";

const CACHE_SECONDS = 900; // los datos de Dropi se refrescan cada 15 minutos

const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extra }
  });

// Lee un producto de Dropi, con caché para no consultar Dropi en cada visita.
// Se guarda además una copia de respaldo (24 h) que se usa si Dropi no responde o limita las consultas.
async function loadProduct(env, ctx, entry, { fresh = false } = {}) {
  const cache = caches.default;
  const key = new Request(`https://cache.muvy.internal/product/${entry.dropiId}`);
  const backupKey = new Request(`https://cache.muvy.internal/backup/${entry.dropiId}`);
  if (!fresh) {
    const hit = await cache.match(key);
    if (hit) return mapProduct(await hit.json(), entry, DEFAULT_MARKUP);
  }
  let raw;
  try {
    // Si Dropi limita las consultas ("Too Many Attempts"), espera un poco y reintenta.
    for (let attempt = 0; ; attempt++) {
      try { raw = await getDropiProduct(env, entry.dropiId); break; }
      catch (e) {
        if (attempt >= 3 || !/too many/i.test(e?.message || "")) throw e;
        await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
      }
    }
  } catch (e) {
    const backup = await cache.match(backupKey);
    if (backup && !fresh) return mapProduct(await backup.json(), entry, DEFAULT_MARKUP);
    throw e;
  }
  const body = JSON.stringify(raw);
  ctx.waitUntil(Promise.all([
    cache.put(key, new Response(body, { headers: { "content-type": "application/json", "cache-control": `max-age=${CACHE_SECONDS}` } })),
    cache.put(backupKey, new Response(body, { headers: { "content-type": "application/json", "cache-control": "max-age=86400" } }))
  ]));
  return mapProduct(raw, entry, DEFAULT_MARKUP);
}

// Consulta Dropi de a pocos productos a la vez para no superar su límite.
async function inBatches(items, size, fn) {
  const out = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(...await Promise.allSettled(items.slice(i, i + size).map(fn)));
  }
  return out;
}

async function loadCatalog(env, ctx) {
  const results = await inBatches(CATALOG, 3, (e) => loadProduct(env, ctx, e));
  const products = [];
  const errors = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled" && r.value.price) products.push(r.value);
    else errors.push({ dropiId: CATALOG[i].dropiId, error: r.reason?.message || "sin precio" });
  });
  if (!products.length && errors.length) {
    const first = results.find((r) => r.status === "rejected");
    throw first?.reason instanceof DropiError ? first.reason : new DropiError(errors[0].error);
  }
  return { products, errors };
}

const publicProduct = ({ supplierId, ...p }) => p;

// Protección simple contra envíos repetidos desde la misma IP.
async function tooManyOrders(request) {
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const key = new Request(`https://cache.muvy.internal/rate/${encodeURIComponent(ip)}`);
  const hit = await caches.default.match(key);
  const count = hit ? Number(await hit.text()) || 0 : 0;
  if (count >= 5) return true;
  await caches.default.put(key, new Response(String(count + 1), { headers: { "cache-control": "max-age=1800" } }));
  return false;
}

const clean = (v, max = 200) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);

async function createOrder(request, env, ctx) {
  let body;
  try { body = await request.json(); } catch { return json({ error: "Pedido inválido." }, 400); }
  if (body.website) return json({ ok: true, orders: [] }); // campo trampa para bots

  const c = body.customer || {};
  const customer = {
    nombre: clean(c.nombre, 80),
    telefono: clean(c.telefono, 20).replace(/\D/g, "").replace(/^57(?=3\d{9}$)/, ""),
    departamento: clean(c.departamento, 6).toUpperCase(),
    ciudad: clean(c.ciudad, 60),
    direccion: clean(c.direccion, 200),
    notas: clean(c.notas, 300),
    email: clean(c.email, 120)
  };
  if (customer.nombre.length < 3) return json({ error: "Escribe tu nombre completo." }, 400);
  if (!/^3\d{9}$/.test(customer.telefono)) return json({ error: "Escribe un celular colombiano válido (10 dígitos, empieza por 3)." }, 400);
  if (!DEPARTMENTS[customer.departamento]) return json({ error: "Elige tu departamento." }, 400);
  if (customer.ciudad.length < 2) return json({ error: "Escribe tu ciudad o municipio." }, 400);
  if (customer.direccion.length < 6) return json({ error: "Escribe la dirección completa con barrio." }, 400);

  const items = Array.isArray(body.items) ? body.items.slice(0, 20) : [];
  if (!items.length) return json({ error: "Tu carrito está vacío." }, 400);

  if (await tooManyOrders(request)) return json({ error: "Recibimos varios pedidos seguidos desde tu conexión. Escríbenos por WhatsApp para ayudarte." }, 429);

  // Precios y stock se vuelven a leer de Dropi: nunca se confía en lo que manda el navegador.
  const lines = [];
  for (const it of items) {
    const entry = CATALOG.find((e) => String(e.dropiId) === String(it.id));
    if (!entry) return json({ error: "Uno de los productos ya no está disponible." }, 400);
    const qty = Math.min(20, Math.max(1, Math.floor(Number(it.qty) || 1)));
    const p = await loadProduct(env, ctx, entry, { fresh: true });
    let price = p.price;
    let variation = null;
    if (p.type === "VARIABLE") {
      variation = p.variations.find((v) => String(v.id) === String(it.variationId));
      if (!variation) return json({ error: `Elige una opción para ${p.name}.` }, 400);
      if (variation.stock < qty) return json({ error: `${p.name} (${variation.label}) no tiene suficiente stock.` }, 409);
      price = variation.price;
    } else if (p.stock < qty) {
      return json({ error: `${p.name} no tiene suficiente stock.` }, 409);
    }
    // Combo (ej. 2 por $149.950): el total de la línea es el del combo y el precio unitario se reparte.
    const total = lineTotal(entry, price, qty);
    lines.push({ p, variation, qty, price: total / qty, total });
  }

  // Dropi recibe un pedido por proveedor.
  const groups = new Map();
  for (const l of lines) {
    const k = String(l.p.supplierId ?? "x");
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(l);
  }

  const orderRef = "MV" + Date.now().toString(36).toUpperCase().slice(-6) + Math.random().toString(36).slice(2, 4).toUpperCase();
  const [first, ...rest] = customer.nombre.split(/\s+/);
  const created = [];
  const failed = [];
  let n = 0;
  for (const [supplierId, group] of groups) {
    n += 1;
    const ref = groups.size > 1 ? `${orderRef}-${n}` : orderRef;
    const total = group.reduce((s, l) => s + l.total, 0);
    const payload = {
      total_order: total,
      notes: [customer.notas, `Pedido web MUVY ${ref}`].filter(Boolean).join(" · "),
      name: first,
      surname: rest.join(" ") || ".",
      dir: customer.direccion,
      country: "CO",
      state: customer.departamento,
      city: customer.ciudad,
      phone: customer.telefono,
      client_email: customer.email,
      payment_method_id: 1,
      status: "PENDIENTE CONFIRMACION",
      type: "FINAL_ORDER",
      rate_type: "CON RECAUDO",
      calculate_costs_and_shiping: true,
      supplier_id: supplierId === "x" ? undefined : Number(supplierId),
      shop_order_id: ref,
      products: group.map((l) => ({
        id: l.p.dropiId,
        name: l.p.name,
        type: l.p.type,
        quantity: l.qty,
        price: l.price,
        ...(l.variation ? { variation_id: l.variation.id } : {})
      }))
    };
    try {
      const id = await createDropiOrder(env, payload);
      created.push({ ref, dropiOrderId: id, total });
    } catch (e) {
      console.error("Dropi order failed", ref, e.message);
      failed.push({ ref, items: group.map((l) => l.p.name), error: e.message });
    }
  }

  if (!created.length) {
    return json({ error: "No pudimos registrar tu pedido en este momento. Intenta de nuevo o escríbenos por WhatsApp.", detail: failed[0]?.error }, 502);
  }
  return json({
    ok: true,
    reference: orderRef,
    orders: created,
    failed,
    total: created.reduce((s, o) => s + o.total, 0)
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // www.muvy.shop → muvy.shop
    if (url.hostname === "www.muvy.shop") {
      url.hostname = "muvy.shop";
      return Response.redirect(url.toString(), 301);
    }

    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);

    try {
      if (url.pathname === "/api/products" && request.method === "GET") {
        const { products, errors } = await loadCatalog(env, ctx);
        if (errors.length) console.warn("Productos con error", JSON.stringify(errors));
        return json({ products: products.map(publicProduct), ...(url.searchParams.has("diag") ? { errors } : {}) }, 200, { "cache-control": "public, max-age=60" });
      }
      const m = url.pathname.match(/^\/api\/products\/(\d+)$/);
      if (m && request.method === "GET") {
        const entry = CATALOG.find((e) => String(e.dropiId) === m[1]);
        if (!entry) return json({ error: "Producto no encontrado." }, 404);
        const p = await loadProduct(env, ctx, entry);
        return json({ product: publicProduct(p) }, 200, { "cache-control": "public, max-age=60" });
      }
      if (url.pathname === "/api/departments" && request.method === "GET") {
        return json({ departments: Object.entries(DEPARTMENTS).map(([code, name]) => ({ code, name })).sort((a, b) => a.name.localeCompare(b.name, "es")) }, 200, { "cache-control": "public, max-age=86400" });
      }
      if (url.pathname === "/api/orders" && request.method === "POST") {
        return await createOrder(request, env, ctx);
      }
      return json({ error: "No encontrado." }, 404);
    } catch (e) {
      console.error(e);
      const status = e instanceof DropiError ? e.status : 500;
      return json({ error: status === 503 ? e.message : "No pudimos cargar la información de Dropi. Intenta de nuevo en un momento.", detail: e instanceof DropiError ? e.message : undefined }, status);
    }
  }
};
