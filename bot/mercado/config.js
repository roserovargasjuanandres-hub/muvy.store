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
