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
import { REGLAS, PALABRAS_CLAVE, RESULTADOS_POR_PALABRA, PRODUCTOS_REDES, TOP_REDES_A_DROPI } from "./config.js";
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

  // 1b. Redes sociales: qué productos aparecen en videos virales
  const redes = await intentar("Redes sociales", F.investigarRedes, { ranking: [], publicaciones: 0, errores: [] });
  errores.push(...redes.errores.map((e) => `Redes — ${e}`));
  const topRedes = redes.ranking.slice(0, TOP_REDES_A_DROPI);
  const enRedes = (nombre) => topRedes.find((r) => {
    const def = PRODUCTOS_REDES.find((d) => d.producto === r.producto);
    return def && [def.producto, ...def.claves].some((c) => quitarTildes(nombre).includes(quitarTildes(c)));
  })?.producto || null;

  // 2. Productos actuales de la tienda
  const tienda = [];
  for (const entrada of CATALOG) {
    const p = await intentar(`Dropi ${entrada.dropiId}`, () => F.producto(entrada.dropiId), null);
    if (!p) continue;
    const nombre = entrada.name || p.nombre;
    const competencia = await intentar(`MercadoLibre "${nombre}"`, () => F.competencia(nombre), null);
    const tendencia = enTendencia(nombre, terminos);
    tienda.push(evaluar({ ...p, nombre, precioActual: entrada.price ?? p.sugeridoDropi, competencia, enTendencia: tendencia, enRedes: enRedes(nombre) }));
  }

  // 3. Productos nuevos en Dropi que cumplen las reglas
  const enTienda = new Set(CATALOG.map((c) => c.dropiId));
  const vistos = new Map();
  // Primero lo que se mueve en redes, luego las palabras fijas de config.js.
  const busquedas = [
    ...topRedes.map((r) => ({ palabra: PRODUCTOS_REDES.find((d) => d.producto === r.producto).dropi, redes: r.producto })),
    ...PALABRAS_CLAVE.map((palabra) => ({ palabra, redes: null }))
  ];
  const hallazgosRedes = new Map(topRedes.map((r) => [r.producto, { ...r, enDropi: 0, aptos: [] }]));
  for (const { palabra, redes: deRedes } of busquedas) {
    const lista = await intentar(`Búsqueda Dropi "${palabra}"`, () => F.buscar(palabra, RESULTADOS_POR_PALABRA), []);
    if (deRedes) hallazgosRedes.get(deRedes).enDropi = lista.filter((p) => palabra.split(" ").every((w) => quitarTildes(p.nombre).includes(quitarTildes(w).slice(0, 5)))).length;
    for (const p of lista) {
      // Solo cuenta como "de redes" si el nombre en Dropi tiene todas las palabras buscadas.
      if (deRedes && !p.enRedes && palabra.split(" ").every((w) => quitarTildes(p.nombre).includes(quitarTildes(w).slice(0, 5)))) p.enRedes = deRedes;
      if (enTienda.has(p.dropiId) || p.stock < REGLAS.stockMinimo) continue;
      const previo = vistos.get(p.dropiId);
      if (previo) { previo.enRedes ||= p.enRedes; continue; }
      vistos.set(p.dropiId, p);
    }
  }
  // Solo consulta competencia de los 20 con mejor margen sugerido, para no saturar las APIs.
  const margen = (p) => (p.sugeridoDropi || 0) - p.costo;
  const todos = [...vistos.values()];
  // Los 3 mejores de cada producto que suena en redes + los 20 de mejor margen en general.
  const deRedes = topRedes.flatMap((r) => todos.filter((p) => p.enRedes === r.producto).sort((a, b) => margen(b) - margen(a)).slice(0, 3));
  const preseleccion = [...new Set([...deRedes, ...todos.sort((a, b) => margen(b) - margen(a)).slice(0, 20)])];
  const nuevos = [];
  for (const p of preseleccion) {
    const competencia = await intentar(`MercadoLibre "${p.nombre}"`, () => F.competencia(p.nombre), null);
    nuevos.push(evaluar({ ...p, competencia, enTendencia: enTendencia(p.nombre, terminos) }));
  }
  const oportunidades = nuevos.filter((n) => n.apto).sort((a, b) => b.puntaje - a.puntaje);
  for (const o of oportunidades) if (o.enRedes) hallazgosRedes.get(o.enRedes)?.aptos.push(o);
  const redesResumen = [...hallazgosRedes.values()].map((h) => ({ ...h, aptos: h.aptos.slice(0, 3).map((o) => ({ dropiId: o.dropiId, nombre: o.nombre, costo: o.costo, stock: o.stock, precioRecomendado: o.precioRecomendado, gananciaConRecomendado: o.gananciaConRecomendado })) }));

  // 4. Cambios desde la última revisión
  const sufijo = MODO_DEMO ? "-demo" : "";
  const anterior = await readFile(join(DIR_REPORTES, `ultimo${sufijo}.json`), "utf8").then(JSON.parse).catch(() => null);
  const cambios = detectarCambios(anterior, { tienda, oportunidades, redes: redesResumen });
  // Tabla de valores antes/ahora: solo cuando algo cambió.
  const comparacion = cambios.length ? tablaComparativa(anterior, tienda) : [];

  const resultado = { fecha: inicio.toISOString(), demo: MODO_DEMO, reglas: REGLAS, tendencias: { google, mercadolibre: ml }, redes: { publicaciones: redes.publicaciones, ranking: redesResumen }, tienda, oportunidades, cambios, comparacion, fechaAnterior: anterior?.fecha || null, errores };
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

function reporte({ fecha, demo, tienda, oportunidades, cambios, comparacion, fechaAnterior, tendencias, redes, errores }) {
  const hora = new Date(fecha).toLocaleString("es-CO", { timeZone: "America/Bogota" });
  const l = [];
  l.push(`# Radar de mercado MUVY${demo ? " (DEMO)" : ""}`, "", `Revisión: ${hora}`, "");

  if (cambios.length) l.push("## ⚠️ Cambios desde la última revisión", "", ...cambios.map((c) => `- ${c}`), "");
  if (comparacion?.length) l.push(tablaMarkdown(comparacion, fechaAnterior));

  if (redes.ranking.length) {
    l.push(`## 📱 Lo que se mueve en redes sociales (${redes.publicaciones} publicaciones revisadas)`, "");
    l.push("| # | Producto | Vistas | Videos | Fuentes | En Dropi | Mejor opción que cumple tus reglas |");
    l.push("|---:|---|---:|---:|---|---:|---|");
    redes.ranking.forEach((r, i) => {
      const mejor = r.aptos[0];
      const opcion = mejor ? `${mejor.nombre} (${mejor.dropiId}): costo $${fmt(mejor.costo)}, vender a $${fmt(mejor.precioRecomendado)} → gana $${fmt(mejor.gananciaConRecomendado)}, stock ${mejor.stock}` : r.enDropi ? "Hay en Dropi, pero ninguno cumple" : "No encontrado en Dropi";
      const video = r.ejemplo?.url ? ` [video](${r.ejemplo.url})` : "";
      l.push(`| ${i + 1} | ${r.producto}${video} | ${fmt(r.vistas)} | ${r.menciones} | ${r.fuentes.join(", ")} | ${r.enDropi} | ${opcion} |`);
    });
    l.push("");
  }

  l.push("## Productos de la tienda", "");
  l.push("| Producto | Costo | Precio actual | Ganancia esp. | ML mín / mediana | Precio recomendado | Stock | Estado |");
  l.push("|---|---:|---:|---:|---:|---:|---:|---|");
  for (const p of [...tienda].sort((a, b) => a.gananciaEsperada - b.gananciaEsperada)) {
    const c = p.competencia;
    const estado = p.apto ? (p.avisos.length ? "🟡 " + p.avisos.join("; ") : "🟢 OK") : "🔴 " + p.avisos.join("; ");
    l.push(`| ${p.nombre}${p.enTendencia ? " 🔥" : ""}${p.enRedes ? " 📱" : ""} | $${fmt(p.costo)} | $${fmt(p.precioEvaluado)} | $${fmt(p.gananciaEsperada)} | ${c?.minimo ? `$${fmt(c.minimo)} / $${fmt(c.mediana)}` : "—"} | $${fmt(p.precioRecomendado)} | ${p.stock} | ${estado} |`);
  }
  l.push("");

  l.push("## Oportunidades nuevas en Dropi", "");
  if (!oportunidades.length) l.push("Ninguna cumple las reglas en esta revisión.", "");
  else {
    l.push("| Puntaje | Producto (ID Dropi) | Costo | Precio recomendado | Ganancia esp. | ML mediana | Stock |");
    l.push("|---:|---|---:|---:|---:|---:|---:|");
    for (const p of oportunidades.slice(0, 15)) {
      l.push(`| ${p.puntaje} | ${p.nombre}${p.enTendencia ? " 🔥" : ""}${p.enRedes ? " 📱" : ""} (${p.dropiId}) | $${fmt(p.costo)} | $${fmt(p.precioRecomendado)} | $${fmt(p.gananciaConRecomendado)} | ${p.competencia?.mediana ? "$" + fmt(p.competencia.mediana) : "—"} | ${p.stock} |`);
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

  l.push(`<sub>Reglas: flete $${fmt(REGLAS.fleteIda)} ida + $${fmt(REGLAS.fleteDevolucion)} devolución, ${REGLAS.tasaDevolucion * 100}% devoluciones, ganancia mínima $${fmt(REGLAS.gananciaMinima)}, stock mínimo ${REGLAS.stockMinimo}. 🔥 = coincide con una búsqueda en tendencia. 📱 = se mueve en redes sociales.</sub>`, "");
  if (errores.length) l.push("<details><summary>Fuentes que fallaron</summary>", "", ...errores.map((e) => `- ${e}`), "", "</details>", "");
  return l.join("\n");
}

main();
