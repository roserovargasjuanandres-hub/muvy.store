// Precios de la competencia en MercadoLibre Colombia (sitio MCO).
// MercadoLibre pide token para su API: crea una app en developers.mercadolibre.com.co
// y guarda ML_ACCESS_TOKEN como secreto. Sin token se intenta igual y, si falla, se omite.

import { mediana } from "../analisis.js";

const API = "https://api.mercadolibre.com";

// Quita palabras de relleno para que la búsqueda sea más parecida a como busca la gente.
function consulta(nombre) {
  return nombre
    .toLowerCase()
    .replace(/\b(de|con|para|el|la|los|las|y|en|x\d+|\d+ ?(en|piezas|unidades))\b/g, " ")
    .replace(/[^a-záéíóúñü0-9 ]/gi, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5)
    .join(" ");
}

export async function competencia(nombre) {
  const headers = {};
  if (process.env.ML_ACCESS_TOKEN) headers.Authorization = `Bearer ${process.env.ML_ACCESS_TOKEN}`;
  const q = consulta(nombre);
  const res = await fetch(`${API}/sites/MCO/search?q=${encodeURIComponent(q)}&limit=50`, {
    headers,
    signal: AbortSignal.timeout(20000)
  });
  if (!res.ok) throw new Error(`MercadoLibre HTTP ${res.status}`);
  const data = await res.json();
  const items = (data.results || []).filter((i) => i.condition === "new" && i.currency_id === "COP");
  if (!items.length) return { consulta: q, publicaciones: 0 };
  const precios = items.map((i) => i.price);
  const masBarato = items.reduce((a, b) => (b.price < a.price ? b : a));
  return {
    consulta: q,
    publicaciones: data.paging?.total ?? items.length,
    minimo: Math.min(...precios),
    mediana: mediana(precios),
    maximo: Math.max(...precios),
    vendidos: items.reduce((a, i) => a + (Number(i.sold_quantity) || 0), 0) || null,
    enlaceMasBarato: masBarato.permalink
  };
}

// Lo más buscado en MercadoLibre Colombia (requiere token).
export async function tendenciasML() {
  if (!process.env.ML_ACCESS_TOKEN) return [];
  const res = await fetch(`${API}/trends/MCO`, {
    headers: { Authorization: `Bearer ${process.env.ML_ACCESS_TOKEN}` },
    signal: AbortSignal.timeout(20000)
  });
  if (!res.ok) throw new Error(`Tendencias MercadoLibre HTTP ${res.status}`);
  return (await res.json()).map((t) => t.keyword).filter(Boolean);
}
