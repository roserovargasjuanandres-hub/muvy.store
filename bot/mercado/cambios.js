// Compara la revisión actual con la anterior y lista lo que cambió en el mercado.
// Solo cuenta cambios que importan para decidir (no ruido pequeño de precios).

import { REGLAS } from "./config.js";
import { fmt } from "./analisis.js";

const UMBRAL_PRECIO_COMPETENCIA = 0.10;  // la mediana de MercadoLibre se movió 10% o más
const UMBRAL_PRECIO_RECOMENDADO = 0.05;  // el precio recomendado cambió 5% o más

const variacion = (antes, ahora) => (antes && ahora ? (ahora - antes) / antes : 0);
const pct = (v) => `${v > 0 ? "+" : ""}${Math.round(v * 100)}%`;

export function detectarCambios(anterior, { tienda, oportunidades }) {
  if (!anterior) return [];
  const cambios = [];
  const previos = new Map((anterior.tienda || []).map((p) => [p.dropiId, p]));

  for (const p of tienda) {
    const a = previos.get(p.dropiId);
    if (!a) {
      cambios.push(`**${p.nombre}**: se agregó a la tienda`);
      continue;
    }
    if (a.costo !== p.costo) cambios.push(`**${p.nombre}**: costo en Dropi $${fmt(a.costo)} → $${fmt(p.costo)} (ganancia esperada ahora $${fmt(p.gananciaEsperada)})`);
    if (a.stock >= REGLAS.stockMinimo && p.stock < REGLAS.stockMinimo) cambios.push(`**${p.nombre}**: el stock bajó a ${p.stock} unidades (mínimo ${REGLAS.stockMinimo})`);
    if (a.stock < REGLAS.stockMinimo && p.stock >= REGLAS.stockMinimo) cambios.push(`**${p.nombre}**: volvió a tener stock (${p.stock} unidades)`);
    if (a.apto && !p.apto) cambios.push(`**${p.nombre}**: dejó de cumplir las reglas (${p.avisos.join("; ")})`);
    if (!a.apto && p.apto) cambios.push(`**${p.nombre}**: volvió a cumplir las reglas`);

    const vComp = variacion(a.competencia?.mediana, p.competencia?.mediana);
    if (Math.abs(vComp) >= UMBRAL_PRECIO_COMPETENCIA) cambios.push(`**${p.nombre}**: la competencia en MercadoLibre ${vComp > 0 ? "subió" : "bajó"} precios ${pct(vComp)} (mediana $${fmt(p.competencia.mediana)})`);
    const vRec = variacion(a.precioRecomendado, p.precioRecomendado);
    if (Math.abs(vRec) >= UMBRAL_PRECIO_RECOMENDADO) cambios.push(`**${p.nombre}**: precio recomendado $${fmt(a.precioRecomendado)} → $${fmt(p.precioRecomendado)}`);

    if (!a.enTendencia && p.enTendencia) cambios.push(`**${p.nombre}**: 🔥 entró en tendencia ("${p.enTendencia}")`);
  }

  const idsAntes = new Set((anterior.oportunidades || []).map((o) => o.dropiId));
  for (const o of oportunidades.slice(0, 15)) {
    if (!idsAntes.has(o.dropiId)) cambios.push(`Nueva oportunidad en Dropi: **${o.nombre}** (${o.dropiId}), venderlo a $${fmt(o.precioRecomendado)} deja $${fmt(o.gananciaConRecomendado)} por pedido`);
  }
  return cambios;
}
