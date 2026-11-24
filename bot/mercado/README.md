# Radar de mercado MUVY

Bot que corre solo en GitHub Actions cada 6 horas y deja un reporte en
[`reportes/ultimo.md`](reportes/ultimo.md). En cada revisión:

1. **Productos de la tienda** (`src/catalog.js`): lee de Dropi el costo, precio sugerido y stock,
   calcula la ganancia esperada con las reglas de MUVY y compara con los precios de MercadoLibre.
2. **Oportunidades nuevas**: busca en Dropi con las palabras de `config.js` y muestra los que cumplen
   las reglas, ordenados por puntaje (ganancia, stock, tendencia y ventas de la competencia).
3. **Tendencias**: lo más buscado en Colombia en Google y, con token, en MercadoLibre. 🔥 marca los
   productos que coinciden.
4. **Alertas**: avisa si un producto de la tienda cambió de costo en Dropi o se quedó sin stock.

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

Luego en **Actions → Radar de mercado → Run workflow** para la primera revisión.

## Probar sin conexión

```bash
node bot/mercado/index.js --demo
```

Usa datos inventados y escribe `reportes/ultimo-demo.md` (no se sube al repositorio).
