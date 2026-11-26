// Datos de ejemplo (inventados) para probar el radar sin conexión: node bot/mercado/index.js --demo

const azar = (semilla) => {
  let x = semilla % 2147483647;
  return () => (x = (x * 16807) % 2147483647) / 2147483647;
};

export async function tendenciasGoogle() {
  return [
    { termino: "black friday colombia", trafico: "200K+" },
    { termino: "freidora de aire", trafico: "20K+" },
    { termino: "lampara solar", trafico: "5K+" }
  ];
}

export async function tendenciasML() {
  return ["freidora de aire", "almohada cervical", "aspiradora inalambrica"];
}

export async function producto(id) {
  const r = azar(id);
  let costo = Math.round((25000 + r() * 35000) / 100) * 100;
  // DEMO_VARIAR=1 simula que Dropi subió el costo de algunos productos.
  if (process.env.DEMO_VARIAR && id % 3 === 0) costo += 3000;
  return { dropiId: id, nombre: `Producto ${id}`, costo, sugeridoDropi: Math.round(costo * 1.9 / 100) * 100, stock: Math.round(r() * 400), categoria: "Hogar", proveedor: "Demo" };
}

const NUEVOS = ["Freidora de Aire 4L", "Aspiradora Inalámbrica Portátil", "Masajeador Cervical Eléctrico", "Humidificador Llama de Fuego", "Organizador Giratorio de Cocina", "Lámpara LED de Escritorio Plegable"];

export async function buscar(palabra) {
  return NUEVOS.filter((n) => n.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(palabra.slice(0, 5))).map((nombre, i) => {
    const r = azar(nombre.length * 97 + i);
    const costo = Math.round((35000 + r() * 30000) / 100) * 100;
    return { dropiId: 900000 + nombre.length * 10 + i, nombre, costo, sugeridoDropi: Math.round(costo * 2 / 100) * 100, stock: Math.round(50 + r() * 500), categoria: "Hogar", proveedor: "Demo" };
  });
}

export async function competencia(nombre) {
  const r = azar(nombre.length * 31);
  const mediana = Math.round((80000 + r() * 60000) / 100) * 100;
  return { consulta: nombre.toLowerCase(), publicaciones: 120, minimo: Math.round(mediana * 0.7), mediana, maximo: Math.round(mediana * 1.5), vendidos: Math.round(r() * 3000) };
}
