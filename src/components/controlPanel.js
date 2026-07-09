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
export function controlPanel({catEnt = [], catMun = []} = {}) {
  const nombresEnt = catEnt.map((e) => e.nombre).sort((a, b) => a.localeCompare(b, "es"));

  const nivel = Inputs.select(["Nacional", "Estatal", "Municipal"], {label: "Nivel", value: "Nacional"});
  const estado = Inputs.text({label: "Estado", placeholder: "(todos)", datalist: nombresEnt});
  const municipio = Inputs.text({label: "Municipio", placeholder: "(todos)"});
  const sexo = Inputs.select(["Todos", "FEMENINO", "MASCULINO"], {label: "Sexo", value: "Todos"});
  const edadMin = Inputs.range([18, 29], {step: 1, value: 18, label: "Edad min"});
  const edadMax = Inputs.range([18, 29], {step: 1, value: 29, label: "Edad max"});

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

  const cont = html`<div class="control-panel" style="display:flex;flex-wrap:wrap;gap:0.75rem;align-items:end;margin:0.5rem 0;">
    ${nivel}${estado}${municipio}${dl}${sexo}${edadMin}${edadMax}</div>`;

  function valor() {
    return {nivel: nivel.value, nombreEnt: estado.value, nombreMun: municipio.value,
      sexo: sexo.value, edadMin: edadMin.value, edadMax: edadMax.value};
  }
  cont.value = valor();
  for (const el of [nivel, estado, municipio, sexo, edadMin, edadMax]) {
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
    sexo: v.sexo,
    edadMin: edadActiva ? v.edadMin : null,
    edadMax: edadActiva ? v.edadMax : null,
  };
}
