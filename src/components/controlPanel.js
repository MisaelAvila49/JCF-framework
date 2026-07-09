// src/components/controlPanel.js
// Panel de filtros reutilizable por grafica. Devuelve un Inputs.form cuyo valor
// es {nivel, nombreEnt, nombreMun, sexo, edadMin, edadMax}. La pagina resuelve
// nombre->cve con `resolverEstado`. Todos los controles van siempre presentes;
// el motor ignora sexo/edad en modos de comparacion.
import * as Inputs from "npm:@observablehq/inputs";

// Normaliza texto para comparar nombres sin acentos ni mayusculas.
function norm(t) {
  return (t ?? "").toString().normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

// Crea el form de controles. nombresEnt/nombresMun: nombres para datalist.
export function controlPanel({nombresEnt = [], nombresMun = []} = {}) {
  return Inputs.form({
    nivel: Inputs.select(["Nacional", "Estatal", "Municipal"], {label: "Nivel", value: "Nacional"}),
    nombreEnt: Inputs.text({label: "Estado", placeholder: "(todos)", datalist: nombresEnt}),
    nombreMun: Inputs.text({label: "Municipio", placeholder: "(todos)", datalist: nombresMun}),
    sexo: Inputs.select(["Todos", "FEMENINO", "MASCULINO"], {label: "Sexo", value: "Todos"}),
    edadMin: Inputs.range([18, 29], {step: 1, value: 18, label: "Edad min"}),
    edadMax: Inputs.range([18, 29], {step: 1, value: 29, label: "Edad max"}),
  });
}

// Traduce el valor del form (nombres) al `estado` que consume filtro.js (cves).
// Edad se considera activa si el rango no es el completo [18,29]. Sexo activo si
// != "Todos". catEnt/catMun: [{cve, nombre}].
export function resolverEstado(v, {catEnt, catMun}) {
  const nivel = v.nivel.toLowerCase();
  const cveEnt = v.nombreEnt
    ? (catEnt.find((e) => norm(e.nombre).includes(norm(v.nombreEnt)))?.cve ?? null) : null;
  const cveMun = v.nombreMun
    ? (catMun.find((m) => norm(m.nombre).includes(norm(v.nombreMun)))?.cve ?? null) : null;
  const edadActiva = !(v.edadMin === 18 && v.edadMax === 29);
  return {
    nivel, cveEnt, cveMun,
    sexo: v.sexo,
    edadMin: edadActiva ? v.edadMin : null,
    edadMax: edadActiva ? v.edadMax : null,
  };
}
