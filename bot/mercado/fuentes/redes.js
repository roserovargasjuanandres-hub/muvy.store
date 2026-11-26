// Investigación en redes sociales: qué productos aparecen en videos virales en Colombia.
//
// - YouTube (incluye Shorts, donde se repiten casi todos los videos de TikTok): API oficial,
//   gratis con YOUTUBE_API_KEY (console.cloud.google.com → YouTube Data API v3).
// - TikTok Creative Center: hashtags en tendencia en Colombia. No es una API oficial, puede fallar;
//   si falla, el reporte lo indica y el resto sigue.
//
// Cada producto del diccionario recibe un puntaje según cuántas vistas suman los videos que lo
// mencionan. Los mejores se buscan después en Dropi.

import { PRODUCTOS_REDES, BUSQUEDAS_REDES } from "../config.js";

const sinTildes = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Busca qué productos del diccionario se mencionan en un texto.
export function productosEn(texto) {
  const t = sinTildes(texto);
  return PRODUCTOS_REDES.filter((p) => p.claves.some((c) => t.includes(sinTildes(c)))).map((p) => p.producto);
}

async function youtube() {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("falta YOUTUBE_API_KEY (opcional)");
  const desde = new Date(Date.now() - 14 * 864e5).toISOString();
  const videos = new Map();
  for (const q of BUSQUEDAS_REDES) {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=50&order=viewCount&regionCode=CO&relevanceLanguage=es&publishedAfter=${desde}&q=${encodeURIComponent(q)}&key=${key}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`YouTube HTTP ${res.status}`);
    for (const it of (await res.json()).items || []) {
      videos.set(it.id.videoId, { titulo: it.snippet.title, texto: `${it.snippet.title} ${it.snippet.description}` });
    }
  }
  // Vistas de cada video (de a 50 por consulta).
  const ids = [...videos.keys()];
  for (let i = 0; i < ids.length; i += 50) {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${ids.slice(i, i + 50).join(",")}&key=${key}`, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`YouTube HTTP ${res.status}`);
    for (const v of (await res.json()).items || []) videos.get(v.id).vistas = Number(v.statistics?.viewCount) || 0;
  }
  return [...videos.entries()].map(([id, v]) => ({ fuente: "YouTube", url: `https://youtu.be/${id}`, ...v }));
}

async function tiktok() {
  const url = "https://ads.tiktok.com/creative_radar_api/v1/popular_trend/hashtag/list?page=1&limit=50&period=7&country_code=CO&sort_by=popular";
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", Referer: "https://ads.tiktok.com/business/creativecenter/inspiration/popular/hashtag/pc/es" },
    signal: AbortSignal.timeout(20000)
  });
  if (!res.ok) throw new Error(`TikTok Creative Center HTTP ${res.status}`);
  const data = await res.json();
  const lista = data?.data?.list;
  if (!Array.isArray(lista)) throw new Error("TikTok Creative Center no devolvió hashtags (puede pedir inicio de sesión)");
  return lista.map((h) => ({ fuente: "TikTok", titulo: `#${h.hashtag_name}`, texto: h.hashtag_name.replace(/([a-z])([A-Z])/g, "$1 $2"), vistas: Number(h.video_views) || Number(h.publish_cnt) * 1000 || 0 }));
}

// Devuelve el ranking de productos mencionados en redes y los errores de cada fuente.
export async function investigarRedes() {
  const errores = [];
  const publicaciones = [];
  for (const [nombre, fn] of [["YouTube", youtube], ["TikTok", tiktok]]) {
    try {
      publicaciones.push(...(await fn()));
    } catch (e) {
      errores.push(`${nombre}: ${e.message}`);
    }
  }
  return { ranking: rankear(publicaciones), publicaciones: publicaciones.length, errores };
}

export function rankear(publicaciones) {
  const porProducto = new Map();
  for (const p of publicaciones) {
    for (const prod of productosEn(p.texto)) {
      const r = porProducto.get(prod) || { producto: prod, menciones: 0, vistas: 0, fuentes: new Set(), ejemplo: null };
      r.menciones += 1;
      r.vistas += p.vistas || 0;
      r.fuentes.add(p.fuente);
      if (!r.ejemplo || (p.vistas || 0) > (r.ejemplo.vistas || 0)) r.ejemplo = { titulo: p.titulo, url: p.url, vistas: p.vistas };
      porProducto.set(prod, r);
    }
  }
  return [...porProducto.values()]
    .map((r) => ({ ...r, fuentes: [...r.fuentes] }))
    .sort((a, b) => b.vistas - a.vistas || b.menciones - a.menciones);
}
