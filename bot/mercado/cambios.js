// Compara la revisión actual con la anterior y lista lo que cambió en el mercado.
// Solo cuenta cambios que importan para decidir (no ruido pequeño de precios).

import { REGLAS } from "./config.js";
import { fmt } from "./analisis.js";

const UMBRAL_PRECIO_COMPETENCIA = 0.10;  // la mediana de MercadoLibre se movió 10% o más
const UMBRAL_PRECIO_RECOMENDADO = 0.05;  // el precio recomendado cambió 5% o más

const variacion = (antes, ahora) => (antes && ahora ? (ahora - antes) / antes : 0);
const pct = (v) => `${v > 0 ? "+" : ""}${Math.round(v * 100)}%`;

export function detectarCambios(anterior, { tienda, oportunidades, redes = [] }) {
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

  const redesAntes = new Set((anterior.redes?.ranking || []).slice(0, 5).map((r) => r.producto));
  for (const r of redes.slice(0, 5)) {
    if (anterior.redes && !redesAntes.has(r.producto)) cambios.push(`📱 **${r.producto}** entró al top 5 de redes sociales (${fmt(r.vistas)} vistas)`);
  }

  const idsAntes = new Set((anterior.oportunidades || []).map((o) => o.dropiId));
  for (const o of oportunidades.slice(0, 15)) {
    if (!idsAntes.has(o.dropiId)) cambios.push(`Nueva oportunidad en Dropi: **${o.nombre}** (${o.dropiId}), venderlo a $${fmt(o.precioRecomendado)} deja $${fmt(o.gananciaConRecomendado)} por pedido`);
  }
  return cambios;
}

// Tabla de valores: cada producto de la tienda con lo guardado en la revisión anterior y lo de ahora.
const COLUMNAS = [
  ["costo", "Costo Dropi", (p) => p.costo],
  ["precio", "Precio tienda", (p) => p.precioEvaluado],
  ["recomendado", "Precio recomendado", (p) => p.precioRecomendado],
  ["mlMin", "ML mínimo", (p) => p.competencia?.minimo],
  ["mlMediana", "ML mediana", (p) => p.competencia?.mediana],
  ["ganancia", "Ganancia esperada", (p) => p.gananciaEsperada],
  ["stock", "Stock", (p) => p.stock]
];

export function tablaComparativa(anterior, tienda) {
  if (!anterior) return [];
  const previos = new Map((anterior.tienda || []).map((p) => [p.dropiId, p]));
  return tienda.map((p) => {
    const a = previos.get(p.dropiId);
    const valores = {};
    let cambio = false;
    for (const [clave, , leer] of COLUMNAS) {
      const antes = a ? leer(a) ?? null : null;
      const ahora = leer(p) ?? null;
      valores[clave] = { antes, ahora };
      if (a && antes !== ahora) cambio = true;
    }
    return { dropiId: p.dropiId, nombre: p.nombre, nuevo: !a, cambio: cambio || !a, valores };
  });
}

function celda({ antes, ahora }, dinero) {
  const f = (n) => (n == null ? "—" : dinero ? `$${fmt(n)}` : fmt(n));
  if (antes === ahora) return f(ahora);
  const flecha = antes != null && ahora != null ? (ahora > antes ? " ▲" : " ▼") : "";
  const v = antes && ahora != null ? ` (${pct((ahora - antes) / Math.abs(antes))})` : "";
  return `${f(antes)} → **${f(ahora)}**${flecha}${v}`;
}

// En markdown: primero los productos que cambiaron; los demás quedan resumidos al final.
export function tablaMarkdown(filas, fechaAnterior) {
  if (!filas.length) return "";
  const hora = fechaAnterior ? new Date(fechaAnterior).toLocaleString("es-CO", { timeZone: "America/Bogota" }) : "la revisión anterior";
  const cambiaron = filas.filter((f) => f.cambio);
  const iguales = filas.filter((f) => !f.cambio);
  const l = [`## 📊 Comparación de valores (antes: ${hora})`, ""];
  if (cambiaron.length) {
    l.push(`| Producto | ${COLUMNAS.map((c) => c[1]).join(" | ")} |`);
    l.push(`|---|${COLUMNAS.map(() => "---:").join("|")}|`);
    for (const f of cambiaron) {
      l.push(`| ${f.nombre}${f.nuevo ? " (nuevo)" : ""} | ${COLUMNAS.map(([k]) => celda(f.valores[k], k !== "stock")).join(" | ")} |`);
    }
    l.push("");
  }
  if (iguales.length) l.push(`Sin cambios: ${iguales.map((f) => f.nombre).join(", ")}.`, "");
  return l.join("\n");
}

// En CSV (para Excel o Google Sheets): una fila por producto con antes, ahora y diferencia.
export function tablaCSV(filas, fecha, fechaAnterior) {
  const esc = (v) => (v == null ? "" : /[",;\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
  const enc = ["Fecha", "Fecha anterior", "ID Dropi", "Producto", "Cambió"];
  for (const [, titulo] of COLUMNAS) enc.push(`${titulo} antes`, `${titulo} ahora`, `${titulo} diferencia`);
  const filasCSV = filas.map((f) => {
    const r = [fecha, fechaAnterior || "", f.dropiId, f.nombre, f.cambio ? "sí" : "no"];
    for (const [k] of COLUMNAS) {
      const { antes, ahora } = f.valores[k];
      r.push(antes, ahora, antes != null && ahora != null ? ahora - antes : "");
    }
    return r.map(esc).join(",");
  });
  return "﻿" + [enc.map(esc).join(","), ...filasCSV].join("\n") + "\n";
}
