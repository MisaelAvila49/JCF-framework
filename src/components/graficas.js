// src/components/graficas.js
// Especificaciones de Observable Plot con el estilo Social Data Ibero.
// Cantidades en el texto de las paginas; las graficas muestran porcentajes.
import * as Plot from "npm:@observablehq/plot";

// Paleta categorica (corregir en un solo lugar). Armoniza con el rojo de marca.
export const PALETA = ["#f59e0b", "#60a5fa", "#a78bfa", "#ea580c", "#34d399", "#94a3b8"];

// Colores fijos por sexo: Femenino naranja, Masculino azul.
export const COLOR_SEXO = {FEMENINO: "#f59e0b", MASCULINO: "#60a5fa"};

// Escala secuencial ordinal para los años (claro -> oscuro). Mismo mapeo en todo
// el dashboard. Cubre 2019-2025.
export const PALETA_AÑOS = ["#cfe0f3", "#9dc3e6", "#6aa6da", "#4C72B0", "#3a5a8c", "#2a4468", "#1b2e47"];
export const COLOR_AÑO = {
  "2019": PALETA_AÑOS[0], "2020": PALETA_AÑOS[1], "2021": PALETA_AÑOS[2],
  "2022": PALETA_AÑOS[3], "2023": PALETA_AÑOS[4], "2024": PALETA_AÑOS[5], "2025": PALETA_AÑOS[6],
};

// Escala de color para el desglose por edad: secuencial de oscuro (18) a claro
// (29), dominio fijo para que el color de cada edad sea estable entre graficas.
export const ESCALA_EDAD = {type: "linear", domain: [18, 29], scheme: "blues",
  reverse: true, legend: true, label: "Edad"};

// Maximo de una propiedad numerica sin usar spread (evita "Maximum call stack"
// con arreglos grandes).
export function maxProp(datos, prop) {
  let m = -Infinity;
  for (const d of datos) {
    const v = +d[prop];
    if (v > m) m = v;
  }
  return m;
}

// Colapsa un numero crudo a miles/millones legibles (para tooltips y ejes).
export function compacto(n) {
  const x = +n;
  if (!isFinite(x)) return "";
  const abs = Math.abs(x);
  if (abs >= 1e6) return (x / 1e6).toFixed(x % 1e6 === 0 ? 0 : 1) + " M";
  if (abs >= 1e3) return (x / 1e3).toFixed(x % 1e3 === 0 ? 0 : 1) + " mil";
  return Math.round(x).toLocaleString();
}

// Texto de la etiqueta segun formato: pct agrega %, entero colapsa a K/M.
function etiqueta(y, formato) {
  return (d) => formato === "pct" ? `${(+d[y]).toFixed(1)}%` : compacto(d[y]);
}

function ejeValor(formato, y) {
  return formato === "pct"
    ? {label: "%", grid: true, tickFormat: (d) => `${d}%`}
    : {label: y, grid: true, tickFormat: (d) => compacto(d)};
}

// Canales del tooltip: que representa cada barra (etiqueta), su % y la poblacion
// cruda colapsada. `dimLabel`/`dimVal` describen el eje (ej. "Año": 2019).
function canales(dimLabel, dimVal, y, formato, crudoKey) {
  const ch = {};
  ch[dimLabel] = dimVal;
  ch[formato === "pct" ? "Porcentaje" : "Valor"] = (d) =>
    formato === "pct" ? `${(+d[y]).toFixed(1)}%` : compacto(d[y]);
  if (crudoKey) ch["Poblacion"] = (d) => compacto(d[crudoKey]);
  return ch;
}

// Barras verticales simples: un color por valor de x (ej. cada año). Sin leyenda.
// crudoKey (opcional): columna con el conteo crudo para el tooltip.
export function barras(datos, {x, y, titulo = "", subtitulo = "", fuente = "",
                               formato = "pct", crudoKey = null} = {}) {
  return Plot.plot({
    title: titulo,
    subtitle: subtitulo,
    caption: fuente,
    marginBottom: 40,
    x: {label: x},
    y: ejeValor(formato, y),
    color: {domain: datos.map((d) => String(d[x])), range: PALETA},
    marks: [
      Plot.ruleY([0], {stroke: "#e2e8f0"}),
      Plot.barY(datos, {x, y, fill: (d) => String(d[x]), fillOpacity: 0.85,
        channels: canales(x, (d) => d[x], y, formato, crudoKey),
        tip: {format: {x: false, y: false, fill: false}}}),
      Plot.text(datos, {x, y, text: etiqueta(y, formato), dy: -6, fontSize: 9}),
    ],
  });
}

// Barras agrupadas: subgrupos por serie dentro de cada x (fx). Cada barra su
// color (por serie), con leyenda. Escala y compartida. colorSerie (opcional):
// mapa serie->color (ej. COLOR_SEXO). serieLabel: nombre de la dimension serie
// para el tooltip (ej. "Sexo", "Edad").
export function barrasAgrupadas(datos, {x, serie, y, titulo = "", subtitulo = "",
    fuente = "", formato = "pct", colorSerie = null, serieLabel = "Serie",
    xLabel = null, crudoKey = null, escalaColor = null} = {}) {
  const colorOpts = escalaColor
    ? escalaColor
    : colorSerie
    ? {domain: Object.keys(colorSerie), range: Object.values(colorSerie), legend: true}
    : {range: PALETA, legend: true};
  // Con escala continua (edad), el fill debe ser el valor numerico de la serie.
  const fillSerie = escalaColor ? (d) => +d[serie] : serie;
  return Plot.plot({
    title: titulo,
    subtitle: subtitulo,
    caption: fuente,
    marginBottom: 40,
    marginRight: 90,
    x: {axis: null},
    fx: {label: xLabel ?? x},
    y: ejeValor(formato, y),
    color: colorOpts,
    marks: [
      Plot.ruleY([0], {stroke: "#e2e8f0"}),
      Plot.barY(datos, {fx: x, x: serie, y, fill: fillSerie, fillOpacity: 0.85,
        channels: {
          [xLabel ?? x]: (d) => d[x],
          [serieLabel]: (d) => d[serie],
          [formato === "pct" ? "Porcentaje" : "Valor"]: (d) =>
            formato === "pct" ? `${(+d[y]).toFixed(1)}%` : compacto(d[y]),
          ...(crudoKey ? {"Poblacion": (d) => compacto(d[crudoKey])} : {}),
        },
        tip: {format: {fx: false, x: false, y: false, fill: false}}}),
      Plot.text(datos, {fx: x, x: serie, y, text: etiqueta(y, formato),
                        dy: -6, fontSize: 8}),
    ],
  });
}

// Barras apiladas 100% (composicion). serie = categoria, valor = pct.
// dominioX (opcional): orden explicito del eje x (ej. deciles 1..10).
// faceta (opcional): columna para paneles lado a lado (ej. año).
export function barrasApiladas(datos, {x, serie, valor, titulo = "",
    subtitulo = "", fuente = "", dominioX = null, crudoKey = null, faceta = null} = {}) {
  const barOpts = {x, y: valor, fill: serie, order: serie, fillOpacity: 0.85,
    channels: {
      [serie]: (d) => d[serie],
      "Porcentaje": (d) => `${(+d[valor]).toFixed(1)}%`,
      ...(crudoKey ? {"Monto": (d) => compacto(d[crudoKey])} : {}),
    },
    tip: {format: {x: false, y: false, fill: false}}};
  if (faceta) barOpts.fx = faceta;
  return Plot.plot({
    title: titulo,
    subtitle: subtitulo,
    caption: fuente,
    marginRight: 140,
    color: {legend: true, range: PALETA},
    x: {label: null, ...(dominioX ? {domain: dominioX} : {})},
    ...(faceta ? {fx: {label: faceta}} : {}),
    y: {label: "%", grid: true, tickFormat: (d) => `${d}%`},
    marks: [
      Plot.barY(datos, barOpts),
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
      Plot.lineY(datos, {x, y, stroke: serie ?? "#60a5fa", marker: "circle",
        channels: serie ? {[serie]: (d) => d[serie]} : {},
        tip: true}),
    ],
  });
}

// Dispersion (un punto por municipio/entidad). etiquetaKey: nombre para el tip.
export function dispersion(datos, {x, y, titulo = "", subtitulo = "", fuente = "",
    etiquetaKey = null, rKey = null, resaltarNombre = null, faceta = null} = {}) {
  const canales = {
    ...(etiquetaKey ? {[etiquetaKey]: (d) => d[etiquetaKey]} : {}),
    ...(rKey ? {"Universo": (d) => compacto(d[rKey])} : {}),
  };
  const base = {x, y, fillOpacity: 0.5, fill: "#ea580c",
    ...(rKey ? {r: rKey} : {r: 3}),
    channels: canales,
    tip: {channels: canales, format: {x: true, y: true, r: false, fx: false, fill: false, stroke: false, fillOpacity: false}}};
  if (faceta) base.fx = faceta;
  const marks = [Plot.ruleY([0], {stroke: "#e2e8f0"})];
  if (resaltarNombre && etiquetaKey) {
    marks.push(Plot.dot(datos.filter((d) => d[etiquetaKey] !== resaltarNombre),
      {...base, fill: "#cbd5e1", fillOpacity: 0.35, stroke: null}));
    marks.push(Plot.dot(datos.filter((d) => d[etiquetaKey] === resaltarNombre),
      {...base, fill: "#ea580c", fillOpacity: 0.9, stroke: "#1D1D1B", strokeWidth: 1.5}));
  } else {
    marks.push(Plot.dot(datos, base));
  }
  return Plot.plot({
    title: titulo,
    subtitle: subtitulo,
    caption: fuente,
    ...(rKey ? {r: {range: [2, 14]}} : {}),
    ...(faceta ? {fx: {label: faceta}} : {}),
    x: {label: x, grid: true},
    y: {label: y, grid: true, tickFormat: (d) => `${d}%`},
    marks,
  });
}

// Barras horizontales (ranking por entidad/municipio): un color unico.
export function barrasH(datos, {x, y, titulo = "", subtitulo = "", fuente = "",
                                formato = "pct", crudoKey = null} = {}) {
  return Plot.plot({
    title: titulo,
    subtitle: subtitulo,
    caption: fuente,
    marginLeft: 150,
    height: Math.max(120, datos.length * 22 + 60),
    x: formato === "pct"
      ? {label: "%", grid: true, tickFormat: (d) => `${d}%`}
      : {label: x, grid: true, tickFormat: (d) => compacto(d)},
    y: {label: null},
    marks: [
      Plot.ruleX([0], {stroke: "#e2e8f0"}),
      Plot.barX(datos, {x, y, fill: "#60a5fa", fillOpacity: 0.85, sort: {y: "-x"},
        channels: {
          [y]: (d) => d[y],
          [formato === "pct" ? "Porcentaje" : "Valor"]: (d) =>
            formato === "pct" ? `${(+d[x]).toFixed(1)}%` : compacto(d[x]),
          ...(crudoKey ? {"Poblacion": (d) => compacto(d[crudoKey])} : {}),
        },
        tip: {format: {x: false, y: false}}}),
      Plot.text(datos, {x, y, text: etiqueta(x, formato), dx: 5,
                        textAnchor: "start", fontSize: 9}),
    ],
  });
}

// Barras facetadas: un mini-panel por valor de `faceta` (ej. año), lado a lado.
export function barrasFacetadas(datos, {x, y, faceta, titulo = "", subtitulo = "",
    fuente = "", formato = "pct", crudoKey = null} = {}) {
  return Plot.plot({
    title: titulo,
    subtitle: subtitulo,
    caption: fuente,
    marginBottom: 40,
    fx: {label: faceta},
    x: {label: x, tickRotate: 0},
    y: ejeValor(formato, y),
    marks: [
      Plot.ruleY([0], {stroke: "#e2e8f0"}),
      Plot.barY(datos, {fx: faceta, x, y, fill: "#60a5fa", fillOpacity: 0.85,
        channels: {
          [faceta]: (d) => d[faceta],
          [x]: (d) => d[x],
          [formato === "pct" ? "Porcentaje" : "Valor"]: (d) =>
            formato === "pct" ? `${(+d[y]).toFixed(1)}%` : compacto(d[y]),
          ...(crudoKey ? {"Poblacion": (d) => compacto(d[crudoKey])} : {}),
        },
        tip: {format: {fx: false, x: false, y: false}}}),
    ],
  });
}
