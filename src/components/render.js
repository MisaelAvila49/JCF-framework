// src/components/render.js
// Decide la forma visual de una grafica segun el modo del motor de filtros.
// Modos de una unidad -> barras/serie. Modos de comparacion -> mapa (si
// mapeable) + ranking horizontal. Unica fuente de la decision visual.
import {barras, barrasH, barrasApiladas, barrasFacetadas, barrasAgrupadas,
  dispersion, COLOR_SEXO, ESCALA_EDAD} from "./graficas.js";
import {mapaEntidades, mapaMunicipios} from "./mapa.js";

// config: {metrica, agrupaGeo, mapeable, unidad, tipo, facetaAño, serie, dominioX,
//   titulo, subtitulo, fuente, etiquetaValor}
//  - metrica(filas, estado): -> filas listas para la grafica (con clave/valor/crudo,
//    o para apilada con x/serie/valor; incluye `año` si se factea).
//  - agrupaGeo(filas, estado): -> [{cve, nombre, valor, crudo}] para comparacion
//  - tipo: "serie" | "distribucion" | "apilada" | "dispersion" (default "serie")
//  - facetaAño: "auto" | true | false (default "auto": factea si desglose o tipo!=serie)
// contexto: {estado, modo, geoEnt, geoMun, nombrePorCve}
export function render(config, filas, contexto) {
  const {modo, estado} = contexto;
  const comparacion = modo === "compara-estados" || modo === "compara-municipios"
    || modo === "municipios-estado";
  const tipo = config.tipo ?? "serie";
  const sexoAct = estado.sexo && estado.sexo !== "Todos";
  const edadAct = estado.edadMin != null;
  const desagreg = sexoAct || edadAct;
  // Faceta por año SOLO cuando el eje x no es el año (tipo distinto de serie).
  const factea = config.facetaAño === true
    || (config.facetaAño !== false && tipo !== "serie");
  if (!comparacion) {
    const datos = config.metrica(filas, estado);
    if (tipo === "dispersion") {
      return dispersion(datos, {x: config.x ?? "x", y: config.y ?? "valor",
        etiquetaKey: config.etiquetaKey, titulo: config.titulo,
        subtitulo: config.subtitulo, fuente: config.fuente});
    }
    if (tipo === "apilada") {
      return barrasApiladas(datos, {x: config.x ?? "x", serie: config.serie,
        valor: "valor", faceta: factea ? "año" : null, dominioX: config.dominioX,
        crudoKey: "crudo", titulo: config.titulo, subtitulo: config.subtitulo,
        fuente: config.fuente});
    }
    // Serie con desglose sexo/edad: barras agrupadas por año, una barra por serie.
    if (tipo === "serie" && desagreg && config.serieDesglose) {
      return barrasAgrupadas(datos, {x: "año", serie: "serie", y: "valor",
        formato: config.unidad ?? "pct", crudoKey: "crudo",
        colorSerie: sexoAct ? COLOR_SEXO : null,
        escalaColor: edadAct ? ESCALA_EDAD : null,
        serieLabel: sexoAct ? "Sexo" : "Edad", xLabel: "año",
        titulo: config.titulo, subtitulo: config.subtitulo, fuente: config.fuente});
    }
    if (factea) {
      return barrasFacetadas(datos, {x: "clave", y: "valor", faceta: "año",
        formato: config.unidad ?? "pct", crudoKey: "crudo", titulo: config.titulo,
        subtitulo: config.subtitulo, fuente: config.fuente});
    }
    return barras(datos, {x: "clave", y: "valor", formato: config.unidad ?? "pct",
      crudoKey: "crudo", titulo: config.titulo, subtitulo: config.subtitulo,
      fuente: config.fuente});
  }
  // Comparacion: mapa + ranking, un bloque por año si agrupaGeoAño existe.
  // agrupaGeoAño(filas, estado) -> [{año, cve, nombre, valor, crudo}].
  const out = [];
  const porAño = config.agrupaGeoAño
    ? (() => {
        const m = new Map();
        for (const d of config.agrupaGeoAño(filas, estado)) {
          if (!m.has(d.año)) m.set(d.año, []);
          m.get(d.año).push(d);
        }
        return [...m.entries()].sort((a, b) => +a[0] - +b[0]);
      })()
    : [["", config.agrupaGeo(filas, estado)]];

  for (const [año, geo] of porAño) {
    const tope = modo === "compara-municipios" ? 50 : geo.length;
    const ranking = geo.slice().sort((a, b) => b.valor - a.valor).slice(0, tope);
    const sufAño = año ? ` — ${año}` : "";
    if (config.mapeable) {
      const valores = new Map(geo.map((d) => [d.cve, d.valor]));
      if (modo === "compara-estados") {
        out.push(mapaEntidades(contexto.geoEnt, valores, {titulo: config.titulo + sufAño,
          subtitulo: config.subtitulo, fuente: config.fuente, nombrePorCve: contexto.nombrePorCve,
          formato: config.unidad ?? "pct", etiquetaValor: config.etiquetaValor ?? "valor",
          resaltarCve: estado.cveEnt ?? null, tooltipExtra: config.tooltipExtra}));
      } else if (modo === "municipios-estado" && contexto.geoMun) {
        out.push(mapaMunicipios(contexto.geoMun, valores, {titulo: config.titulo + sufAño,
          subtitulo: config.subtitulo, fuente: config.fuente, formato: config.unidad ?? "pct",
          etiquetaValor: config.etiquetaValor ?? "valor", resaltarCve: estado.cveMun ?? null}));
      }
    }
    out.push(barrasH(ranking.map((d) => ({nombre: d.nombre, valor: d.valor, crudo: d.crudo})),
      {x: "valor", y: "nombre", formato: config.unidad ?? "pct", crudoKey: "crudo",
       titulo: config.titulo + sufAño, subtitulo: (config.subtitulo ?? "") + " (ranking)",
       fuente: config.fuente}));
  }
  // Contenedor a ancho completo para que las facetas por año usen todo el ancho.
  const cont = document.createElement("div");
  cont.style.display = "grid";
  cont.style.gap = "1.5rem";
  for (const nodo of out) cont.appendChild(nodo);
  return cont;
}
