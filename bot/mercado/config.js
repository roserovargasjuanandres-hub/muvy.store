// Reglas del Radar de Mercado MUVY. Cambia aquí los números sin tocar el resto del código.

export const REGLAS = {
  fleteIda: 15000,          // COP que cobra la transportadora por enviar
  fleteDevolucion: 15000,   // COP extra cuando el cliente no recibe
  tasaDevolucion: 0.30,     // 30% de pedidos devueltos
  gananciaMinima: 15000,    // ganancia esperada mínima por pedido despachado
  precioObjetivo: 100000,   // precio de venta al que apuntamos
  stockMinimo: 60,          // unidades mínimas en Dropi para vender un producto
  margenBajoCompetencia: 0.05 // cuánto por debajo de la mediana de MercadoLibre sugerimos vender
};

// Palabras con las que el bot busca productos nuevos en Dropi y cruza tendencias.
// Agrega o quita las que quieras.
export const PALABRAS_CLAVE = [
  "hogar", "cocina", "organizador", "lampara", "led", "limpieza", "baño",
  "almohada", "masajeador", "humidificador", "dispensador", "picador",
  "freidora", "aspiradora", "timbre", "camara", "herramienta", "mascotas"
];

// Cuántos productos nuevos revisa por palabra en Dropi.
export const RESULTADOS_POR_PALABRA = 30;

// ── Redes sociales ──────────────────────────────────────────────────────────
// Búsquedas con las que el bot encuentra videos virales de productos en Colombia (YouTube/Shorts).
export const BUSQUEDAS_REDES = [
  "tiktok me hizo comprarlo",
  "productos virales tiktok colombia",
  "gadgets cocina virales",
  "productos para el hogar virales",
  "cosas útiles para la casa",
  "inventos para el hogar"
];

// Productos que el bot reconoce en títulos, descripciones y hashtags.
// "claves": cómo aparece en redes. "dropi": con qué palabra se busca en Dropi.
export const PRODUCTOS_REDES = [
  { producto: "Freidora de aire", claves: ["freidora de aire", "air fryer", "airfryer"], dropi: "freidora" },
  { producto: "Selladora portátil", claves: ["selladora", "sellador de bolsas"], dropi: "selladora" },
  { producto: "Picador eléctrico", claves: ["picatodo", "pica todo", "picador", "chopper"], dropi: "picador" },
  { producto: "Báscula inteligente", claves: ["bascula", "gramera"], dropi: "bascula" },
  { producto: "Organizador giratorio", claves: ["organizador giratorio", "giratorio 360"], dropi: "organizador giratorio" },
  { producto: "Organizador de cocina", claves: ["organizador de cocina", "organizador cocina", "especiero"], dropi: "organizador cocina" },
  { producto: "Organizador de baño", claves: ["organizador de baño", "organizador baño"], dropi: "organizador baño" },
  { producto: "Cajas plegables", claves: ["caja plegable", "cajas plegables"], dropi: "caja plegable" },
  { producto: "Basurero automático", claves: ["basurero automatico", "caneca automatica", "papelera automatica", "basurero con sensor"], dropi: "basurero automatico" },
  { producto: "Luces LED inteligentes", claves: ["luces led", "tira led", "cinta led", "bombillo inteligente"], dropi: "luces led" },
  { producto: "Lámpara solar", claves: ["lampara solar", "luz solar", "reflector solar"], dropi: "lampara solar" },
  { producto: "Dispensador automático", claves: ["dispensador automatico", "dispensador de jabon", "dispensador de crema"], dropi: "dispensador automatico" },
  { producto: "Dispensador de agua", claves: ["dispensador de agua"], dropi: "dispensador agua" },
  { producto: "Dispensador de arroz", claves: ["dispensador de arroz", "dispensador de granos", "rice dispenser"], dropi: "dispensador arroz" },
  { producto: "Humidificador", claves: ["humidificador", "difusor de aroma"], dropi: "humidificador" },
  { producto: "Aspiradora portátil", claves: ["aspiradora inalambrica", "aspiradora portatil", "mini aspiradora", "aspiradora de mano"], dropi: "aspiradora" },
  { producto: "Robot aspiradora", claves: ["robot aspiradora", "aspiradora robot"], dropi: "robot aspiradora" },
  { producto: "Cepillo eléctrico de limpieza", claves: ["cepillo electrico", "cepillo de limpieza", "spin scrubber"], dropi: "cepillo limpieza" },
  { producto: "Masajeador", claves: ["masajeador", "pistola de masaje"], dropi: "masajeador" },
  { producto: "Almohada cervical", claves: ["almohada cervical", "almohada ortopedica"], dropi: "almohada cervical" },
  { producto: "Hervidor eléctrico", claves: ["hervidor", "tetera electrica", "pava electrica"], dropi: "hervidor" },
  { producto: "Mini calentador", claves: ["mini calentador", "calefactor portatil"], dropi: "calentador" },
  { producto: "Power bank magnético", claves: ["power bank magnetico", "bateria magsafe", "magsafe"], dropi: "power bank" },
  { producto: "Mini proyector", claves: ["mini proyector", "proyector portatil"], dropi: "proyector" },
  { producto: "Parlante portátil", claves: ["parlante", "bocina bluetooth"], dropi: "parlante" },
  { producto: "Timbre inteligente", claves: ["timbre inalambrico", "timbre inteligente", "timbre con camara"], dropi: "timbre" },
  { producto: "Cámara de seguridad", claves: ["camara de seguridad", "camara wifi", "camara ip"], dropi: "camara seguridad" },
  { producto: "Espejo LED", claves: ["espejo led", "espejo de maquillaje"], dropi: "espejo led" },
  { producto: "Termo / vaso térmico", claves: ["termo", "vaso termico", "tumbler"], dropi: "termo" },
  { producto: "Lonchera eléctrica", claves: ["lonchera electrica", "lonchera termica"], dropi: "lonchera electrica" },
  { producto: "Mini sierra eléctrica", claves: ["mini sierra", "sierra electrica", "motosierra mini"], dropi: "sierra" },
  { producto: "Fuente para mascotas", claves: ["fuente para gatos", "fuente para mascotas", "bebedero automatico"], dropi: "fuente mascotas" },
  { producto: "Cortador de verduras", claves: ["cortador de verduras", "mandolina", "rallador multifuncional"], dropi: "cortador verduras" }
];

// Cuántos productos de redes busca en Dropi en cada revisión (los de más vistas).
export const TOP_REDES_A_DROPI = 10;
