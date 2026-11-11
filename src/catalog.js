// Productos de Dropi que se muestran en MUVY.
// Solo pones el ID de Dropi; nombre, fotos, stock, variantes y precios se leen en vivo desde Dropi.
//
//   dropiId   ID del producto en Dropi (obligatorio)
//   category  sección de la tienda donde aparece
//   featured  true = aparece en "Lo más pedido" del inicio
//   price     (opcional) precio de venta fijo en COP. Si no lo pones, se usa el precio sugerido de Dropi.
//   name      (opcional) nombre que quieres mostrar en vez del de Dropi
export const CATALOG = [
  { dropiId: 2324095, category: "Habitación", featured: true, name: "Sábana unicolor" },
  { dropiId: 1880273, category: "Cocina", featured: true, name: "Set de cuchillos con pelador" },
  { dropiId: 1839648, category: "Limpieza", featured: true, name: "Robot aspirador" },
  { dropiId: 1852772, category: "Organización", featured: true, name: "6 bolsas ahorradoras de espacio" },
  { dropiId: 2146104, category: "Cocina", name: "Licuadora RAF 15 velocidades" },
  { dropiId: 1938185, category: "Clima", name: "Ventilador de mesa 8\" Kalley" },
  { dropiId: 1827864, category: "Mascotas", name: "Comedero programable para mascotas" },
  { dropiId: 2322692, category: "Iluminación", name: "Kit solar recargable 3 luces USB" },
  { dropiId: 120145, category: "Iluminación", name: "Luces de jardín" },
  { dropiId: 678283, category: "Iluminación", name: "Luces de discoteca" }
];

// Si un producto no tiene precio sugerido en Dropi, se vende al costo × este margen.
export const DEFAULT_MARKUP = 1.8;
