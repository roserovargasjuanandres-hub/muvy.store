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
  // Solo los favoritos del dueño en Dropi. Nombre, fotos y stock se leen en vivo desde Dropi.
  {
    dropiId: 2316828, slug: "timbre", category: "Seguridad", featured: true,
    name: "Timbre Inalámbrico Inteligente",
    price: 99900, compareAt: 119900,
    bundle: { qty: 2, price: 149950, compareAt: 199800 },
    image: "/assets/img/timbre.png"
  },
  { dropiId: 2329707, slug: "picatodo", category: "Cocina", featured: true, name: "Pica Todo Eléctrico 2 en 1 SOKANY", price: 99500, compareAt: 109900, bundle: { qty: 2, price: 189900, compareAt: 199000 }, image: "/assets/img/picatodo.jpg" },
  { dropiId: 2329947, slug: "almohada", category: "Descanso", featured: true, name: "Almohada Cervical Ergonómica", price: 99900, image: "/assets/img/almohada.jpg" },
  { dropiId: 2306315, slug: "solar", category: "Iluminación", featured: true, name: "Lámpara Solar LED 3 Cabezas", price: 86900, image: "/assets/img/solar.jpg" },
  { dropiId: 590553, slug: "hervidor", category: "Cocina", name: "Hervidor Eléctrico Plegable", price: 71900, image: "/assets/img/hervidor.jpg" },
  { dropiId: 1719052, slug: "sierra", category: "Herramientas", name: "Mini Sierra Eléctrica", image: "/assets/img/sierra.jpg" },
  { dropiId: 1332032, slug: "cubo-tulipanes", category: "Iluminación", featured: true, name: "Lámpara Cubo de Tulipanes con Efecto Espejo", price: 65900, compareAt: 79500, bundle: { qty: 2, price: 85950, compareAt: 95950 }, image: "/assets/img/cubo-tulipanes.jpg" },
  { dropiId: 2343532, slug: "esterilizador-cepillos", category: "Baño y belleza", name: "Esterilizador Porta Cepillos Automático", price: 77900 },
  { dropiId: 2120183, slug: "dispensador-agua", category: "Cocina", name: "Dispensador de Agua Recargable", price: 84900 },
  { dropiId: 405336, slug: "organizador-zapatos", category: "Hogar", name: "Organizador de Zapatos Metálico 6 Niveles", price: 70900 }
];

// Si un producto no tiene precio sugerido en Dropi, se vende al costo × este margen.
export const DEFAULT_MARKUP = 1.8;

// Precio total de una línea del pedido, aplicando el combo cuando la cantidad coincide.
export function lineTotal(entry, unitPrice, qty) {
  if (entry.bundle && qty === entry.bundle.qty) return entry.bundle.price;
  return unitPrice * qty;
}
