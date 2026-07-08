// src/components/filtros.js
// Filtrado de las filas del padron segun los controles de la pagina. Funcion
// pura: recibe las filas y las opciones, devuelve el subconjunto.

// Normaliza texto para comparar nombres sin distinguir mayusculas ni acentos.
function normalizar(texto) {
  return (texto ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

// Aplica los filtros activos. opciones:
//  - usarEdadSexo (bool): si true, deja solo filas con edad y sexo, filtra por
//    el rango [edadMin, edadMax] y por sexo (si no es "Todos").
//  - nombreEnt (texto): substring del nombre de entidad (el usuario escribe); si
//    esta vacio, no filtra. Compara sin acentos ni mayusculas.
//  - nombreMun (texto): igual para el municipio.
export function filtrarDatos(datos, opciones = {}) {
  const {usarEdadSexo = false, edadMin = 18, edadMax = 29, sexo = "Todos",
         nombreEnt = "", nombreMun = ""} = opciones;
  let filas = datos;
  if (usarEdadSexo) {
    filas = filas.filter((f) => f.edad !== "" && f.edad != null
                                && f.sexo !== "" && f.sexo != null);
    filas = filas.filter((f) => Number(f.edad) >= edadMin
                                && Number(f.edad) <= edadMax);
    if (sexo !== "Todos") filas = filas.filter((f) => f.sexo === sexo);
  }
  if (nombreEnt) {
    const q = normalizar(nombreEnt);
    filas = filas.filter((f) => normalizar(f.nombre_ent).includes(q));
  }
  if (nombreMun) {
    const q = normalizar(nombreMun);
    filas = filas.filter((f) => normalizar(f.nombre_mun).includes(q));
  }
  return filas;
}
