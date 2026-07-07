// src/components/graficas.js
// Funciones que devuelven especificaciones de Observable Plot. Las cantidades
// van en el texto de las paginas; las graficas muestran porcentajes.
import * as Plot from "npm:@observablehq/plot";

// Barras verticales con etiqueta de valor encima. formato "pct" agrega %.
export function barras(datos, {x, y, titulo = "", formato = "pct"} = {}) {
  const etiqueta = (d) => formato === "pct" ? `${(+d[y]).toFixed(2)}%`
                                            : `${Math.round(+d[y]).toLocaleString()}`;
  return Plot.plot({
    title: titulo,
    marginBottom: 50,
    x: {label: x, tickRotate: -30},
    y: {label: formato === "pct" ? "%" : y, grid: true},
    marks: [
      Plot.barY(datos, {x, y, fill: "#4C72B0"}),
      Plot.text(datos, {x, y, text: etiqueta, dy: -6, fontSize: 9}),
      Plot.ruleY([0]),
    ],
  });
}

// Barras apiladas 100% (composicion). serie = columna de categoria, valor = pct.
export function barrasApiladas(datos, {x, serie, valor, titulo = ""} = {}) {
  return Plot.plot({
    title: titulo,
    marginRight: 140,
    color: {legend: true},
    x: {label: x},
    y: {label: "%", grid: true},
    marks: [
      Plot.barY(datos, {x, y: valor, fill: serie, order: serie}),
      Plot.ruleY([0]),
    ],
  });
}

// Lineas por grupo. serie opcional (una linea por valor de serie).
export function lineas(datos, {x, y, serie = null, titulo = ""} = {}) {
  return Plot.plot({
    title: titulo,
    color: {legend: serie != null},
    x: {label: x},
    y: {label: "%", grid: true},
    marks: [
      Plot.lineY(datos, {x, y, stroke: serie ?? "#4C72B0", marker: "circle"}),
    ],
  });
}

// Dispersion (cruces pobreza/marginacion): un punto por municipio.
export function dispersion(datos, {x, y, titulo = ""} = {}) {
  return Plot.plot({
    title: titulo,
    x: {label: x, grid: true},
    y: {label: y, grid: true},
    marks: [Plot.dot(datos, {x, y, r: 2, fillOpacity: 0.4, fill: "#4C72B0"})],
  });
}
