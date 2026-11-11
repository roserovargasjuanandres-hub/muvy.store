# MUVY

Tienda virtual de productos para el hogar — [muvy.shop](https://muvy.shop), conectada a **Dropi**.

- Los productos, fotos, precios, variantes y stock se leen **en vivo desde Dropi** (caché de 10 minutos).
- Cada compra crea el pedido **directamente en Dropi**, contra entrega ("CON RECAUDO"), en estado *Pendiente confirmación*. Si el carrito tiene productos de varios proveedores, se crea un pedido por proveedor.

## Cómo está armado

```
src/
  index.js     Servidor en Cloudflare Workers (API /api/*)
  dropi.js     Conexión con la API de integraciones de Dropi
  catalog.js   Qué productos de Dropi se venden y en qué sección
public/        Páginas de la tienda (inicio, catálogo, producto, carrito)
wrangler.jsonc Configuración de Cloudflare (dominio muvy.shop)
```

## Configuración necesaria

Secreto en Cloudflare (Workers → muvy → Settings → Variables and Secrets):

- `DROPI_TOKEN` — token de integración que da Dropi en **Mis tiendas → Crear tienda**.

## Cambios frecuentes

- **Agregar o quitar productos:** `src/catalog.js` — solo el ID de Dropi y la sección.
- **Precio de venta:** por defecto el sugerido de Dropi; para fijar otro, agrega `price` (y `compareAt` para el precio tachado) en `src/catalog.js`.
- **Combos (ej. 2 por $149.950):** campo `bundle` en `src/catalog.js`.
- **Textos de venta de cada producto** (características, preguntas frecuentes, reseñas): `public/assets/content.js`.
- **Fotos propias:** `public/assets/img/` y el campo `image` en `src/catalog.js`.
- **WhatsApp de atención:** `public/assets/config.js`.

Cada cambio que se sube a `main` se publica solo en Cloudflare.
