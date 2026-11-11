(function () {
  const CFG = window.MUVY_CONFIG;
  const PRODUCTS = window.MUVY_PRODUCTS;
  const CART_KEY = "muvy_cart";

  const money = (n) => "$" + Math.round(n).toLocaleString("es-CO");
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const byId = (id) => PRODUCTS.find((p) => p.id === id);

  /* ---------- Carrito ---------- */
  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; }
  }
  function saveCart(cart) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {}
    updateCount();
  }
  function priceFor(p, opts) {
    if (p.options && p.options.Medida && opts && opts.Medida) return p.options.Medida[opts.Medida];
    return p.price;
  }
  function addToCart(id, qty = 1, opts = {}) {
    const p = byId(id);
    const key = id + "|" + JSON.stringify(opts);
    const cart = getCart();
    const found = cart.find((i) => i.key === key);
    if (found) found.qty += qty;
    else cart.push({ key, id, qty, opts, price: priceFor(p, opts) });
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

  /* ---------- Estructura común ---------- */
  function renderShell() {
    const page = document.body.dataset.page;
    const navLink = (href, label, key) => `<a href="${href}" class="${page === key ? "active" : ""}">${label}</a>`;
    $("#header").innerHTML = `
      <div class="announce">Envío gratis a toda Colombia · Pagas al recibir</div>
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
          <a href="https://wa.me/${CFG.whatsapp}" target="_blank" rel="noopener">WhatsApp</a>
          <a href="/carrito">Mi carrito</a>
        </div>
        <div class="footer-bottom">© ${new Date().getFullYear()} MUVY · muvy.shop</div>
      </div></footer>`;
    updateCount();
  }

  function card(p) {
    const from = p.options && p.options.Medida ? "<small>desde </small>" : "";
    return `
      <article class="card">
        <a class="card-media" href="/producto?id=${p.id}">
          <span class="card-tag">${esc(p.category)}</span>
          <img src="${p.image}" alt="${esc(p.name)}" loading="lazy">
        </a>
        <div class="card-body">
          <a class="card-title" href="/producto?id=${p.id}">${esc(p.name)}</a>
          <div class="card-price">${from}${money(p.price)}</div>
          <button class="card-add" data-add="${p.id}">${p.options ? "Ver opciones" : "Agregar al carrito"}</button>
        </div>
      </article>`;
  }

  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-add]");
    if (!b) return;
    const p = byId(b.dataset.add);
    if (p.options) { location.href = "/producto?id=" + p.id; return; }
    addToCart(p.id);
  });

  /* ---------- Páginas ---------- */
  function home() {
    $("#featured").innerHTML = PRODUCTS.filter((p) => p.featured).map(card).join("");
    const cats = [...new Set(PRODUCTS.map((p) => p.category))];
    $("#cats").innerHTML = cats.slice(0, 8).map((c) => {
      const n = PRODUCTS.filter((p) => p.category === c).length;
      return `<a class="cat" href="/catalogo?cat=${encodeURIComponent(c)}"><b>${esc(c)}</b><span>${n} producto${n > 1 ? "s" : ""}</span></a>`;
    }).join("");
  }

  function catalog() {
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
      $("#grid").innerHTML = list.length ? list.map(card).join("") : "";
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

  function product() {
    const p = byId(new URLSearchParams(location.search).get("id"));
    const root = $("#product");
    if (!p) {
      root.innerHTML = `<div class="empty"><p>No encontramos este producto.</p><a class="btn btn-primary" href="/catalogo">Ver catálogo</a></div>`;
      return;
    }
    document.title = p.name + " · MUVY";
    const opts = {};
    let qty = 1;
    const optNames = p.options ? Object.keys(p.options) : [];
    optNames.forEach((k) => {
      const v = p.options[k];
      opts[k] = Array.isArray(v) ? v[0] : Object.keys(v)[0];
    });

    const draw = () => {
      $("#crumb-name").textContent = p.name;
      root.innerHTML = `
        <div class="product-media"><img src="${p.image}" alt="${esc(p.name)}"></div>
        <div>
          <div class="eyebrow">${esc(p.category)}</div>
          <h1>${esc(p.name)}</h1>
          <div class="product-price">${money(priceFor(p, opts))}</div>
          <p class="product-desc">${esc(p.description)}</p>
          ${optNames.map((k) => {
            const vals = Array.isArray(p.options[k]) ? p.options[k] : Object.keys(p.options[k]);
            return `<div class="opt"><div class="opt-label">${esc(k)}: ${esc(opts[k])}</div>
              <div class="opt-values">${vals.map((v) => `<button class="chip ${opts[k] === v ? "active" : ""}" data-opt="${esc(k)}" data-val="${esc(v)}">${esc(v)}</button>`).join("")}</div></div>`;
          }).join("")}
          <div class="buy-row">
            <div class="qty"><button data-q="-1" aria-label="Menos">−</button><span>${qty}</span><button data-q="1" aria-label="Más">+</button></div>
            <button class="btn btn-primary" id="add">Agregar al carrito</button>
          </div>
          <button class="btn btn-ghost btn-block" id="buy" style="margin-top:12px">Comprar ahora</button>
          <div class="assure">
            <div>🚚 Envío gratis a toda Colombia</div>
            <div>💵 Pagas en efectivo cuando lo recibes</div>
            <div>💬 Te confirmamos tu pedido por WhatsApp</div>
          </div>
        </div>`;
    };
    root.addEventListener("click", (e) => {
      const o = e.target.closest("[data-opt]");
      if (o) { opts[o.dataset.opt] = o.dataset.val; draw(); return; }
      const qb = e.target.closest("[data-q]");
      if (qb) { qty = Math.max(1, qty + Number(qb.dataset.q)); draw(); return; }
      if (e.target.closest("#add")) addToCart(p.id, qty, { ...opts });
      if (e.target.closest("#buy")) { addToCart(p.id, qty, { ...opts }); location.href = "/carrito"; }
    });
    draw();

    $("#related").innerHTML = PRODUCTS.filter((x) => x.id !== p.id).slice(0, 4).map(card).join("");
  }

  function cartPage() {
    const draw = () => {
      const cart = getCart();
      const list = $("#cart-items");
      if (!cart.length) {
        $("#cart-layout").innerHTML = `<div class="empty" style="grid-column:1/-1"><p>Tu carrito está vacío.</p><a class="btn btn-primary" href="/catalogo">Ir al catálogo</a></div>`;
        return;
      }
      list.innerHTML = cart.map((i, idx) => {
        const p = byId(i.id);
        if (!p) return "";
        const optText = Object.entries(i.opts || {}).map(([k, v]) => `${k}: ${v}`).join(" · ");
        return `<div class="cart-item">
          <img src="${p.image}" alt="${esc(p.name)}">
          <div>
            <h3>${esc(p.name)}</h3>
            <div class="meta">${esc(optText) || esc(p.category)} · ${money(i.price)}</div>
            <div class="controls">
              <div class="qty"><button data-i="${idx}" data-d="-1">−</button><span>${i.qty}</span><button data-i="${idx}" data-d="1">+</button></div>
              <button class="remove" data-rm="${idx}">Quitar</button>
            </div>
          </div>
          <div class="line-total">${money(i.price * i.qty)}</div>
        </div>`;
      }).join("");
      const sub = cart.reduce((s, i) => s + i.price * i.qty, 0);
      $("#subtotal").textContent = money(sub);
      $("#shipping").textContent = CFG.shippingCost ? money(CFG.shippingCost) : "Gratis";
      $("#total").textContent = money(sub + CFG.shippingCost);
    };
    $("#cart-items").addEventListener("click", (e) => {
      const cart = getCart();
      const d = e.target.closest("[data-d]");
      const r = e.target.closest("[data-rm]");
      if (d) { const it = cart[d.dataset.i]; it.qty = Math.max(1, it.qty + Number(d.dataset.d)); }
      else if (r) cart.splice(Number(r.dataset.rm), 1);
      else return;
      saveCart(cart); draw();
    });
    $("#checkout").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const cart = getCart();
      const sub = cart.reduce((s, i) => s + i.price * i.qty, 0);
      const lines = cart.map((i) => {
        const p = byId(i.id);
        const o = Object.values(i.opts || {}).join(", ");
        return `• ${i.qty} × ${p.name}${o ? " (" + o + ")" : ""} — ${money(i.price * i.qty)}`;
      });
      const msg = [
        "¡Hola MUVY! Quiero hacer este pedido:",
        "",
        ...lines,
        "",
        "Total: " + money(sub + CFG.shippingCost) + " (pago contra entrega)",
        "",
        "Nombre: " + f.get("nombre"),
        "Teléfono: " + f.get("telefono"),
        "Ciudad: " + f.get("ciudad") + ", " + f.get("departamento"),
        "Dirección: " + f.get("direccion"),
        f.get("notas") ? "Notas: " + f.get("notas") : ""
      ].join("\n");
      window.open("https://wa.me/" + CFG.whatsapp + "?text=" + encodeURIComponent(msg), "_blank");
    });
    draw();
  }

  renderShell();
  ({ home, catalog, product, cart: cartPage }[document.body.dataset.page] || (() => {}))();
})();
