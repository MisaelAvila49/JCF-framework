// src/components/render.js
// Decide la forma visual de una grafica segun el modo del motor de filtros.
// Modos de una unidad -> barras/serie. Modos de comparacion -> mapa (si
// mapeable) + ranking horizontal. Unica fuente de la decision visual.
import {barras, barrasH} from "./graficas.js";
import {mapaEntidades, mapaMunicipios} from "./mapa.js";

// config: {metrica, agrupaGeo, mapeable, unidad, titulo, subtitulo, fuente, etiquetaValor}
//  - metrica(filas, estado): -> [{clave, valor, crudo}] listo para barras
//  - agrupaGeo(filas, estado): -> [{cve, nombre, valor, crudo}] para comparacion
// contexto: {estado, modo, geoEnt, geoMun, nombrePorCve}
export function render(config, filas, contexto) {
  const {modo, estado} = contexto;
  const comparacion = modo === "compara-estados" || modo === "compara-municipios"
    || modo === "municipios-estado";
  if (!comparacion) {
    // Una unidad: barras normales.
    const datos = config.metrica(filas, estado);
    return barras(datos, {x: "clave", y: "valor", formato: config.unidad ?? "pct",
      crudoKey: "crudo", titulo: config.titulo, subtitulo: config.subtitulo,
      fuente: config.fuente});
  }
  // Comparacion: ranking + mapa (si mapeable).
  const geo = config.agrupaGeo(filas, estado);  // [{cve, nombre, valor, crudo}]
  const tope = modo === "compara-municipios" ? 50 : geo.length;
  const ranking = geo.slice().sort((a, b) => b.valor - a.valor).slice(0, tope);
  const out = [];
  if (config.mapeable) {
    const valores = new Map(geo.map((d) => [d.cve, d.valor]));
    if (modo === "compara-estados") {
      out.push(mapaEntidades(contexto.geoEnt, valores, {subtitulo: config.subtitulo,
        fuente: config.fuente, nombrePorCve: contexto.nombrePorCve,
        formato: config.unidad ?? "pct", etiquetaValor: config.etiquetaValor ?? "valor"}));
    } else if (modo === "municipios-estado" && contexto.geoMun) {
      out.push(mapaMunicipios(contexto.geoMun, valores, {subtitulo: config.subtitulo,
        fuente: config.fuente, formato: config.unidad ?? "pct",
        etiquetaValor: config.etiquetaValor ?? "valor"}));
    }
  }
  out.push(barrasH(ranking.map((d) => ({nombre: d.nombre, valor: d.valor, crudo: d.crudo})),
    {x: "valor", y: "nombre", formato: config.unidad ?? "pct", crudoKey: "crudo",
     titulo: config.titulo, subtitulo: (config.subtitulo ?? "") + " (ranking)",
     fuente: config.fuente}));
  return out;
}
