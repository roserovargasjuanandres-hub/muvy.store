import { REGLAS } from "./config.js";

const redondear = (n, paso = 100) => Math.ceil(n / paso) * paso;

// Ganancia esperada por pedido despachado (contraentrega):
//   entregado  -> precio - costo - flete de ida
//   devuelto   -> se pierde flete de ida + flete de devolución
export function gananciaEsperada(precio, costo, r = REGLAS) {
  const entregado = (1 - r.tasaDevolucion) * (precio - costo - r.fleteIda);
  const devuelto = r.tasaDevolucion * (r.fleteIda + r.fleteDevolucion);
  return Math.round(entregado - devuelto);
}

// Precio más bajo que todavía deja la ganancia mínima.
export function precioMinimo(costo, r = REGLAS) {
  const perdidaDevueltos = r.tasaDevolucion * (r.fleteIda + r.fleteDevolucion);
  return redondear((r.gananciaMinima + perdidaDevueltos) / (1 - r.tasaDevolucion) + costo + r.fleteIda);
}

export function mediana(nums) {
  const v = nums.filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : Math.round((v[m - 1] + v[m]) / 2);
}

// Precio recomendado: un poco por debajo de la competencia, nunca por debajo del mínimo rentable.
export function precioRecomendado({ costo, sugeridoDropi, competencia, precioActual }, r = REGLAS) {
  const minimo = precioMinimo(costo, r);
  let base = competencia?.mediana ? competencia.mediana * (1 - r.margenBajoCompetencia) : sugeridoDropi || r.precioObjetivo;
  // Si ya vendemos por debajo de la competencia, no recomendamos bajar más.
  if (precioActual && competencia?.mediana && precioActual <= competencia.mediana) base = precioActual + 100;
  base = Math.max(base, minimo);
  // Termina en 900 (ej. 99.900), como el resto de la tienda.
  return Math.max(minimo, Math.floor(base / 1000) * 1000 - 100);
}

// Evalúa un producto y devuelve el veredicto con sus razones.
export function evaluar(p, r = REGLAS) {
  const precio = p.precioActual ?? precioRecomendado(p, r);
  const ganancia = gananciaEsperada(precio, p.costo, r);
  const avisos = [];
  if (p.stock < r.stockMinimo) avisos.push(`stock bajo (${p.stock} < ${r.stockMinimo})`);
  if (ganancia < r.gananciaMinima) avisos.push(`ganancia esperada baja ($${fmt(ganancia)})`);
  if (precio < r.precioObjetivo * 0.95) avisos.push(`precio bajo $${fmt(r.precioObjetivo)}`);
  if (p.competencia?.minimo && precio > p.competencia.minimo * 1.25) avisos.push(`25%+ más caro que el más barato de MercadoLibre ($${fmt(p.competencia.minimo)})`);

  const bloqueante = p.stock < r.stockMinimo || ganancia < r.gananciaMinima;
  const recomendado = precioRecomendado(p, r);
  return {
    ...p,
    precioEvaluado: precio,
    gananciaEsperada: ganancia,
    precioMinimo: precioMinimo(p.costo, r),
    precioRecomendado: recomendado,
    gananciaConRecomendado: gananciaEsperada(recomendado, p.costo, r),
    apto: !bloqueante,
    avisos,
    puntaje: puntaje(p, ganancia)
  };
}

// Puntaje 0-100 para ordenar oportunidades: ganancia, stock, tendencia y competencia.
function puntaje(p, ganancia) {
  let s = 0;
  s += Math.min(40, Math.max(0, ganancia) / 1000);           // hasta 40 pts: $40.000 de ganancia esperada
  s += Math.min(15, (p.stock || 0) / 20);                     // hasta 15 pts: 300+ unidades
  s += p.enTendencia ? 20 : 0;                                // 20 pts si aparece en Google Tendencias
  if (p.competencia?.vendidos) s += Math.min(15, Math.log10(p.competencia.vendidos + 1) * 5);
  if (p.competencia?.mediana && p.costo) s += Math.min(10, ((p.competencia.mediana - p.costo) / p.costo) * 5);
  return Math.round(Math.min(100, s));
}

export const fmt = (n) => (n == null ? "—" : Math.round(n).toLocaleString("es-CO"));
