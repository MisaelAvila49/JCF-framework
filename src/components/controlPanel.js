// src/components/controlPanel.js
// Panel de filtros reutilizable por grafica. Es un input compuesto: un elemento
// DOM cuyo `value` es {nivel, nombreEnt, nombreMun, sexo, edadMin, edadMax} y que
// emite eventos "input" al cambiar cualquier control. Se usa con `view()`.
// El datalist de municipio se recalcula segun el estado elegido (reactivo).
import * as Inputs from "npm:@observablehq/inputs";
import {html} from "npm:htl";

function norm(t) {
  return (t ?? "").toString().normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

// catEnt/catMun: [{cve, nombre}]. municipiosDe(nombreEnt) opcional: devuelve los
// nombres de municipio del estado escrito; si no se pasa, usa todos los de catMun.
// niveles: opciones del select de nivel (ENIGH usa ["Nacional","Estatal"]).
// desagrega: si false, no crea sexo/edad (ENIGH Hogares).
// anios: lista de años disponibles (numeros o strings). Si se pasa, agrega un
// selector "Año" con opcion "Todos" (default) + un año especifico.
export function controlPanel({catEnt = [], catMun = [],
    niveles = ["Nacional", "Estatal", "Municipal"], desagrega = true, anios = []} = {}) {
  const nombresEnt = catEnt.map((e) => e.nombre).sort((a, b) => a.localeCompare(b, "es"));
  const aniosOrd = [...new Set(anios.map(String))].sort((a, b) => +a - +b);

  const nivel = Inputs.select(niveles, {label: "Nivel", value: niveles[0]});
  const anio = aniosOrd.length
    ? Inputs.select(["Todos", ...aniosOrd], {label: "Año", value: "Todos"}) : null;
  const estado = Inputs.text({label: "Estado", placeholder: "(todos)", datalist: nombresEnt});
  const municipio = Inputs.text({label: "Municipio", placeholder: "(todos)"});
  const sexo = desagrega ? Inputs.select(["Todos", "FEMENINO", "MASCULINO"], {label: "Sexo", value: "Todos"}) : null;
  const edadMin = desagrega ? Inputs.range([18, 29], {step: 1, value: 18, label: "Edad min"}) : null;
  const edadMax = desagrega ? Inputs.range([18, 29], {step: 1, value: 29, label: "Edad max"}) : null;

  // Recalcula el datalist de municipio segun el estado escrito.
  const dl = html`<datalist>`;
  function actualizarMunicipios() {
    const q = norm(estado.value);
    const ent = q
      ? (catEnt.find((e) => norm(e.nombre) === q) ?? catEnt.find((e) => norm(e.nombre).includes(q)))
      : null;
    const lista = ent
      ? catMun.filter((m) => m.cve.slice(0, 2) === ent.cve).map((m) => m.nombre)
      : [];
    dl.replaceChildren(...lista.sort((a, b) => a.localeCompare(b, "es"))
      .map((n) => html`<option value=${n}>`));
  }
  const inputMun = municipio.querySelector("input");
  if (inputMun) inputMun.setAttribute("list", dl.id ||= "dl-mun-" + Math.random().toString(36).slice(2));
  estado.addEventListener("input", actualizarMunicipios);
  actualizarMunicipios();

  // Visibilidad segun nivel (estado si != nacional; municipio si municipal).
  function actualizarVisibilidad() {
    const n = nivel.value;
    estado.style.display = n === "Nacional" ? "none" : "";
    municipio.style.display = n === "Municipal" ? "" : "none";
  }
  nivel.addEventListener("input", actualizarVisibilidad);
  actualizarVisibilidad();

  const controles = [nivel, anio, estado, municipio, dl, sexo, edadMin, edadMax].filter(Boolean);
  const cont = html`<div class="control-panel" style="display:flex;flex-wrap:wrap;gap:0.75rem;align-items:end;margin:0.5rem 0;">
    ${controles}</div>`;

  function valor() {
    return {nivel: nivel.value, nombreEnt: estado.value, nombreMun: municipio.value,
      anio: anio ? anio.value : "Todos",
      sexo: sexo ? sexo.value : "Todos",
      edadMin: edadMin ? edadMin.value : 18,
      edadMax: edadMax ? edadMax.value : 29};
  }
  cont.value = valor();
  for (const el of [nivel, anio, estado, municipio, sexo, edadMin, edadMax].filter(Boolean)) {
    el.addEventListener("input", () => {
      cont.value = valor();
      cont.dispatchEvent(new Event("input", {bubbles: true}));
    });
  }
  return cont;
}

// Traduce el valor del panel (nombres) al `estado` que consume filtro.js (cves).
// Busca en el catalogo: primero coincidencia exacta (normalizada), luego
// substring. Evita que "Mexico" (Estado de Mexico) matchee "Ciudad de Mexico".
function buscarCve(catalogo, texto) {
  const q = norm(texto);
  if (!q) return null;
  const exacto = catalogo.find((c) => norm(c.nombre) === q);
  if (exacto) return exacto.cve;
  return catalogo.find((c) => norm(c.nombre).includes(q))?.cve ?? null;
}

export function resolverEstado(v, {catEnt, catMun}) {
  const nivel = v.nivel.toLowerCase();
  const cveEnt = v.nombreEnt ? buscarCve(catEnt, v.nombreEnt) : null;
  const cveMun = v.nombreMun ? buscarCve(catMun, v.nombreMun) : null;
  const edadActiva = !(v.edadMin === 18 && v.edadMax === 29);
  return {
    nivel, cveEnt, cveMun,
    anio: v.anio && v.anio !== "Todos" ? String(v.anio) : null,
    sexo: v.sexo,
    edadMin: edadActiva ? v.edadMin : null,
    edadMax: edadActiva ? v.edadMax : null,
  };
}
