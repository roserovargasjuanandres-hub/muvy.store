(function () {
  const CFG = window.MUVY_CONFIG;
  const ART = window.MUVY_ART;
  const CONTENT = window.MUVY_CONTENT || {};
  const CART_KEY = "muvy_cart_v2";
  const I = ART.icon;
  let PRODUCTS = [];

  const money = (n) => "$" + Math.round(n).toLocaleString("es-CO");
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const byId = (id) => PRODUCTS.find((p) => String(p.id) === String(id));
  const waLink = (text) => "https://wa.me/" + CFG.whatsapp + (text ? "?text=" + encodeURIComponent(text) : "");
  const info = (p) => CONTENT[p.slug] || {};
  const pct = (price, before) => (before && before > price ? Math.round((1 - price / before) * 100) : 0);
  const isCut = (src) => /\.png($|\?)/i.test(src || "");
  const linePrice = (p, unit, qty) => (p.bundle && qty === p.bundle.qty ? p.bundle.price : unit * qty);
  const page = document.body.dataset.page;

  async function api(path, opts) {
    const res = await fetch(path, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Algo salió mal. Intenta de nuevo.");
    return data;
  }
  async function loadProducts() {
    const d = await api("/api/products");
    PRODUCTS = d.products || [];
    return PRODUCTS;
  }

  /* ---------- Contador: la oferta del día termina a medianoche (hora Colombia) ---------- */
  function tick() {
    const now = Math.floor(Date.now() / 1000) - 5 * 3600;
    const left = 86400 - (now % 86400);
    const pad = (n) => String(n).padStart(2, "0");
    const v = { h: pad(Math.floor(left / 3600)), m: pad(Math.floor((left % 3600) / 60)), s: pad(left % 60) };
    document.querySelectorAll("[data-cd]").forEach((el) => {
      const k = el.dataset.cd;
      el.textContent = k === "all" ? `${v.h}:${v.m}:${v.s}` : v[k];
    });
  }
  setInterval(tick, 1000);

  /* ---------- Carrito ---------- */
  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; }
  }
  function saveCart(cart) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {}
    updateCount();
  }
  function itemInfo(i) {
    const p = byId(i.id);
    if (!p) return null;
    const v = i.variationId ? p.variations.find((x) => String(x.id) === String(i.variationId)) : null;
    if (p.type === "VARIABLE" && !v) return null;
    const unit = v ? v.price : p.price;
    return { p, v, unit, total: linePrice(p, unit, i.qty), stock: v ? v.stock : p.stock, label: v ? v.label : "" };
  }
  function addToCart(id, qty = 1, variationId = null, { replace = false, silent = false } = {}) {
    const p = byId(id);
    const key = id + "|" + (variationId || "");
    const cart = getCart();
    const found = cart.find((i) => i.key === key);
    if (found) found.qty = replace ? qty : Math.min(20, found.qty + qty);
    else cart.push({ key, id, variationId, qty });
    saveCart(cart);
    if (!silent) toast(p.name + " se agregó al carrito");
  }
  function updateCount() {
    const n = getCart().reduce((s, i) => s + i.qty, 0);
    document.querySelectorAll(".cart-count").forEach((el) => (el.textContent = n));
  }
  function toast(msg) {
    let t = $(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove("show"), 2200);
  }
  const errorBox = (msg) => `<div class="empty" style="grid-column:1/-1"><p>${esc(msg)}</p><button class="btn btn-ghost" onclick="location.reload()">Reintentar</button></div>`;
  const skeleton = (n) => Array.from({ length: n }, () => `<div class="card"><div class="card-media skel"></div><div class="skel skel-line"></div><div class="skel skel-line short"></div></div>`).join("");

  /* ---------- Estructura común ---------- */
  function renderShell() {
    const navLink = (href, label, key) => `<a href="${href}" class="${page === key ? "active" : ""}">${label}</a>`;
    const left = page === "product"
      ? `<a class="icon-btn" href="/" aria-label="Volver al inicio" onclick="if(document.referrer.indexOf(location.host)>-1){history.back();return false}">${I("back")}</a>`
      : `<a class="icon-btn" href="/catalogo#buscar" aria-label="Buscar productos">${I("search", 19)}</a>`;
    $("#header").innerHTML = `
      ${page === "product" ? "" : `
      <div class="announce"><div class="wrap">
        <div class="announce-main">
          <span class="announce-icon">${I("cash", 24)}</span>
          <span><span class="announce-title">PAGA AL RECIBIR TU PEDIDO</span><span class="announce-sub">Contraentrega · Envíos a toda Colombia</span></span>
        </div>
        <a class="announce-offer" href="/catalogo" id="announce-offer">
          <b>${ART.icon("bolt", 14, 'fill="#9A4430" stroke="#9A4430"')} OFERTAS DE HOY</b>
          <span class="cd-pill" data-cd="all">--:--:--</span>
        </a>
      </div></div>`}
      <header class="header"><div class="wrap">
        ${left}
        <a class="logo" href="/" aria-label="MUVY, inicio"><b>MUVY</b><small>${page === "product" ? "DETALLE DE PRODUCTO" : "HOGAR · BIENESTAR"}</small></a>
        <div class="header-actions">
          <nav class="nav">${navLink("/", "Inicio", "home")}${navLink("/catalogo", "Catálogo", "catalog")}</nav>
          <a class="icon-btn clay" href="/carrito" aria-label="Ver carrito">${I("bag", 18)}<span class="badge-count cart-count">0</span></a>
        </div>
      </div></header>`;
    $("#footer").innerHTML = `
      ${page === "product" ? "" : `
      <div class="bottom-nav"><nav aria-label="Navegación principal">
        <a href="/" class="${page === "home" ? "active" : ""}">${I("home")}Inicio</a>
        <a href="/catalogo" class="${page === "catalog" ? "active" : ""}">${I("grid")}Catálogo</a>
        <a href="/carrito" class="${page === "cart" ? "active" : ""}">${I("bag")}Carrito</a>
        <a href="${waLink()}" target="_blank" rel="noopener">${I("chat")}Ayuda</a>
      </nav></div>`}
      <footer class="footer"><div class="wrap">
        <div>
          <a class="logo" href="/"><b>MUVY</b><small style="color:#CDBDB3">HOGAR · BIENESTAR</small></a>
          <p style="max-width:34ch;opacity:.8;font-size:14px">Cosas útiles y bonitas para tu casa, con envío a toda Colombia y pago contraentrega.</p>
        </div>
        <div><h4>TIENDA</h4><a href="/catalogo">Todo el catálogo</a><a href="/catalogo?cat=Cocina">Cocina</a><a href="/catalogo?cat=Iluminación">Iluminación</a></div>
        <div><h4>AYUDA</h4><a href="${waLink()}" target="_blank" rel="noopener">WhatsApp</a><a href="/carrito">Mi carrito</a></div>
        <div class="footer-bottom">© ${new Date().getFullYear()} MUVY · muvy.shop</div>
      </div></footer>
      <div class="floaters">
        ${page === "product" ? `<a class="fab cart" href="/carrito" aria-label="Ver carrito">${I("cart", 24)}<span class="badge-count cart-count">0</span></a>` : ""}
        <a class="fab wa" href="${waLink("Hola MUVY, tengo una pregunta")}" target="_blank" rel="noopener" aria-label="Escríbenos por WhatsApp">${I("chat", 26)}</a>
      </div>`;
    updateCount();
    tick();
  }

  function card(p) {
    const c = info(p);
    const off = pct(p.price, p.compareAt);
    const from = p.type === "VARIABLE" && new Set(p.variations.map((v) => v.price)).size > 1 ? "<small>desde </small>" : "";
    const tag = !p.inStock ? "" : off ? `<span class="card-tag offer">-${off}%</span>` : `<span class="card-tag">${esc(p.category)}</span>`;
    return `
      <article class="card">
        <a class="card-media" href="/producto?id=${p.id}">
          ${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">` : ""}
          ${tag}${p.inStock ? "" : '<span class="card-tag out">Agotado</span>'}
        </a>
        <div class="card-body">
          <a class="card-title" href="/producto?id=${p.id}">${esc(p.name)}</a>
          <span style="font-size:12px;color:var(--muted)">${esc(c.short || p.category)}</span>
          <div class="card-foot">
            <span class="card-price"><b>${from}${money(p.price)}</b>${p.compareAt ? `<s>${money(p.compareAt)}</s>` : ""}</span>
            ${p.inStock ? `<button class="card-add ${off ? "hot" : ""}" data-add="${p.id}" aria-label="Añadir ${esc(p.name)} al carrito">${I("cart", 17)}</button>` : ""}
          </div>
        </div>
      </article>`;
  }

  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-add]");
    if (!b) return;
    const p = byId(b.dataset.add);
    if (!p) return;
    if (p.type === "VARIABLE") { location.href = "/producto?id=" + p.id; return; }
    addToCart(p.id);
  });

  /* ---------- Inicio ---------- */
  async function home() {
    $("#hero-art").innerHTML = ART.hero;
    $("#featured").innerHTML = skeleton(4);
    try { await loadProducts(); } catch (e) { $("#featured").innerHTML = errorBox(e.message); return; }

    // Categorías con la foto de su primer producto.
    const cats = [];
    PRODUCTS.forEach((p) => { if (!cats.find((c) => c.name === p.category)) cats.push({ name: p.category, img: p.image }); });
    let active = null;
    const ordered = [...PRODUCTS.filter((p) => p.featured), ...PRODUCTS.filter((p) => !p.featured)];
    const draw = () => {
      $("#cats").innerHTML = cats.map((c) => `
        <button class="cat ${active === c.name ? "active" : ""}" data-cat="${esc(c.name)}" aria-pressed="${active === c.name}">
          <span class="cat-img">${c.img ? `<img src="${esc(c.img)}" alt="">` : ""}</span><span>${esc(c.name)}</span>
        </button>`).join("");
      const list = active ? ordered.filter((p) => p.category === active) : ordered;
      $("#featured").innerHTML = list.map(card).join("");
      $("#grid-eyebrow").textContent = active ? active.toUpperCase() : "SELECCIÓN MUVY";
      $("#grid-count").textContent = list.length + " producto" + (list.length === 1 ? "" : "s");
    };
    $("#cats").addEventListener("click", (e) => {
      const c = e.target.closest("[data-cat]");
      if (!c) return;
      active = active === c.dataset.cat ? null : c.dataset.cat;
      draw();
    });
    $("#show-all").addEventListener("click", () => { active = null; draw(); });
    draw();

    // Banner de oferta: el producto destacado con mayor descuento.
    const deal = [...PRODUCTS].filter((p) => p.compareAt && p.inStock).sort((a, b) => pct(b.price, b.compareAt) - pct(a.price, a.compareAt))[0];
    if (deal) {
      $("#announce-offer") && ($("#announce-offer").href = "/producto?id=" + deal.id);
      $("#deal").innerHTML = `
        <a class="offer" href="/producto?id=${deal.id}">
          <span class="offer-text">
            <span class="pill pill-white" style="align-self:flex-start;color:var(--clay);font-size:10px;letter-spacing:.1em">SUPER OFERTA · -${pct(deal.price, deal.compareAt)}%</span>
            <h3>${esc(deal.name)}</h3>
            <span class="offer-price"><b>${money(deal.price)}</b><s>${money(deal.compareAt)}</s></span>
            <span class="offer-cd"><span data-cd="h">--</span>:<span data-cd="m">--</span>:<span data-cd="s">--</span></span>
            <span class="offer-cta">Lo quiero ${I("arrow", 14)}</span>
          </span>
          <span class="offer-art">${deal.image ? `<img src="${esc(deal.image)}" alt="">` : ""}</span>
        </a>`;
    }

    // Reseñas reales del producto que las tenga.
    const withReviews = PRODUCTS.find((p) => (info(p).reviews || []).length);
    if (withReviews) {
      const r = info(withReviews).reviews;
      const avg = r.reduce((s, x) => s + x[0], 0) / r.length;
      $("#reviews").hidden = false;
      $("#reviews-avg").innerHTML = `${ART.stars(avg, 13)} <strong>${avg.toFixed(1)} / 5</strong>`;
      $("#reviews-row").innerHTML = r.slice(0, 5).map(([n, t]) => `
        <div class="review italic">${ART.stars(n, 13)}<p>“${esc(t)}”</p>
          <span class="reviewer"><span class="ico-circle">${I("user", 15)}</span><span><b>Cliente MUVY · <span class="verified">Compra verificada</span></b><small>Sobre: ${esc(withReviews.name)}</small></span></span>
        </div>`).join("");
    }
    tick();
  }

  /* ---------- Catálogo ---------- */
  async function catalog() {
    $("#grid").innerHTML = skeleton(8);
    try { await loadProducts(); } catch (e) { $("#grid").innerHTML = errorBox(e.message); return; }
    const params = new URLSearchParams(location.search);
    let active = params.get("cat") || "Todo";
    let q = "";
    const cats = ["Todo", ...new Set(PRODUCTS.map((p) => p.category))];
    const draw = () => {
      $("#filters").innerHTML = cats.map((c) => `<button class="chip ${c === active ? "active" : ""}" data-cat="${esc(c)}">${esc(c)}</button>`).join("");
      const list = PRODUCTS.filter((p) => (active === "Todo" || p.category === active) && (!q || (p.name + " " + p.category).toLowerCase().includes(q)));
      $("#grid").innerHTML = list.map(card).join("");
      $("#empty").hidden = list.length > 0;
      $("#count").textContent = list.length + " producto" + (list.length === 1 ? "" : "s");
    };
    $("#filters").addEventListener("click", (e) => {
      const c = e.target.closest("[data-cat]");
      if (!c) return;
      active = c.dataset.cat;
      history.replaceState(null, "", active === "Todo" ? "/catalogo" : "/catalogo?cat=" + encodeURIComponent(active));
      draw();
    });
    $("#search").addEventListener("input", (e) => { q = e.target.value.trim().toLowerCase(); draw(); });
    if (location.hash === "#buscar") $("#search").focus();
    draw();
  }

  /* ---------- Producto ---------- */
  async function product() {
    const root = $("#product");
    root.innerHTML = `<div class="pd-layout"><div class="pd-media skel"></div><div class="pd-info"><div class="skel skel-line"></div><div class="skel skel-line short"></div></div></div>`;
    try { await loadProducts(); } catch (e) { root.innerHTML = errorBox(e.message); return; }
    const p = byId(new URLSearchParams(location.search).get("id"));
    if (!p) {
      root.innerHTML = `<div class="empty"><p>No encontramos este producto.</p><a class="btn btn-primary" href="/catalogo">Ver catálogo</a></div>`;
      return;
    }
    const c = info(p);
    document.title = p.name + " · MUVY";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.content = c.subtitle || p.name + " con pago contraentrega y envío a toda Colombia.";

    const available = p.variations.filter((v) => v.stock > 0);
    const groups = [];
    available.forEach((v) => Object.keys(v.attrs).forEach((k) => { if (!groups.includes(k)) groups.push(k); }));
    const grouped = groups.length > 0 && available.every((v) => groups.every((g) => v.attrs[g]));
    const sel = {};
    let variationId = null;
    if (p.type === "VARIABLE" && available.length) {
      if (grouped) groups.forEach((g) => (sel[g] = available[0].attrs[g]));
      else variationId = available[0].id;
    }
    const current = () => {
      if (p.type !== "VARIABLE") return null;
      if (!grouped) return available.find((v) => v.id === variationId) || null;
      return available.find((v) => groups.every((g) => v.attrs[g] === sel[g])) || null;
    };
    const valuesFor = (g) => [...new Set(available.map((v) => v.attrs[g]))];
    const state = { img: 0, qty: p.bundle ? p.bundle.qty : 1, pol: false, faq: 0 };
    const faqs = [...(c.faqs || []), ...(window.MUVY_FAQ_GENERAL || [])];
    const reviews = c.reviews || [];
    const christmas = [10, 11].includes(new Date().getMonth());
    const bc = c.bundleCopy || {};

    const draw = () => {
      const v = current();
      const unit = v ? v.price : p.price;
      const canBuy = p.type === "VARIABLE" ? Boolean(v) : p.inStock;
      const total = linePrice(p, unit, state.qty);
      const off = pct(p.price, p.compareAt);
      const src = p.images[state.img];
      const avg = reviews.length ? reviews.reduce((s, x) => s + x[0], 0) / reviews.length : 0;

      const gallery = `
        <div class="pd-gallery">
          <div class="pd-media ${isCut(src) ? "cut" : "cover"}">
            ${src ? `<img src="${esc(src)}" alt="${esc(p.name)}">` : ""}
            <span class="pd-badge l">${I(c.tagIcon || "bolt", 13, 'style="color:#9A4430"')}${esc(c.tag || "PAGAS AL RECIBIR")}</span>
            ${off ? `<span class="pd-badge r">-${off}%</span>` : ""}
            ${c.photoChip ? `<span class="pill pill-white" style="position:absolute;bottom:14px;left:50%;transform:translateX(-50%);white-space:nowrap">${I(c.photoChip.icon, 14, 'style="color:#C0702A"')}${esc(c.photoChip.text)}</span>` : ""}
          </div>
          ${p.images.length > 1 ? `<div class="thumbs">${p.images.slice(0, 8).map((im, i) => `<button class="thumb ${i === state.img ? "active" : ""}" data-img="${i}" aria-label="Ver foto ${i + 1}"><img src="${esc(im)}" alt=""></button>`).join("")}</div>` : ""}
        </div>`;

      const options = p.type === "VARIABLE" ? (grouped
        ? groups.map((g) => `<div><div class="opt-label">${esc(g)}: ${esc(sel[g])}</div><div class="opt-values">${valuesFor(g).map((val) => `<button class="chip ${sel[g] === val ? "active" : ""}" data-g="${esc(g)}" data-val="${esc(val)}">${esc(val)}</button>`).join("")}</div></div>`).join("")
        : `<div><div class="opt-label">Opción</div><div class="opt-values">${available.map((x) => `<button class="chip ${x.id === variationId ? "active" : ""}" data-v="${x.id}">${esc(x.label)}</button>`).join("")}</div></div>`) : "";

      const offers = p.bundle ? `
        <div class="offers">
          <div class="offers-head"><span>ELIGE TU OFERTA</span><small>${esc(bc.variant || "Versión única")}</small></div>
          <button class="offer-opt ${state.qty === 1 ? "on" : ""}" data-qty="1" aria-pressed="${state.qty === 1}">
            <span class="radio"></span>
            <span class="opt-main"><b>${esc((bc.one || [])[0] || "1 unidad")}</b><small>${esc((bc.one || [])[1] || "")}</small></span>
            <span class="opt-price"><b>${money(unit)}</b>${p.compareAt ? `<s>${money(p.compareAt)}</s>` : ""}</span>
          </button>
          <div class="popular">
            <span class="ribbon">${esc(bc.ribbon || "MÁS POPULAR")}</span>
            <button class="offer-opt ${state.qty === p.bundle.qty ? "on" : ""}" data-qty="${p.bundle.qty}" aria-pressed="${state.qty === p.bundle.qty}">
              <span class="radio"></span>
              <span class="opt-main"><b>${esc((bc.two || [])[0] || p.bundle.qty + " unidades")}</b><small>${esc((bc.two || [])[1] || "")}</small>
                ${p.bundle.compareAt ? `<span class="pill pill-olive" style="align-self:flex-start;margin-top:4px;font-size:11px;padding:3px 10px">Ahorras ${money(p.bundle.compareAt - p.bundle.price)}</span>` : ""}</span>
              <span class="opt-price"><b>${money(p.bundle.price)}</b>${p.bundle.compareAt ? `<s>${money(p.bundle.compareAt)}</s>` : ""}<small>${money(p.bundle.price / p.bundle.qty)} c/u</small></span>
            </button>
            ${ART.snow()}${christmas ? ART.hat : ""}
          </div>
          ${c.gift ? `<div class="gift">${I("gift", 16, 'style="color:#9A4430;flex:none"')}<span>${esc(c.gift)}</span></div>` : ""}
        </div>` : canBuy ? `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px">
          <span class="opt-label">Cantidad</span>
          <span class="qty"><button data-q="-1" aria-label="Menos">−</button><span>${state.qty}</span><button data-q="1" aria-label="Más">+</button></span>
        </div>` : "";

      root.innerHTML = `
        <div class="pd-layout">
          ${gallery}
          <div class="pd-info">
            <div class="pd-top"><span class="pd-cat">${esc(p.category)}</span><span class="pill pill-olive">${I("cash", 13)} Pagas al recibir</span></div>
            <h1>${esc(p.name)}</h1>
            ${reviews.length ? `<div class="pd-rating">${ART.stars(avg, 15)}<strong>${avg.toFixed(1)}</strong><span>· ${reviews.length} reseñas de clientes</span></div>` : ""}
            ${c.subtitle ? `<p class="pd-sub">${esc(c.subtitle)}</p>` : ""}
            <div class="price-card">
              <div class="price-line"><b>${money(unit)}</b>${p.compareAt ? `<s>${money(p.compareAt)}</s><span class="pill pill-blush">Ahorras ${money(p.compareAt - unit)}</span>` : ""}</div>
              <div class="check-line">${I("cash", 16)}<span><strong>Pago contraentrega:</strong> no pagas nada hasta tenerlo en tus manos</span></div>
              <div class="check-line">${I("truck", 16)}<span>Envío a toda Colombia</span></div>
            </div>
            ${options}
            ${p.type === "VARIABLE" && !v ? `<p class="note" style="text-align:left">Esa combinación no está disponible, prueba otra.</p>` : ""}
            ${!canBuy && !(p.type === "VARIABLE" && available.length) ? `<span class="btn btn-ghost btn-block" style="cursor:default">Agotado por ahora</span>` : ""}
            <div class="box outline">
              <button class="toggle" data-toggle="pol" aria-expanded="${state.pol}">${I("doc")}<span>Ver normas y políticas de envío</span><small>${state.pol ? "Ocultar" : "Ver"}</small></button>
              <div class="toggle-body" ${state.pol ? "" : "hidden"}>
                <div class="dot-line"><span><strong>Cobertura:</strong> enviamos a toda Colombia con transportadoras aliadas.</span></div>
                <div class="dot-line"><span><strong>Pago contraentrega:</strong> pagas en efectivo al recibir. Sin pagos por adelantado.</span></div>
                <div class="dot-line"><span><strong>Confirmación:</strong> antes de despachar te llamamos para confirmar tu pedido y dirección.</span></div>
                <div class="dot-line"><span><strong>Al recibir:</strong> ten el valor listo y verifica que el paquete llegue sellado.</span></div>
                <div class="dot-line"><span><strong>Garantía:</strong> si llega con algún defecto de fábrica, escríbenos por WhatsApp y te ayudamos.</span></div>
              </div>
            </div>
            ${canBuy ? offers : ""}
            <div class="seals">
              <span class="eyebrow">TU COMPRA ESTÁ PROTEGIDA</span>
              <div class="seals-grid">
                <div class="seal">${ART.sealEnvio}<span>Empaque protegido y envío hasta tu puerta</span></div>
                <div class="seal">${ART.sealGarantia}<span>Respaldo MUVY ante defectos de fábrica</span></div>
              </div>
            </div>
          </div>
        </div>

        <div class="narrow">
          ${c.problems ? `<section class="section"><span class="eyebrow">¿TE HA PASADO?</span><h2 style="font-size:22px;margin:4px 0 12px">Este producto lo soluciona</h2>
            <div class="stack">${c.problems.map((x) => `<div class="problem"><span class="ico-circle lg">${I(x.icon)}</span><span><b>${esc(x.q)}</b><span>${esc(x.a)}</span></span></div>`).join("")}</div></section>` : ""}
          ${c.features ? `<section class="section"><div class="offers-head" style="margin-bottom:12px">LO QUE LO HACE ESPECIAL</div>
            <div class="feat-grid">${c.features.map((f) => `<div class="feat"><span class="ico-circle lg">${I(f.icon)}</span><b>${esc(f.title)}</b><span>${esc(f.text)}</span></div>`).join("")}</div></section>` : ""}
          ${c.emotion ? `<section class="section"><div class="emotion"><span class="eyebrow">${esc(c.emotion.eyebrow)}</span><h3>${esc(c.emotion.title)}</h3><p>${esc(c.emotion.text)}</p></div></section>` : ""}
          ${c.occasions ? `<section class="section"><div class="dark-block"><span class="eyebrow" style="color:var(--clay-soft)">EL REGALO PERFECTO</span><h2>Un detalle que se queda encendido en su corazón.</h2><div class="chips-wrap">${c.occasions.map((o) => `<span>${esc(o)}</span>`).join("")}</div></div></section>` : ""}
          ${c.places ? `<section class="section"><div class="offers-head" style="margin-bottom:12px">QUEDA HERMOSA EN</div><div class="places">${c.places.map(([ic, t]) => `<div class="place">${I(ic, 22)}${esc(t)}</div>`).join("")}</div></section>` : ""}
          ${!c.features && p.description ? `<section class="section"><div class="offers-head" style="margin-bottom:12px">DESCRIPCIÓN</div><div class="box" style="padding:18px"><div class="desc">${esc(p.description)}</div></div></section>` : ""}
          <section class="section"><div class="offers-head" style="margin-bottom:12px">ASÍ DE FÁCIL ES PEDIRLO</div>
            <div class="dark-block" style="gap:10px">
              <div class="step-pill"><span class="step-num">1</span>Haz tu pedido sin tarjeta</div>
              <div class="step-pill"><span class="step-num">2</span>Te llamamos para confirmar y despachamos</div>
              <div class="step-pill"><span class="step-num">3</span>Recibes en casa y pagas en efectivo</div>
            </div>
          </section>
          ${reviews.length ? `<section class="section"><span class="eyebrow">LO QUE DICEN NUESTROS CLIENTES</span>
            <div class="rating-box" style="margin:12px 0">
              <div class="rating-big"><b>${avg.toFixed(1)}</b>${ART.stars(avg, 14)}<small>${reviews.length} reseñas</small></div>
              <div class="bars">${[5, 4, 3, 2, 1].map((n) => { const k = reviews.filter((r) => r[0] === n).length; return `<div class="bar"><span style="width:24px">${n} ★</span><i><em style="width:${(k / reviews.length) * 100}%"></em></i><span style="width:12px;text-align:right">${k}</span></div>`; }).join("")}</div>
            </div>
            <div class="stack">${reviews.map(([n, t]) => `<div class="review" style="width:auto"><span class="reviewer" style="margin:0;background:none;padding:0"><span class="ico-circle">${I("user", 16)}</span><span><b>Cliente MUVY · <span class="verified">Compra verificada</span></b>${ART.stars(n, 13)}</span></span><p>“${esc(t)}”</p></div>`).join("")}</div>
          </section>` : ""}
          <section class="section"><span class="eyebrow">RESOLVEMOS TUS DUDAS</span><h2 style="font-size:24px;margin:4px 0 12px">Preguntas frecuentes</h2>
            <div class="faq">${faqs.map(([q, a], i) => `<div class="faq-item"><button class="faq-q" data-faq="${i}" aria-expanded="${state.faq === i}"><span>${esc(q)}</span><i>${state.faq === i ? "−" : "+"}</i></button><div class="faq-a" ${state.faq === i ? "" : "hidden"}>${esc(a)}</div></div>`).join("")}</div>
          </section>
          <section class="section"><div class="trust">
            <div class="perk"><span class="perk-ico">${I("cash", 18)}</span>Pago al recibir</div>
            <div class="perk"><span class="perk-ico">${I("truck", 18)}</span>Envío nacional</div>
            <div class="perk"><span class="perk-ico">${I("shield", 18)}</span>Compra segura</div>
          </div></section>
        </div>`;

      $("#buybar").innerHTML = canBuy ? `
        <div class="buybar-inner">
          <div class="buybar-cd">${I("clock", 13, 'style="color:#9A4430"')}<span>${off ? "Precio de oferta por" : "Pide hoy, quedan"} <b data-cd="all">--:--:--</b> ${off ? "más" : "para el despacho de hoy"}</span></div>
          <div class="buybar-row">
            <button class="icon-btn" id="add" aria-label="Añadir al carrito">${I("cart")}</button>
            <button class="buy-main" id="buy"><span><b>Pedir ahora</b><small>Pagas al recibir</small></span><em>${money(total)}</em></button>
          </div>
        </div>` : "";
      tick();
    };

    root.addEventListener("click", (e) => {
      const t = e.target;
      const g = t.closest("[data-g]");
      if (g) { sel[g.dataset.g] = g.dataset.val; return draw(); }
      const vb = t.closest("[data-v]");
      if (vb) { variationId = Number(vb.dataset.v); return draw(); }
      const im = t.closest("[data-img]");
      if (im) { state.img = Number(im.dataset.img); return draw(); }
      const q = t.closest("[data-q]");
      if (q) { state.qty = Math.max(1, Math.min(20, state.qty + Number(q.dataset.q))); return draw(); }
      const oq = t.closest("[data-qty]");
      if (oq) { state.qty = Number(oq.dataset.qty); return draw(); }
      if (t.closest("[data-toggle]")) { state.pol = !state.pol; return draw(); }
      const f = t.closest("[data-faq]");
      if (f) { const i = Number(f.dataset.faq); state.faq = state.faq === i ? -1 : i; return draw(); }
    });
    $("#buybar").addEventListener("click", (e) => {
      const v = current();
      if (e.target.closest("#add")) addToCart(p.id, state.qty, v ? v.id : null, { replace: Boolean(p.bundle) });
      if (e.target.closest("#buy")) { addToCart(p.id, state.qty, v ? v.id : null, { replace: true, silent: true }); location.href = "/carrito"; }
    });
    draw();
    $("#related").innerHTML = PRODUCTS.filter((x) => x.id !== p.id && x.inStock).slice(0, 4).map(card).join("");
  }

  /* ---------- Carrito ---------- */
  async function cartPage() {
    $("#cart-items").innerHTML = `<div class="skel skel-line"></div><div class="skel skel-line short"></div>`;
    try {
      const [, deps] = await Promise.all([loadProducts(), api("/api/departments")]);
      $("#departamento").innerHTML = `<option value="">Elige tu departamento</option>` + deps.departments.map((d) => `<option value="${d.code}">${esc(d.name)}</option>`).join("");
    } catch (e) {
      $("#cart-layout").innerHTML = errorBox(e.message);
      return;
    }
    saveCart(getCart().filter((i) => itemInfo(i)));

    const draw = () => {
      const cart = getCart();
      if (!cart.length) {
        $("#cart-layout").innerHTML = `<div class="empty" style="grid-column:1/-1"><p>Tu carrito está vacío.</p><a class="btn btn-primary" href="/catalogo">Ver productos</a></div>`;
        return;
      }
      $("#cart-items").innerHTML = cart.map((i, idx) => {
        const it = itemInfo(i);
        const { p } = it;
        const combo = p.bundle && i.qty === p.bundle.qty;
        return `<div class="cart-item">
          ${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}">` : "<div></div>"}
          <div>
            <h3>${esc(p.name)}</h3>
            <div class="meta">${esc(it.label || p.category)} · ${money(it.unit)} c/u${combo ? ` · <strong style="color:var(--olive)">Precio de combo aplicado</strong>` : ""}</div>
            ${p.bundle && !combo ? `<div class="meta" style="color:var(--clay)">Lleva ${p.bundle.qty} por ${money(p.bundle.price)}</div>` : ""}
            ${it.stock < i.qty ? `<div class="meta" style="color:var(--clay)">Solo quedan ${it.stock} disponibles</div>` : ""}
            <div class="controls">
              <span class="qty"><button data-i="${idx}" data-d="-1" aria-label="Menos">−</button><span>${i.qty}</span><button data-i="${idx}" data-d="1" aria-label="Más">+</button></span>
              <span class="line-total">${money(it.total)}</span>
            </div>
            <button class="remove" data-rm="${idx}">Quitar</button>
          </div>
        </div>`;
      }).join("");
      const total = cart.reduce((s, i) => s + itemInfo(i).total, 0);
      $("#subtotal").textContent = money(total);
      $("#shipping").textContent = "Incluido";
      $("#total").textContent = money(total);
    };
    $("#cart-items").addEventListener("click", (e) => {
      const cart = getCart();
      const d = e.target.closest("[data-d]");
      const r = e.target.closest("[data-rm]");
      if (d) { const it = cart[d.dataset.i]; it.qty = Math.max(1, Math.min(20, it.qty + Number(d.dataset.d))); }
      else if (r) cart.splice(Number(r.dataset.rm), 1);
      else return;
      saveCart(cart); draw();
    });

    $("#checkout").addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target;
      const btn = form.querySelector("button[type=submit]");
      const msg = $("#form-msg");
      msg.textContent = "";
      const f = new FormData(form);
      const payload = {
        website: f.get("website"),
        customer: { nombre: f.get("nombre"), telefono: f.get("telefono"), departamento: f.get("departamento"), ciudad: f.get("ciudad"), direccion: f.get("direccion"), notas: f.get("notas"), email: f.get("email") },
        items: getCart().map((i) => ({ id: i.id, variationId: i.variationId, qty: i.qty }))
      };
      btn.disabled = true;
      btn.textContent = "Enviando pedido…";
      try {
        const res = await api("/api/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
        saveCart([]);
        const partial = res.failed && res.failed.length ? `<p class="note" style="color:var(--clay)">No pudimos registrar: ${esc(res.failed.flatMap((x) => x.items).join(", "))}. Escríbenos por WhatsApp y lo resolvemos.</p>` : "";
        $("#cart-layout").innerHTML = `
          <div class="done" style="grid-column:1/-1">
            <div class="done-icon">✓</div>
            <h2 class="page-title">¡Pedido recibido!</h2>
            <p>Tu número de pedido es <b>${esc(res.reference)}</b>. Total a pagar al recibir: <b>${money(res.total)}</b>.</p>
            <p>Te llamaremos al ${esc(payload.customer.telefono)} para confirmar el envío.</p>
            ${partial}
            <div class="btn-row">
              <a class="btn btn-primary" href="/catalogo">Seguir comprando</a>
              <a class="btn btn-ghost" href="${waLink("Hola MUVY, hice el pedido " + res.reference)}" target="_blank" rel="noopener">Escribir por WhatsApp</a>
            </div>
          </div>`;
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err) {
        msg.textContent = err.message;
        btn.disabled = false;
        btn.textContent = "Confirmar pedido · Pago al recibir";
      }
    });
    draw();
  }

  renderShell();
  ({ home, catalog, product, cart: cartPage }[page] || (() => {}))();
})();
