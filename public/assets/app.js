(function () {
  const CFG = window.MUVY_CONFIG;
  const CART_KEY = "muvy_cart_v2";
  let PRODUCTS = [];

  const money = (n) => "$" + Math.round(n).toLocaleString("es-CO");
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const byId = (id) => PRODUCTS.find((p) => String(p.id) === String(id));
  const waLink = (text) => "https://wa.me/" + CFG.whatsapp + (text ? "?text=" + encodeURIComponent(text) : "");

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
    return { p, v, price: v ? v.price : p.price, stock: v ? v.stock : p.stock, label: v ? v.label : "" };
  }
  function addToCart(id, qty = 1, variationId = null) {
    const p = byId(id);
    const key = id + "|" + (variationId || "");
    const cart = getCart();
    const found = cart.find((i) => i.key === key);
    if (found) found.qty += qty;
    else cart.push({ key, id, variationId, qty });
    saveCart(cart);
    toast(p.name + " se agregó al carrito");
  }
  function updateCount() {
    const n = getCart().reduce((s, i) => s + i.qty, 0);
    document.querySelectorAll(".cart-count").forEach((el) => (el.textContent = n));
  }

  function toast(msg) {
    let t = $(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove("show"), 2200);
  }

  function errorBox(msg) {
    return `<div class="empty" style="grid-column:1/-1"><p>${esc(msg)}</p><button class="btn btn-ghost" onclick="location.reload()">Reintentar</button></div>`;
  }
  const skeleton = (n) => Array.from({ length: n }, () => `<div class="card"><div class="card-media skel"></div><div class="skel skel-line"></div><div class="skel skel-line short"></div></div>`).join("");

  /* ---------- Estructura común ---------- */
  function renderShell() {
    const page = document.body.dataset.page;
    const navLink = (href, label, key) => `<a href="${href}" class="${page === key ? "active" : ""}">${label}</a>`;
    $("#header").innerHTML = `
      <div class="announce">Pagas al recibir · Envíos a toda Colombia</div>
      <header class="header"><div class="wrap">
        <a class="logo" href="/">MUVY<span>.</span></a>
        <nav class="nav">
          ${navLink("/", "Inicio", "home")}
          ${navLink("/catalogo", "Catálogo", "catalog")}
          ${navLink("/catalogo?cat=Cocina", "Cocina", "")}
          ${navLink("/catalogo?cat=Iluminación", "Iluminación", "")}
        </nav>
        <a class="cart-btn" href="/carrito" aria-label="Ver carrito">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 7h12l-1 13H7L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>
          Carrito <span class="cart-count">0</span>
        </a>
      </div></header>`;
    $("#footer").innerHTML = `
      <footer class="footer"><div class="wrap">
        <div>
          <div class="logo">MUVY<span>.</span></div>
          <p style="max-width:34ch;opacity:.75">Cosas útiles y bonitas para tu casa, con envío a toda Colombia y pago contra entrega.</p>
        </div>
        <div>
          <h4>Tienda</h4>
          <a href="/catalogo">Todo el catálogo</a>
          <a href="/catalogo?cat=Cocina">Cocina</a>
          <a href="/catalogo?cat=Habitación">Habitación</a>
          <a href="/catalogo?cat=Iluminación">Iluminación</a>
        </div>
        <div>
          <h4>Ayuda</h4>
          <a href="${waLink()}" target="_blank" rel="noopener">WhatsApp</a>
          <a href="/carrito">Mi carrito</a>
        </div>
        <div class="footer-bottom">© ${new Date().getFullYear()} MUVY · muvy.shop</div>
      </div></footer>`;
    updateCount();
  }

  function card(p) {
    const from = p.type === "VARIABLE" && new Set(p.variations.map((v) => v.price)).size > 1 ? "<small>desde </small>" : "";
    return `
      <article class="card">
        <a class="card-media" href="/producto?id=${p.id}">
          <span class="card-tag">${esc(p.category)}</span>
          ${p.inStock ? "" : '<span class="card-tag out">Agotado</span>'}
          ${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">` : ""}
        </a>
        <div class="card-body">
          <a class="card-title" href="/producto?id=${p.id}">${esc(p.name)}</a>
          <div class="card-price">${from}${money(p.price)}</div>
          ${p.inStock ? `<button class="card-add" data-add="${p.id}">${p.type === "VARIABLE" ? "Ver opciones" : "Agregar al carrito"}</button>` : ""}
        </div>
      </article>`;
  }

  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-add]");
    if (!b) return;
    const p = byId(b.dataset.add);
    if (p.type === "VARIABLE") { location.href = "/producto?id=" + p.id; return; }
    addToCart(p.id);
  });

  /* ---------- Páginas ---------- */
  async function home() {
    $("#featured").innerHTML = skeleton(4);
    try { await loadProducts(); } catch (e) { $("#featured").innerHTML = errorBox(e.message); return; }
    const featured = PRODUCTS.filter((p) => p.featured);
    $("#featured").innerHTML = (featured.length ? featured : PRODUCTS.slice(0, 4)).map(card).join("");
    const cats = [...new Set(PRODUCTS.map((p) => p.category))];
    $("#cats").innerHTML = cats.slice(0, 8).map((c) => {
      const n = PRODUCTS.filter((p) => p.category === c).length;
      return `<a class="cat" href="/catalogo?cat=${encodeURIComponent(c)}"><b>${esc(c)}</b><span>${n} producto${n > 1 ? "s" : ""}</span></a>`;
    }).join("");
    const hero = featured[0] || PRODUCTS[0];
    if (hero && hero.image && $("#hero-img")) $("#hero-img").src = hero.image;
  }

  async function catalog() {
    $("#grid").innerHTML = skeleton(8);
    try { await loadProducts(); } catch (e) { $("#grid").innerHTML = errorBox(e.message); return; }
    const params = new URLSearchParams(location.search);
    let active = params.get("cat") || "Todo";
    let q = "";
    const cats = ["Todo", ...new Set(PRODUCTS.map((p) => p.category))];
    const draw = () => {
      $("#filters").innerHTML = cats.map((c) => `<button class="chip ${c === active ? "active" : ""}" data-cat="${esc(c)}">${esc(c)}</button>`).join("");
      const list = PRODUCTS.filter((p) =>
        (active === "Todo" || p.category === active) &&
        (!q || (p.name + " " + p.category).toLowerCase().includes(q))
      );
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
    draw();
  }

  async function product() {
    const root = $("#product");
    root.innerHTML = `<div class="product-media skel"></div><div><div class="skel skel-line"></div><div class="skel skel-line short"></div></div>`;
    try { await loadProducts(); } catch (e) { root.innerHTML = errorBox(e.message); return; }
    const p = byId(new URLSearchParams(location.search).get("id"));
    if (!p) {
      root.innerHTML = `<div class="empty" style="grid-column:1/-1"><p>No encontramos este producto.</p><a class="btn btn-primary" href="/catalogo">Ver catálogo</a></div>`;
      return;
    }
    document.title = p.name + " · MUVY";
    $("#crumb-name").textContent = p.name;

    // Opciones agrupadas por atributo (Medida, Color…) cuando Dropi las trae.
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
    let qty = 1;
    let img = 0;

    const current = () => {
      if (p.type !== "VARIABLE") return null;
      if (!grouped) return available.find((v) => v.id === variationId) || null;
      return available.find((v) => groups.every((g) => v.attrs[g] === sel[g])) || null;
    };
    const valuesFor = (g) => [...new Set(available.map((v) => v.attrs[g]))];

    const draw = () => {
      const v = current();
      const price = v ? v.price : p.price;
      const canBuy = p.type === "VARIABLE" ? Boolean(v) : p.inStock;
      const gallery = p.images.length > 1 ? `<div class="thumbs">${p.images.slice(0, 6).map((src, i) => `<button class="thumb ${i === img ? "active" : ""}" data-img="${i}"><img src="${esc(src)}" alt=""></button>`).join("")}</div>` : "";
      root.innerHTML = `
        <div>
          <div class="product-media">${p.images[img] ? `<img src="${esc(p.images[img])}" alt="${esc(p.name)}">` : ""}</div>
          ${gallery}
        </div>
        <div>
          <div class="eyebrow">${esc(p.category)}</div>
          <h1>${esc(p.name)}</h1>
          <div class="product-price">${money(price)}</div>
          ${p.description ? `<p class="product-desc">${esc(p.description).replace(/\n/g, "<br>")}</p>` : ""}
          ${p.type === "VARIABLE" ? (grouped
            ? groups.map((g) => `<div class="opt"><div class="opt-label">${esc(g)}: ${esc(sel[g])}</div>
                <div class="opt-values">${valuesFor(g).map((val) => `<button class="chip ${sel[g] === val ? "active" : ""}" data-g="${esc(g)}" data-val="${esc(val)}">${esc(val)}</button>`).join("")}</div></div>`).join("")
            : `<div class="opt"><div class="opt-label">Opción</div><div class="opt-values">${available.map((x) => `<button class="chip ${x.id === variationId ? "active" : ""}" data-v="${x.id}">${esc(x.label)}</button>`).join("")}</div></div>`) : ""}
          ${p.type === "VARIABLE" && !v ? `<p class="note" style="text-align:left">Esa combinación no está disponible, prueba otra.</p>` : ""}
          ${canBuy ? `
          <div class="buy-row">
            <div class="qty"><button data-q="-1" aria-label="Menos">−</button><span>${qty}</span><button data-q="1" aria-label="Más">+</button></div>
            <button class="btn btn-primary" id="add">Agregar al carrito</button>
          </div>
          <button class="btn btn-ghost btn-block" id="buy" style="margin-top:12px">Comprar ahora</button>`
          : (p.type === "VARIABLE" && available.length ? "" : `<div class="buy-row"><span class="btn btn-ghost btn-block" style="cursor:default">Agotado</span></div>`)}
          <div class="assure">
            <div>🚚 Envío a toda Colombia</div>
            <div>💵 Pagas en efectivo cuando lo recibes</div>
            <div>📦 Te llamamos para confirmar tu pedido</div>
          </div>
        </div>`;
    };
    root.addEventListener("click", (e) => {
      const g = e.target.closest("[data-g]");
      if (g) { sel[g.dataset.g] = g.dataset.val; draw(); return; }
      const vb = e.target.closest("[data-v]");
      if (vb) { variationId = Number(vb.dataset.v); draw(); return; }
      const t = e.target.closest("[data-img]");
      if (t) { img = Number(t.dataset.img); draw(); return; }
      const qb = e.target.closest("[data-q]");
      if (qb) { qty = Math.max(1, Math.min(20, qty + Number(qb.dataset.q))); draw(); return; }
      const v = current();
      if (e.target.closest("#add")) addToCart(p.id, qty, v ? v.id : null);
      if (e.target.closest("#buy")) { addToCart(p.id, qty, v ? v.id : null); location.href = "/carrito"; }
    });
    draw();

    $("#related").innerHTML = PRODUCTS.filter((x) => x.id !== p.id && x.inStock).slice(0, 4).map(card).join("");
  }

  async function cartPage() {
    $("#cart-items").innerHTML = `<div class="skel skel-line"></div><div class="skel skel-line short"></div>`;
    try {
      const [, deps] = await Promise.all([loadProducts(), api("/api/departments")]);
      $("#departamento").innerHTML = `<option value="">Elige tu departamento</option>` +
        deps.departments.map((d) => `<option value="${d.code}">${esc(d.name)}</option>`).join("");
    } catch (e) {
      $("#cart-layout").innerHTML = errorBox(e.message);
      return;
    }
    // Quita del carrito lo que ya no existe en Dropi.
    saveCart(getCart().filter((i) => itemInfo(i)));

    const draw = () => {
      const cart = getCart();
      if (!cart.length) {
        $("#cart-layout").innerHTML = `<div class="empty" style="grid-column:1/-1"><p>Tu carrito está vacío.</p><a class="btn btn-primary" href="/catalogo">Ir al catálogo</a></div>`;
        return;
      }
      $("#cart-items").innerHTML = cart.map((i, idx) => {
        const info = itemInfo(i);
        const { p } = info;
        return `<div class="cart-item">
          ${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}">` : "<div></div>"}
          <div>
            <h3>${esc(p.name)}</h3>
            <div class="meta">${esc(info.label || p.category)} · ${money(info.price)}</div>
            ${info.stock < i.qty ? `<div class="meta" style="color:var(--clay)">Solo quedan ${info.stock} disponibles</div>` : ""}
            <div class="controls">
              <div class="qty"><button data-i="${idx}" data-d="-1">−</button><span>${i.qty}</span><button data-i="${idx}" data-d="1">+</button></div>
              <button class="remove" data-rm="${idx}">Quitar</button>
            </div>
          </div>
          <div class="line-total">${money(info.price * i.qty)}</div>
        </div>`;
      }).join("");
      const total = cart.reduce((s, i) => s + itemInfo(i).price * i.qty, 0);
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
        customer: {
          nombre: f.get("nombre"), telefono: f.get("telefono"), departamento: f.get("departamento"),
          ciudad: f.get("ciudad"), direccion: f.get("direccion"), notas: f.get("notas"), email: f.get("email")
        },
        items: getCart().map((i) => ({ id: i.id, variationId: i.variationId, qty: i.qty }))
      };
      btn.disabled = true;
      btn.textContent = "Enviando pedido…";
      try {
        const res = await api("/api/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
        saveCart([]);
        const partial = res.failed && res.failed.length
          ? `<p class="note" style="color:var(--clay)">No pudimos registrar: ${esc(res.failed.flatMap((x) => x.items).join(", "))}. Escríbenos por WhatsApp y lo resolvemos.</p>` : "";
        $("#cart-layout").innerHTML = `
          <div class="done" style="grid-column:1/-1">
            <div class="done-icon">✓</div>
            <h2 class="page-title">¡Pedido recibido!</h2>
            <p>Tu número de pedido es <b>${esc(res.reference)}</b>. Total a pagar al recibir: <b>${money(res.total)}</b>.</p>
            <p>Te llamaremos al ${esc(payload.customer.telefono)} para confirmar el envío.</p>
            ${partial}
            <div class="hero-actions" style="justify-content:center">
              <a class="btn btn-primary" href="/catalogo">Seguir comprando</a>
              <a class="btn btn-ghost" href="${waLink("Hola MUVY, hice el pedido " + res.reference)}" target="_blank" rel="noopener">Escribir por WhatsApp</a>
            </div>
          </div>`;
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err) {
        msg.textContent = err.message;
        btn.disabled = false;
        btn.textContent = "Confirmar pedido";
      }
    });
    draw();
  }

  renderShell();
  ({ home, catalog, product, cart: cartPage }[document.body.dataset.page] || (() => {}))();
})();
