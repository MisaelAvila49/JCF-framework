// src/components/filtro.js
// Motor de filtros unico del dashboard. Jerarquia Nacional -> Estatal ->
// Municipal con desagregacion por sexo/edad. Funcion pura, sin UI.

// Resuelve el modo de la seleccion segun la jerarquia (regla unica).
export function modoDe(estado) {
  const {nivel, cveEnt, cveMun} = estado;
  if (nivel === "nacional") return "nacional";
  if (nivel === "estatal") return cveEnt ? "estado" : "compara-estados";
  // municipal
  if (!cveEnt) return "compara-municipios";
  if (!cveMun) return "municipios-estado";
  return "municipio";
}

// El desglose por sexo/edad se aplica siempre que este activo, tambien en los
// modos de comparacion (para recalcular el mapa/ranking por ese sexo/edad).
export function desagregable(estado) {
  return true;
}

// Filtra sexo/edad cuando aplica. Excluye sexo "SD". edadMin/edadMax en rango.
function aplicarDesagregado(filas, estado) {
  let f = filas;
  if (estado.sexo && estado.sexo !== "Todos") {
    f = f.filter((d) => d.sexo === estado.sexo);
  }
  if (estado.edadMin != null && estado.edadMax != null) {
    f = f.filter((d) => d.edad !== "" && d.edad != null
      && +d.edad >= estado.edadMin && +d.edad <= estado.edadMax);
  }
  return f;
}

// Aplica la jerarquia sobre las filas. Devuelve {filas, modo}. Las filas traen
// cve_ent (2 dig) y cve_mun (5 dig) como en padron_agregado/cruces.
export function filtrar(datos, estado) {
  const modo = modoDe(estado);
  const ent2 = (d) => String(d.cve_ent).padStart(2, "0");
  const mun5 = (d) => String(d.cve_mun).padStart(5, "0");
  let filas = datos;
  if (modo === "estado" || modo === "municipios-estado" || modo === "municipio") {
    filas = filas.filter((d) => ent2(d) === estado.cveEnt);
  }
  if (modo === "municipio") {
    filas = filas.filter((d) => mun5(d) === estado.cveMun);
  }
  // Desagregacion solo en modos de una unidad.
  if (desagregable(estado)) filas = aplicarDesagregado(filas, estado);
  return {filas, modo};
}
