# Radar de mercado MUVY

Bot que corre solo en GitHub Actions cada 6 horas y deja un reporte en
[`reportes/ultimo.md`](reportes/ultimo.md). En cada revisión:

1. **Productos de la tienda** (`src/catalog.js`): lee de Dropi el costo, precio sugerido y stock,
   calcula la ganancia esperada con las reglas de MUVY y compara con los precios de MercadoLibre.
2. **Oportunidades nuevas**: busca en Dropi con las palabras de `config.js` y muestra los que cumplen
   las reglas, ordenados por puntaje (ganancia, stock, tendencia y ventas de la competencia).
3. **Tendencias**: lo más buscado en Colombia en Google y, con token, en MercadoLibre. 🔥 marca los
   productos que coinciden.
4. **Alertas por correo**: si algo cambió desde la revisión anterior, te manda un correo con el reporte.
   Si nada cambió, no escribe. Cuenta como cambio: costo en Dropi, stock bajo el mínimo o recuperado,
   un producto que deja de cumplir (o vuelve a cumplir) las reglas, la competencia de MercadoLibre
   moviendo precios 10% o más, el precio recomendado cambiando 5% o más, un producto que entra en
   tendencia y oportunidades nuevas en Dropi. Los umbrales están en `cambios.js`.

## Reglas (en `config.js`)

- Flete $15.000 ida + $15.000 devolución, 30% de pedidos devueltos.
- Ganancia esperada = 70% × (precio − costo − 15.000) − 30% × 30.000.
- Solo se aprueba con ganancia esperada ≥ $15.000 y stock ≥ 60 unidades. Se apunta a precios de ~$100.000.
- Precio recomendado: 5% por debajo de la mediana de MercadoLibre, nunca por debajo del mínimo rentable.

## Configuración (una sola vez)

En GitHub → **Settings → Secrets and variables → Actions → New repository secret**:

| Secreto | Para qué | Obligatorio |
|---|---|---|
| `DROPI_TOKEN` | El mismo token de integración que usa la tienda (Dropi → Mis tiendas) | Sí |
| `ML_ACCESS_TOKEN` | Precios y tendencias de MercadoLibre (app en developers.mercadolibre.com.co) | Recomendado |
| `CORREO_USUARIO` | La cuenta de Gmail que envía los avisos (ej. tucorreo@gmail.com) | Para correos |
| `CORREO_CLAVE` | Contraseña de aplicación de esa cuenta (no tu contraseña normal; ver abajo) | Para correos |
| `CORREO_DESTINO` | A quién llegan los avisos; varios separados por coma. Si no lo pones, llega a `CORREO_USUARIO` | No |

### Contraseña de aplicación de Gmail

1. Activa la verificación en dos pasos en myaccount.google.com → Seguridad.
2. Entra a myaccount.google.com/apppasswords, crea una llamada "Radar MUVY" y copia las 16 letras.
3. Pégalas (sin espacios) en el secreto `CORREO_CLAVE`.

Luego en **Actions → Radar de mercado → Run workflow** para la primera revisión.

## Probar sin conexión

```bash
node bot/mercado/index.js --demo
```

Usa datos inventados y escribe `reportes/ultimo-demo.md` (no se sube al repositorio).
