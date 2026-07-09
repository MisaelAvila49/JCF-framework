// src/components/graficas.js
// Especificaciones de Observable Plot con el estilo Social Data Ibero.
// Cantidades en el texto de las paginas; las graficas muestran porcentajes.
import * as Plot from "npm:@observablehq/plot";

// --- Paletas del tablero (aprobadas): color por el trabajo que hace cada
// dimension. Categorico para identidad, secuencial/ordinal para magnitud u orden.
// Validado para daltonismo (CVD delta-E >= 12). Corregir SOLO aqui. ---

// Categorico nominal (macrotema, programa, tipo): 8 slots en orden fijo, nunca
// ciclados. Si hay mas de 8 categorias, las sobrantes van a "Otros".
export const PALETA = ["#2a78d6", "#1baf7a", "#eda100", "#008300", "#4a3aa7", "#e34948", "#e87ba4", "#eb6834"];

// Sexo (categorico, 2): Femenino naranja, Masculino azul. Evita el estereotipo
// rosa/azul y es seguro para daltonicos.
export const COLOR_SEXO = {FEMENINO: "#eb6834", MASCULINO: "#2a78d6"};

// Años (ordinal 2019-2025): rampa del rojo de marca, claro -> oscuro. Distinta de
// la de edad para no confundir cuando ambas aparecen.
export const PALETA_AÑOS = ["#fbd5d8", "#f4a6ac", "#ec7480", "#e5404f", "#E30A18", "#a6111c", "#6f0e16"];
export const COLOR_AÑO = {
  "2019": PALETA_AÑOS[0], "2020": PALETA_AÑOS[1], "2021": PALETA_AÑOS[2],
  "2022": PALETA_AÑOS[3], "2023": PALETA_AÑOS[4], "2024": PALETA_AÑOS[5], "2025": PALETA_AÑOS[6],
};

// Edad (ordinal 18-29): rampa azul secuencial, claro (18) -> oscuro (29).
export const ESCALA_EDAD = {type: "linear", domain: [18, 29], scheme: "blues",
  legend: true, label: "Edad"};

// Deciles (ordinal 1-10): rampa azul. Se usa como dominio de color por decil.
export const RAMPA_DECIL = ["#cde2fb", "#b7d3f6", "#9ec5f4", "#6da7ec", "#3987e5",
  "#256abf", "#184f95", "#104281", "#0d366b", "#0a2a54"];

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

// Barras verticales simples: un color unico (el eje x ya identifica cada barra;
// colorear por x re-encoderia lo que la posicion ya muestra). Si el eje es el
// año, usa la rampa de años (ordinal) para reforzar la secuencia temporal.
// crudoKey (opcional): columna con el conteo crudo para el tooltip.
export function barras(datos, {x, y, titulo = "", subtitulo = "", fuente = "",
                               formato = "pct", crudoKey = null} = {}) {
  const esAño = x === "año" || datos.every((d) => /^20\d\d$/.test(String(d[x])));
  const colorOpts = esAño
    ? {domain: datos.map((d) => String(d[x])), range: datos.map((d) => COLOR_AÑO[String(d[x])] ?? "#2a78d6")}
    : null;
  return Plot.plot({
    title: titulo,
    subtitle: subtitulo,
    caption: fuente,
    marginBottom: 40,
    x: {label: x},
    y: ejeValor(formato, y),
    ...(colorOpts ? {color: colorOpts} : {}),
    marks: [
      Plot.ruleY([0], {stroke: "#e2e8f0"}),
      Plot.barY(datos, {x, y, fillOpacity: 0.9,
        fill: esAño ? (d) => String(d[x]) : "#2a78d6",
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
  const unPanel = (filas, tit, conLeyenda) => Plot.plot({
    title: tit,
    marginRight: conLeyenda ? 140 : 8,
    color: {legend: conLeyenda, range: PALETA, domain: [...new Set(datos.map((d) => d[serie]))]},
    x: {label: null, ...(dominioX ? {domain: dominioX} : {})},
    y: {label: "%", grid: true, tickFormat: (d) => `${d}%`},
    marks: [
      Plot.barY(filas, {x, y: valor, fill: serie, order: serie, fillOpacity: 0.85,
        channels: {
          [serie]: (d) => d[serie],
          "Porcentaje": (d) => `${(+d[valor]).toFixed(1)}%`,
          ...(crudoKey ? {"Monto": (d) => compacto(d[crudoKey])} : {}),
        },
        tip: {format: {x: false, y: false, fill: false}}}),
      Plot.ruleY([0], {stroke: "#e2e8f0"}),
    ],
  });
  if (!faceta) {
    const p = unPanel(datos, titulo, true);
    return subtitulo || fuente ? gridDe([p], {titulo: "", subtitulo, fuente}) : p;
  }
  const grupos = new Map();
  for (const d of datos) {
    if (!grupos.has(d[faceta])) grupos.set(d[faceta], []);
    grupos.get(d[faceta]).push(d);
  }
  const ent = [...grupos.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  const nodos = ent.map(([val, filas], i) => unPanel(filas, `${faceta}: ${val}`, i === ent.length - 1));
  return gridDe(nodos, {titulo, subtitulo, fuente});
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
      Plot.lineY(datos, {x, y, stroke: serie ?? "#2a78d6", marker: "circle",
        channels: serie ? {[serie]: (d) => d[serie]} : {},
        tip: true}),
    ],
  });
}

// Dispersion (un punto por municipio/entidad). etiquetaKey: nombre para el tip.
// resaltarNombre: destaca ese item (contorno) y atenua los demas.
// faceta: si se pasa, genera UNA grafica por valor de la faceta en grid 2-col.
export function dispersion(datos, {x, y, titulo = "", subtitulo = "", fuente = "",
    etiquetaKey = null, rKey = null, resaltarNombre = null, faceta = null} = {}) {
  const canales = {
    ...(etiquetaKey ? {[etiquetaKey]: (d) => d[etiquetaKey]} : {}),
    ...(rKey ? {"Universo": (d) => compacto(d[rKey])} : {}),
  };
  // Ejes X e Y fijos (mismos limites) en todos los paneles para comparar.
  const maxX = maxProp(datos, x), maxY = maxProp(datos, y);
  const unPanel = (filas, tit) => {
    const base = {x, y, fillOpacity: 0.5, fill: "#ea580c",
      ...(rKey ? {r: rKey} : {r: 3}), channels: canales,
      tip: {channels: canales, format: {x: true, y: true, r: false, fill: false, stroke: false, fillOpacity: false}}};
    const marks = [Plot.ruleY([0], {stroke: "#e2e8f0"})];
    if (resaltarNombre && etiquetaKey) {
      marks.push(Plot.dot(filas.filter((d) => d[etiquetaKey] !== resaltarNombre),
        {...base, fill: "#cbd5e1", fillOpacity: 0.35, stroke: null}));
      marks.push(Plot.dot(filas.filter((d) => d[etiquetaKey] === resaltarNombre),
        {...base, fill: "#ea580c", fillOpacity: 0.9, stroke: "#1D1D1B", strokeWidth: 1.5}));
    } else {
      marks.push(Plot.dot(filas, base));
    }
    return Plot.plot({
      title: tit,
      ...(rKey ? {r: {range: [2, 14]}} : {}),
      x: {label: x, grid: true, domain: [0, maxX > 0 ? maxX * 1.05 : 1]},
      y: {label: y, grid: true, tickFormat: (d) => `${d}%`, domain: [0, maxY > 0 ? maxY * 1.05 : 1]},
      marks,
    });
  };
  if (!faceta) {
    const p = unPanel(datos, titulo);
    return subtitulo || fuente ? gridDe([p], {titulo: "", subtitulo, fuente}) : p;
  }
  const grupos = new Map();
  for (const d of datos) {
    if (!grupos.has(d[faceta])) grupos.set(d[faceta], []);
    grupos.get(d[faceta]).push(d);
  }
  const nodos = [...grupos.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0])))
    .map(([val, filas]) => unPanel(filas, `${faceta}: ${val}`));
  return gridDe(nodos, {titulo, subtitulo, fuente});
}

// Barras horizontales (ranking por entidad/municipio): un color unico.
// dominioMax (opcional): fija el limite del eje de valor (para comparar entre
// facetas/años con la misma escala).
export function barrasH(datos, {x, y, titulo = "", subtitulo = "", fuente = "",
                                formato = "pct", crudoKey = null, dominioMax = null} = {}) {
  const dom = dominioMax != null ? {domain: [0, dominioMax]} : {};
  return Plot.plot({
    title: titulo,
    subtitle: subtitulo,
    caption: fuente,
    marginLeft: 150,
    height: Math.max(120, datos.length * 22 + 60),
    x: formato === "pct"
      ? {label: "%", grid: true, tickFormat: (d) => `${d}%`, ...dom}
      : {label: x, grid: true, tickFormat: (d) => compacto(d), ...dom},
    y: {label: null},
    marks: [
      Plot.ruleX([0], {stroke: "#e2e8f0"}),
      Plot.barX(datos, {x, y, fill: "#2a78d6", fillOpacity: 0.85, sort: {y: "-x"},
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

// Envuelve varias graficas en un grid de 2 columnas (max 2 por fila) para que
// cada una tenga ancho suficiente y los ejes se lean. Con titulo opcional arriba.
export function gridDe(nodos, {titulo = "", subtitulo = "", fuente = ""} = {}) {
  const cont = document.createElement("div");
  cont.style.cssText = "display:grid;gap:.4rem 1.5rem;";
  if (titulo) {
    const h = document.createElement("div");
    h.textContent = titulo;
    h.style.cssText = "font-weight:700;font-size:1.05rem;border-bottom:2px solid #E30A18;padding-bottom:.3rem;margin-bottom:.3rem;";
    cont.appendChild(h);
  }
  if (subtitulo) {
    const s = document.createElement("div");
    s.textContent = subtitulo;
    s.style.cssText = "color:#52514e;font-size:.85rem;margin-bottom:.5rem;";
    cont.appendChild(s);
  }
  const g = document.createElement("div");
  g.style.cssText = "display:grid;gap:1.25rem 1.5rem;grid-template-columns:repeat(2,minmax(0,1fr));align-items:start;";
  for (const n of nodos) { n.style.maxWidth = "100%"; g.appendChild(n); }
  cont.appendChild(g);
  if (fuente) {
    const c = document.createElement("div");
    c.textContent = fuente;
    c.style.cssText = "color:#898781;font-size:.75rem;margin-top:.4rem;";
    cont.appendChild(c);
  }
  return cont;
}

// Barras facetadas por año: UNA grafica por año en grid de 2 columnas (no paneles
// internos estrechos). dominioX (opcional): orden del eje x (ej. deciles 1..10).
export function barrasFacetadas(datos, {x, y, faceta, titulo = "", subtitulo = "",
    fuente = "", formato = "pct", crudoKey = null, dominioX = null} = {}) {
  const grupos = new Map();
  for (const d of datos) {
    if (!grupos.has(d[faceta])) grupos.set(d[faceta], []);
    grupos.get(d[faceta]).push(d);
  }
  // Eje Y fijo (mismo maximo) en todos los paneles para comparar entre años.
  const maxY = maxProp(datos, y);
  const ejeY = {...ejeValor(formato, y), domain: [0, maxY > 0 ? maxY * 1.05 : 1]};
  const nodos = [...grupos.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0])))
    .map(([val, filas]) => Plot.plot({
      title: `${faceta}: ${val}`,
      marginBottom: 40,
      x: {label: x, tickRotate: 0, ...(dominioX ? {domain: dominioX} : {})},
      y: ejeY,
      marks: [
        Plot.ruleY([0], {stroke: "#e2e8f0"}),
        Plot.barY(filas, {x, y, fill: "#2a78d6", fillOpacity: 0.85,
          channels: {
            [x]: (d) => d[x],
            [formato === "pct" ? "Porcentaje" : "Valor"]: (d) =>
              formato === "pct" ? `${(+d[y]).toFixed(1)}%` : compacto(d[y]),
            ...(crudoKey ? {"Poblacion": (d) => compacto(d[crudoKey])} : {}),
          },
          tip: {format: {x: false, y: false}}}),
      ],
    }));
  return gridDe(nodos, {titulo, subtitulo, fuente});
}
