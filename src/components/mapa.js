// src/components/mapa.js
// Mapa coropletico de entidades de Mexico con Observable Plot (Plot.geo).
// El geojson (src/data/mx_entidades.json) identifica cada estado con un codigo
// ISO en properties.id; aqui se traduce a la cve_ent oficial de INEGI (01-32).
import * as Plot from "npm:@observablehq/plot";
import {compacto} from "./graficas.js";

// Construye las marcas del mapa: una capa (o dos si hay resaltado, con estilos
// CONSTANTES para que stroke/opacity no aparezcan como canales en el tooltip).
// El tooltip solo muestra los canales de datos (nombre, valor, extra).
function geoMarks(feats, resaltarCve, {etiquetaValor, formato, tooltipExtra, nombreKey}) {
  const canales = {
    [nombreKey]: (d) => d.properties.nombre,
    [etiquetaValor]: (d) => d.properties.valor == null ? "sin dato"
      : (formato === "pct" ? `${(+d.properties.valor).toFixed(1)}%` : compacto(d.properties.valor)),
    ...(tooltipExtra ? {[tooltipExtra.label]: (d) => tooltipExtra.map.get(d.properties.cve) ?? "sin dato"} : {}),
  };
  const tip = {channels: canales, format: {fill: false, stroke: false, fillOpacity: false, strokeWidth: false}};
  const base = {fill: (d) => d.properties.valor, channels: canales};
  if (!resaltarCve) {
    return [Plot.geo(feats, {...base, stroke: "#fff", strokeWidth: 0.5, tip})];
  }
  const otros = feats.filter((f) => f.properties.cve !== resaltarCve);
  const sel = feats.filter((f) => f.properties.cve === resaltarCve);
  return [
    Plot.geo(otros, {...base, stroke: "#fff", strokeWidth: 0.5, fillOpacity: 0.4, tip}),
    Plot.geo(sel, {...base, stroke: "#1D1D1B", strokeWidth: 2.5, fillOpacity: 1, tip}),
  ];
}

// ISO (properties.id del geojson) -> cve_ent INEGI de dos digitos.
export const ISO_A_CVE = {
  "MX-AGU": "01", "MX-BCN": "02", "MX-BCS": "03", "MX-CAM": "04",
  "MX-COA": "05", "MX-COL": "06", "MX-CHP": "07", "MX-CHH": "08",
  "MX-CMX": "09", "MX-DUR": "10", "MX-GUA": "11", "MX-GRO": "12",
  "MX-HID": "13", "MX-JAL": "14", "MX-MEX": "15", "MX-MIC": "16",
  "MX-MOR": "17", "MX-NAY": "18", "MX-NLE": "19", "MX-OAX": "20",
  "MX-PUE": "21", "MX-QUE": "22", "MX-ROO": "23", "MX-SLP": "24",
  "MX-SIN": "25", "MX-SON": "26", "MX-TAB": "27", "MX-TAM": "28",
  "MX-TLA": "29", "MX-VER": "30", "MX-YUC": "31", "MX-ZAC": "32",
};

// Escala secuencial de rojos de la marca Social Data (claro -> oscuro).
export const REDS = ["#fde8ea", "#f9b8bf", "#f28791", "#e85463", "#d42234", "#a3121f"];

// Dibuja un mapa coropletico. geo: FeatureCollection de entidades.
// valores: Map de cve_ent (2 digitos) -> numero a colorear.
// nombrePorCve: Map cve_ent -> nombre (para el tooltip).
// formato "pct" formatea el valor con %, "entero" lo colapsa a K/M.
export function mapaEntidades(geo, valores, {titulo = "", subtitulo = "",
    fuente = "", nombrePorCve = null, formato = "pct", etiquetaValor = "valor",
    resaltarCve = null, tooltipExtra = null} = {}) {
  // Adjunta el valor a cada feature (por cve_ent).
  const feats = geo.features.map((f) => {
    const cve = ISO_A_CVE[f.properties.id];
    const v = valores.get(cve);
    return {...f, properties: {...f.properties, cve, valor: v ?? null,
      nombre: nombrePorCve?.get(cve) ?? f.properties.name}};
  });
  return Plot.plot({
    title: titulo,
    subtitle: subtitulo,
    caption: fuente,
    projection: {type: "mercator", domain: {type: "FeatureCollection", features: feats}},
    width: 720,
    height: 460,
    color: {
      range: REDS,
      type: "quantize",
      n: 6,
      ...(formato === "pct" ? {domain: [0, 100]} : {}),
      legend: true,
      label: etiquetaValor + (formato === "pct" ? " (0-100%)" : ""),
      unknown: "#eee",
      tickFormat: (d) => formato === "pct" ? `${(+d).toFixed(0)}%` : compacto(d),
    },
    marks: geoMarks(feats, resaltarCve, {etiquetaValor, formato, tooltipExtra, nombreKey: "Entidad"}),
  });
}

// Mapa coropletico de los municipios de un estado. geo: FeatureCollection del
// estado (properties.CVEGEO = cve_mun de 5 digitos, NOM_MUN = nombre).
// valores: Map cve_mun -> numero. Colormap fijo 0-100 para porcentajes.
export function mapaMunicipios(geo, valores, {titulo = "", subtitulo = "",
    fuente = "", formato = "pct", etiquetaValor = "valor", resaltarCve = null} = {}) {
  const feats = geo.features.map((f) => {
    const cve = String(f.properties.CVEGEO ?? f.properties.CVE_MUN);
    return {...f, properties: {...f.properties, cve, valor: valores.get(cve) ?? null,
      nombre: f.properties.NOM_MUN}};
  });
  return Plot.plot({
    title: titulo,
    subtitle: subtitulo,
    caption: fuente,
    projection: {type: "mercator", domain: {type: "FeatureCollection", features: feats}},
    width: 720,
    height: 480,
    color: {
      range: REDS, type: "quantize", n: 6,
      ...(formato === "pct" ? {domain: [0, 100]} : {}),
      legend: true, label: etiquetaValor + (formato === "pct" ? " (0-100%)" : ""), unknown: "#eee",
      tickFormat: (d) => formato === "pct" ? `${(+d).toFixed(0)}%` : compacto(d),
    },
    marks: geoMarks(feats, resaltarCve, {etiquetaValor, formato, tooltipExtra: null, nombreKey: "Municipio"}),
  });
}
