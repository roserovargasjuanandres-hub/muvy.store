# MUVY

Tienda virtual de productos para el hogar — [muvy.shop](https://muvy.shop).

Sitio estático publicado en Cloudflare Workers. Los pedidos llegan por WhatsApp con pago contra entrega; los productos vienen de Dropi.

## Estructura

```
public/
  index.html        Inicio
  catalogo.html     Catálogo con filtros y buscador
  producto.html     Detalle de producto (?id=...)
  carrito.html      Carrito y formulario de pedido
  assets/
    config.js       Nombre, WhatsApp y costo de envío
    products.js     Lista de productos
    app.js          Lógica de la tienda
    styles.css      Estilos
wrangler.jsonc      Configuración de Cloudflare
```

## Cambios frecuentes

- **Número de WhatsApp:** `public/assets/config.js` → `whatsapp`.
- **Agregar o quitar productos:** `public/assets/products.js`.

Cada cambio que se sube a la rama `main` se publica solo en Cloudflare.
