// src/components/graficas.js
// Especificaciones de Observable Plot con el estilo Social Data Ibero.
// Cantidades en el texto de las paginas; las graficas muestran porcentajes.
import * as Plot from "npm:@observablehq/plot";

// Paleta categorica (corregir en un solo lugar). Armoniza con el rojo de marca.
export const PALETA = ["#94a3b8", "#a78bfa", "#f59e0b", "#ea580c", "#34d399", "#60a5fa"];

// Texto de la etiqueta segun formato: pct agrega %, entero redondea con miles.
function etiqueta(y, formato) {
  return (d) => formato === "pct"
    ? `${(+d[y]).toFixed(2)}%`
    : `${Math.round(+d[y]).toLocaleString()}`;
}

function ejeValor(formato, y) {
  return formato === "pct"
    ? {label: "%", grid: true, tickFormat: (d) => `${d}%`}
    : {label: y, grid: true};
}

// Barras verticales simples: un color por valor de x (ej. cada año). Sin leyenda.
export function barras(datos, {x, y, titulo = "", subtitulo = "", fuente = "",
                               formato = "pct"} = {}) {
  return Plot.plot({
    title: titulo,
    subtitle: subtitulo,
    caption: fuente,
    marginBottom: 50,
    x: {label: x, tickRotate: -30},
    y: ejeValor(formato, y),
    color: {domain: datos.map((d) => String(d[x])), range: PALETA},
    marks: [
      Plot.ruleY([0], {stroke: "#e2e8f0"}),
      Plot.barY(datos, {x, y, fill: (d) => String(d[x]), fillOpacity: 0.85}),
      Plot.text(datos, {x, y, text: etiqueta(y, formato), dy: -6, fontSize: 9}),
    ],
  });
}

// Barras agrupadas: subgrupos por serie dentro de cada x (fx). Cada barra su
// color (por serie), con leyenda. Escala y compartida.
export function barrasAgrupadas(datos, {x, serie, y, titulo = "", subtitulo = "",
                                        fuente = "", formato = "pct"} = {}) {
  return Plot.plot({
    title: titulo,
    subtitle: subtitulo,
    caption: fuente,
    marginBottom: 50,
    marginRight: 90,
    x: {axis: null},
    fx: {label: x, tickRotate: -30},
    y: ejeValor(formato, y),
    color: {label: serie, range: PALETA, legend: true},
    marks: [
      Plot.ruleY([0], {stroke: "#e2e8f0"}),
      Plot.barY(datos, {fx: x, x: serie, y, fill: serie, fillOpacity: 0.85}),
      Plot.text(datos, {fx: x, x: serie, y, text: etiqueta(y, formato),
                        dy: -6, fontSize: 8}),
    ],
  });
}

// Barras apiladas 100% (composicion). serie = categoria, valor = pct.
export function barrasApiladas(datos, {x, serie, valor, titulo = "",
                                       subtitulo = "", fuente = ""} = {}) {
  return Plot.plot({
    title: titulo,
    subtitle: subtitulo,
    caption: fuente,
    marginRight: 140,
    color: {legend: true, range: PALETA},
    x: {label: x},
    y: {label: "%", grid: true, tickFormat: (d) => `${d}%`},
    marks: [
      Plot.barY(datos, {x, y: valor, fill: serie, order: serie, fillOpacity: 0.85}),
      Plot.ruleY([0], {stroke: "#e2e8f0"}),
    ],
  });
}

// Lineas por grupo (serie opcional).
export function lineas(datos, {x, y, serie = null, titulo = "", subtitulo = "",
                               fuente = ""} = {}) {
  return Plot.plot({
    title: titulo,
    subtitle: subtitulo,
    caption: fuente,
    color: {legend: serie != null, range: PALETA},
    x: {label: x},
    y: {label: "%", grid: true, tickFormat: (d) => `${d}%`},
    marks: [
      Plot.lineY(datos, {x, y, stroke: serie ?? "#60a5fa", marker: "circle"}),
    ],
  });
}

// Dispersion (un punto por municipio/entidad).
export function dispersion(datos, {x, y, titulo = "", subtitulo = "",
                                   fuente = ""} = {}) {
  return Plot.plot({
    title: titulo,
    subtitle: subtitulo,
    caption: fuente,
    x: {label: x, grid: true},
    y: {label: y, grid: true},
    marks: [
      Plot.ruleY([0], {stroke: "#e2e8f0"}),
      Plot.dot(datos, {x, y, r: 3, fillOpacity: 0.5, fill: "#ea580c"}),
    ],
  });
}

// Barras horizontales (ranking por entidad/municipio): un color unico.
export function barrasH(datos, {x, y, titulo = "", subtitulo = "", fuente = "",
                                formato = "pct"} = {}) {
  return Plot.plot({
    title: titulo,
    subtitle: subtitulo,
    caption: fuente,
    marginLeft: 140,
    x: formato === "pct"
      ? {label: "%", grid: true, tickFormat: (d) => `${d}%`}
      : {label: x, grid: true},
    y: {label: null},
    marks: [
      Plot.ruleX([0], {stroke: "#e2e8f0"}),
      Plot.barX(datos, {x, y, fill: "#60a5fa", fillOpacity: 0.85, sort: {y: "-x"}}),
      Plot.text(datos, {x, y, text: etiqueta(x, formato), dx: 5,
                        textAnchor: "start", fontSize: 9}),
    ],
  });
}
