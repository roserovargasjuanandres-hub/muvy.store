// Búsquedas en tendencia en Colombia según Google Trends (RSS público, sin token).

export async function tendenciasGoogle() {
  const res = await fetch("https://trends.google.com/trending/rss?geo=CO", {
    headers: { "User-Agent": "Mozilla/5.0 (MUVY radar de mercado)" },
    signal: AbortSignal.timeout(20000)
  });
  if (!res.ok) throw new Error(`Google Trends HTTP ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<item>[\s\S]*?<title>([^<]+)<\/title>[\s\S]*?(?:<ht:approx_traffic>([^<]+)<\/ht:approx_traffic>)?/g)]
    .map((m) => ({ termino: m[1].trim(), trafico: m[2]?.trim() || null }));
}
