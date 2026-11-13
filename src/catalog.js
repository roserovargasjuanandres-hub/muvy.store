// Productos de Dropi que se muestran en MUVY.
// Solo pones el ID de Dropi; stock, variantes, descripción y fotos de respaldo se leen en vivo desde Dropi.
//
//   dropiId    ID del producto en Dropi (obligatorio)
//   slug       nombre corto para el contenido extra de la página (public/assets/content.js)
//   category   sección de la tienda donde aparece
//   featured   true = aparece primero en el inicio
//   name       (opcional) nombre que quieres mostrar en vez del de Dropi
//   price      (opcional) precio de venta fijo en COP. Si no lo pones, se usa el precio sugerido de Dropi.
//   compareAt  (opcional) precio "antes" que se muestra tachado
//   bundle     (opcional) combo: { qty, price, compareAt } — precio total al llevar esa cantidad
//   image      (opcional) foto principal propia (en public/assets/img); las de Dropi quedan como galería
export const CATALOG = [
  {
    dropiId: 2316828, slug: "timbre", category: "Seguridad", featured: true,
    name: "Timbre Inalámbrico Inteligente",
    price: 79950, compareAt: 95000,
    bundle: { qty: 2, price: 149950, compareAt: 160000 },
    image: "/assets/img/timbre.png"
  },
  // Lámpara cubo de tulipanes: falta confirmar su ID de Dropi.
  // { dropiId: 0, slug: "cubo-tulipanes", category: "Iluminación", featured: true,
  //   name: "Lámpara Cubo de Tulipanes con Efecto Espejo", price: 65900, compareAt: 79500,
  //   bundle: { qty: 2, price: 85950, compareAt: 95950 }, image: "/assets/img/cubo-tulipanes.jpg" },
  { dropiId: 659568, slug: "calentador", category: "Clima", featured: true, name: "Mini Calentador Portátil", image: "/assets/img/calentador.jpg" },
  { dropiId: 2329707, slug: "picatodo", category: "Cocina", featured: true, name: "Pica Todo 2 en 1", image: "/assets/img/picatodo.jpg" },
  { dropiId: 2328496, slug: "espejo", category: "Baño y belleza", name: "Espejo de Maquillaje LED", image: "/assets/img/espejo.jpg" },
  { dropiId: 2329947, slug: "almohada", category: "Descanso", name: "Almohada Cervical Ergonómica", image: "/assets/img/almohada.jpg" },
  { dropiId: 590553, slug: "hervidor", category: "Cocina", name: "Hervidor Eléctrico Plegable", image: "/assets/img/hervidor.jpg" },
  { dropiId: 1214798, slug: "dispensador", category: "Baño y belleza", name: "Dispensador y Esterilizador UV", image: "/assets/img/dispensador.jpg" },
  { dropiId: 2283472, slug: "cortador", category: "Cocina", name: "Cortador de Verduras Vertical", image: "/assets/img/cortador.jpg" },
  { dropiId: 2306315, slug: "solar", category: "Iluminación", name: "Lámpara Solar LED 3 Cabezas", image: "/assets/img/solar.jpg" },
  { dropiId: 1719052, slug: "sierra", category: "Herramientas", name: "Mini Sierra Eléctrica", image: "/assets/img/sierra.jpg" },

  // Productos nuevos del hogar. Fotos, precio sugerido y stock vienen en vivo desde Dropi.
  { dropiId: 1619707, slug: "motor-cortinas", category: "Hogar inteligente", featured: true, name: "Motor Inteligente para Cortinas WiFi" },
  { dropiId: 2002115, slug: "lienzo-universo", category: "Decoración", featured: true, name: "Lienzo x3 Universo Abstracto de Color" },
  { dropiId: 847339, slug: "lienzo-ciudades", category: "Decoración", name: "Lienzo Ciudades 06" },
  { dropiId: 847368, slug: "lienzo-perros", category: "Decoración", name: "Lienzo Perros 04" },
  { dropiId: 329892, slug: "maquina-coser", category: "Hogar", name: "Máquina de Coser TRQ" },
  { dropiId: 681399, slug: "hamaca", category: "Terraza", name: "Hamaca de Palo" },
  { dropiId: 2052767, slug: "manta-masajeadora", category: "Bienestar", featured: true, name: "Manta Masajeadora Térmica Corporal" },
  { dropiId: 1468045, slug: "cubiertos", category: "Cocina", name: "Juego de Cubiertos" },
  { dropiId: 1736234, slug: "granos-giratorio", category: "Cocina", name: "Dispensador de Granos Giratorio" },
  { dropiId: 791560, slug: "aspiradora-robot", category: "Limpieza", name: "Aspiradora Robot Ximeijie" }
];

// Si un producto no tiene precio sugerido en Dropi, se vende al costo × este margen.
export const DEFAULT_MARKUP = 1.8;

// Precio total de una línea del pedido, aplicando el combo cuando la cantidad coincide.
export function lineTotal(entry, unitPrice, qty) {
  if (entry.bundle && qty === entry.bundle.qty) return entry.bundle.price;
  return unitPrice * qty;
}
