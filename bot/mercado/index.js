// Radar de Mercado MUVY
// Revisa los productos de la tienda y busca nuevos en Dropi, compara precios con MercadoLibre,
// cruza con lo que está en tendencia en Colombia y escribe un reporte en bot/mercado/reportes/.
//
//   node bot/mercado/index.js          -> datos reales (necesita DROPI_TOKEN)
//   node bot/mercado/index.js --demo   -> datos de ejemplo, para probar sin conexión

import { mkdir, readFile, writeFile, appendFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CATALOG } from "../../src/catalog.js";
import { REGLAS, PALABRAS_CLAVE, RESULTADOS_POR_PALABRA } from "./config.js";
import { evaluar, fmt } from "./analisis.js";
import { detectarCambios, tablaComparativa, tablaMarkdown, tablaCSV } from "./cambios.js";
import * as reales from "./fuentes/index.js";
import * as demo from "./fuentes/demo.js";

const AQUI = dirname(fileURLToPath(import.meta.url));
const DIR_REPORTES = join(AQUI, "reportes");
const MODO_DEMO = process.argv.includes("--demo");
const F = MODO_DEMO ? demo : reales;
const errores = [];

async function intentar(etiqueta, fn, porDefecto) {
  try {
    return await fn();
  } catch (e) {
    errores.push(`${etiqueta}: ${e.message}`);
    return porDefecto;
  }
}

const quitarTildes = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Un producto está en tendencia si el nombre contiene las palabras importantes de una búsqueda
// (todas si la búsqueda tiene una o dos, al menos dos si tiene más).
const significativas = (s) => quitarTildes(s).split(/[^a-z0-9ñ]+/).filter((w) => w.length > 3);
function enTendencia(nombre, terminos) {
  const delNombre = new Set(significativas(nombre));
  return terminos.find((t) => {
    const ws = significativas(t);
    const coinciden = ws.filter((w) => delNombre.has(w)).length;
    return ws.length && coinciden >= Math.min(2, ws.length);
  }) || null;
}

async function main() {
  const inicio = new Date();

  // 1. Qué está buscando la gente
  const google = await intentar("Google Tendencias", F.tendenciasGoogle, []);
  const ml = await intentar("Tendencias MercadoLibre", F.tendenciasML, []);
  const terminos = [...google.map((g) => g.termino), ...ml];

  // 2. Productos actuales de la tienda
  const tienda = [];
  for (const entrada of CATALOG) {
    const p = await intentar(`Dropi ${entrada.dropiId}`, () => F.producto(entrada.dropiId), null);
    if (!p) continue;
    const nombre = entrada.name || p.nombre;
    const competencia = await intentar(`MercadoLibre "${nombre}"`, () => F.competencia(nombre), null);
    const tendencia = enTendencia(nombre, terminos);
    tienda.push(evaluar({ ...p, nombre, precioActual: entrada.price ?? p.sugeridoDropi, competencia, enTendencia: tendencia }));
  }

  // 3. Productos nuevos en Dropi que cumplen las reglas
  const enTienda = new Set(CATALOG.map((c) => c.dropiId));
  const vistos = new Map();
  for (const palabra of PALABRAS_CLAVE) {
    const lista = await intentar(`Búsqueda Dropi "${palabra}"`, () => F.buscar(palabra, RESULTADOS_POR_PALABRA), []);
    for (const p of lista) {
      if (enTienda.has(p.dropiId) || vistos.has(p.dropiId) || p.stock < REGLAS.stockMinimo) continue;
      vistos.set(p.dropiId, p);
    }
  }
  // Solo consulta competencia de los 20 con mejor margen sugerido, para no saturar las APIs.
  const preseleccion = [...vistos.values()]
    .sort((a, b) => (b.sugeridoDropi || 0) - b.costo - ((a.sugeridoDropi || 0) - a.costo))
    .slice(0, 20);
  const nuevos = [];
  for (const p of preseleccion) {
    const competencia = await intentar(`MercadoLibre "${p.nombre}"`, () => F.competencia(p.nombre), null);
    nuevos.push(evaluar({ ...p, competencia, enTendencia: enTendencia(p.nombre, terminos) }));
  }
  const oportunidades = nuevos.filter((n) => n.apto).sort((a, b) => b.puntaje - a.puntaje);

  // 4. Cambios desde la última revisión
  const sufijo = MODO_DEMO ? "-demo" : "";
  const anterior = await readFile(join(DIR_REPORTES, `ultimo${sufijo}.json`), "utf8").then(JSON.parse).catch(() => null);
  const cambios = detectarCambios(anterior, { tienda, oportunidades });
  // Tabla de valores antes/ahora: solo cuando algo cambió.
  const comparacion = cambios.length ? tablaComparativa(anterior, tienda) : [];

  const resultado = { fecha: inicio.toISOString(), demo: MODO_DEMO, reglas: REGLAS, tendencias: { google, mercadolibre: ml }, tienda, oportunidades, cambios, comparacion, fechaAnterior: anterior?.fecha || null, errores };
  const md = reporte(resultado);

  await mkdir(join(DIR_REPORTES, "historial"), { recursive: true });
  await writeFile(join(DIR_REPORTES, `ultimo${sufijo}.md`), md);
  await writeFile(join(DIR_REPORTES, `ultimo${sufijo}.json`), JSON.stringify(resultado, null, 2));
  if (comparacion.length) {
    // Se guarda cada comparación con su fecha, y una copia fija con la más reciente.
    const csv = tablaCSV(comparacion, resultado.fecha, resultado.fechaAnterior);
    const dirComp = join(DIR_REPORTES, MODO_DEMO ? "comparaciones-demo" : "comparaciones");
    await mkdir(dirComp, { recursive: true });
    await writeFile(join(dirComp, `${resultado.fecha.slice(0, 13)}h.csv`), csv);
    await writeFile(join(DIR_REPORTES, `comparacion-ultima${sufijo}.csv`), csv);
  }
  if (!MODO_DEMO) await writeFile(join(DIR_REPORTES, "historial", `${inicio.toISOString().slice(0, 13)}h.json`), JSON.stringify(resultado));
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, md);

  // Correo: solo si algo cambió (o es la primera revisión). El workflow lo envía.
  const enviar = !anterior || cambios.length > 0;
  const titulo = !anterior
      ? "Radar MUVY: primera revisión del mercado"
      : `Radar MUVY: ${cambios.length} cambio${cambios.length === 1 ? "" : "s"} en el mercado`;
  if (enviar) {
    await writeFile(join(process.env.RUNNER_TEMP || AQUI, "correo.md"), md);
    await writeFile(join(process.env.RUNNER_TEMP || AQUI, "correo-asunto.txt"), titulo);
  }
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `enviar_correo=${enviar}\n${enviar ? `asunto=${titulo}\n` : ""}`);

  console.log(md);
  // Si no se pudo leer ni un producto de Dropi, la ejecución falla para que GitHub avise.
  if (!tienda.length && !MODO_DEMO) process.exitCode = 1;
}

function reporte({ fecha, demo, tienda, oportunidades, cambios, comparacion, fechaAnterior, tendencias, errores }) {
  const hora = new Date(fecha).toLocaleString("es-CO", { timeZone: "America/Bogota" });
  const l = [];
  l.push(`# Radar de mercado MUVY${demo ? " (DEMO)" : ""}`, "", `Revisión: ${hora}`, "");

  if (cambios.length) l.push("## ⚠️ Cambios desde la última revisión", "", ...cambios.map((c) => `- ${c}`), "");
  if (comparacion?.length) l.push(tablaMarkdown(comparacion, fechaAnterior));

  l.push("## Productos de la tienda", "");
  l.push("| Producto | Costo | Precio actual | Ganancia esp. | ML mín / mediana | Precio recomendado | Stock | Estado |");
  l.push("|---|---:|---:|---:|---:|---:|---:|---|");
  for (const p of [...tienda].sort((a, b) => a.gananciaEsperada - b.gananciaEsperada)) {
    const c = p.competencia;
    const estado = p.apto ? (p.avisos.length ? "🟡 " + p.avisos.join("; ") : "🟢 OK") : "🔴 " + p.avisos.join("; ");
    l.push(`| ${p.nombre}${p.enTendencia ? " 🔥" : ""} | $${fmt(p.costo)} | $${fmt(p.precioEvaluado)} | $${fmt(p.gananciaEsperada)} | ${c?.minimo ? `$${fmt(c.minimo)} / $${fmt(c.mediana)}` : "—"} | $${fmt(p.precioRecomendado)} | ${p.stock} | ${estado} |`);
  }
  l.push("");

  l.push("## Oportunidades nuevas en Dropi", "");
  if (!oportunidades.length) l.push("Ninguna cumple las reglas en esta revisión.", "");
  else {
    l.push("| Puntaje | Producto (ID Dropi) | Costo | Precio recomendado | Ganancia esp. | ML mediana | Stock |");
    l.push("|---:|---|---:|---:|---:|---:|---:|");
    for (const p of oportunidades.slice(0, 15)) {
      l.push(`| ${p.puntaje} | ${p.nombre}${p.enTendencia ? " 🔥" : ""} (${p.dropiId}) | $${fmt(p.costo)} | $${fmt(p.precioRecomendado)} | $${fmt(p.gananciaConRecomendado)} | ${p.competencia?.mediana ? "$" + fmt(p.competencia.mediana) : "—"} | ${p.stock} |`);
    }
    l.push("");
  }

  const top = tendencias.google.slice(0, 10).map((t) => t.termino + (t.trafico ? ` (${t.trafico})` : ""));
  if (top.length || tendencias.mercadolibre.length) {
    l.push("## En tendencia en Colombia", "");
    if (top.length) l.push(`- **Google:** ${top.join(", ")}`);
    if (tendencias.mercadolibre.length) l.push(`- **MercadoLibre:** ${tendencias.mercadolibre.slice(0, 15).join(", ")}`);
    l.push("");
  }

  l.push(`<sub>Reglas: flete $${fmt(REGLAS.fleteIda)} ida + $${fmt(REGLAS.fleteDevolucion)} devolución, ${REGLAS.tasaDevolucion * 100}% devoluciones, ganancia mínima $${fmt(REGLAS.gananciaMinima)}, stock mínimo ${REGLAS.stockMinimo}. 🔥 = coincide con una búsqueda en tendencia.</sub>`, "");
  if (errores.length) l.push("<details><summary>Fuentes que fallaron</summary>", "", ...errores.map((e) => `- ${e}`), "", "</details>", "");
  return l.join("\n");
}

main();
