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
    // Grafica principal segun tipo/desglose.
    let principal;
    if (tipo === "dispersion") {
      principal = dispersion(datos, {x: config.x ?? "x", y: config.y ?? "valor",
        etiquetaKey: config.etiquetaKey, titulo: config.titulo,
        subtitulo: config.subtitulo, fuente: config.fuente});
    } else if (tipo === "apilada") {
      principal = barrasApiladas(datos, {x: config.x ?? "x", serie: config.serie,
        valor: "valor", faceta: factea ? "año" : null, dominioX: config.dominioX,
        crudoKey: "crudo", titulo: config.titulo, subtitulo: config.subtitulo,
        fuente: config.fuente});
    } else if (tipo === "serie" && desagreg && config.serieDesglose) {
      principal = barrasAgrupadas(datos, {x: "año", serie: "serie", y: "valor",
        formato: config.unidad ?? "pct", crudoKey: "crudo",
        colorSerie: sexoAct ? COLOR_SEXO : null,
        escalaColor: edadAct ? ESCALA_EDAD : null,
        serieLabel: sexoAct ? "Sexo" : "Edad", xLabel: "año",
        titulo: config.titulo, subtitulo: config.subtitulo, fuente: config.fuente});
    } else if (factea) {
      principal = barrasFacetadas(datos, {x: "clave", y: "valor", faceta: "año",
        formato: config.unidad ?? "pct", crudoKey: "crudo", titulo: config.titulo,
        subtitulo: config.subtitulo, fuente: config.fuente});
    } else {
      principal = barras(datos, {x: "clave", y: "valor", formato: config.unidad ?? "pct",
        crudoKey: "crudo", titulo: config.titulo, subtitulo: config.subtitulo,
        fuente: config.fuente});
    }
    // Mapa de contexto persistente: si la grafica es mapeable y hay una unidad
    // elegida, se muestra el mapa (nacional o del estado) con la unidad resaltada,
    // usando los datos completos (sin el filtro de unidad).
    const mapaCtx = (config.mapeable && contexto.datosCompletos && config.agrupaGeoAño
      && (modo === "estado" || modo === "municipio"))
      ? mapaContexto(config, contexto, estado, modo) : null;
    if (!mapaCtx) return principal;
    const cont = document.createElement("div");
    cont.style.display = "grid";
    cont.style.gap = "1.5rem";
    cont.appendChild(mapaCtx);
    cont.appendChild(principal);
    return cont;
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

  const mapas = [], rankings = [];
  for (const [año, geo] of porAño) {
    const tope = modo === "compara-municipios" ? 50 : geo.length;
    const ranking = geo.slice().sort((a, b) => b.valor - a.valor).slice(0, tope);
    const sufAño = año ? `${año}` : "";
    if (config.mapeable) {
      const valores = new Map(geo.map((d) => [d.cve, d.valor]));
      if (modo === "compara-estados") {
        mapas.push(mapaEntidades(contexto.geoEnt, valores, {titulo: sufAño,
          subtitulo: config.subtitulo, fuente: config.fuente, nombrePorCve: contexto.nombrePorCve,
          formato: config.unidad ?? "pct", etiquetaValor: config.etiquetaValor ?? "valor",
          resaltarCve: estado.cveEnt ?? null, tooltipExtra: config.tooltipExtra}));
      } else if (modo === "municipios-estado" && contexto.geoMun) {
        mapas.push(mapaMunicipios(contexto.geoMun, valores, {titulo: sufAño,
          subtitulo: config.subtitulo, fuente: config.fuente, formato: config.unidad ?? "pct",
          etiquetaValor: config.etiquetaValor ?? "valor", resaltarCve: estado.cveMun ?? null}));
      }
    }
    rankings.push(barrasH(ranking.map((d) => ({nombre: d.nombre, valor: d.valor, crudo: d.crudo})),
      {x: "valor", y: "nombre", formato: config.unidad ?? "pct", crudoKey: "crudo",
       titulo: sufAño, subtitulo: (config.subtitulo ?? "") + " (ranking)", fuente: config.fuente}));
  }
  // Mapas juntos en una fila (subplots por año, lado a lado); rankings en otra.
  const cont = document.createElement("div");
  cont.style.display = "grid";
  cont.style.gap = "2rem";
  if (config.titulo) {
    const h = document.createElement("div");
    h.textContent = config.titulo;
    h.style.cssText = "font-weight:700;font-size:1.15rem;border-bottom:2px solid #E30A18;padding-bottom:.3rem;";
    cont.appendChild(h);
  }
  if (mapas.length) cont.appendChild(fila(mapas));
  if (rankings.length) cont.appendChild(fila(rankings));
  return cont;
}

// Envuelve nodos en un grid de 2 columnas fijas (2 subplots por fila, para que
// no se pierdan los porcentajes al comprimir muchos años en una sola fila).
function fila(nodos) {
  const f = document.createElement("div");
  f.style.cssText = "display:grid;gap:1.25rem 1.5rem;grid-template-columns:repeat(2,minmax(0,1fr));align-items:start;";
  for (const n of nodos) { n.style.maxWidth = "100%"; f.appendChild(n); }
  return f;
}

// Mapa de contexto (nacional o del estado) con la unidad elegida resaltada, sobre
// los datos completos. Muestra un mini-mapa por año (fila horizontal).
function mapaContexto(config, contexto, estado, modo) {
  const geoTodos = config.agrupaGeoAño(contexto.datosCompletos, estado);
  const porAño = new Map();
  for (const d of geoTodos) {
    if (!porAño.has(d.año)) porAño.set(d.año, []);
    porAño.get(d.año).push(d);
  }
  const mapas = [];
  for (const [año, geo] of [...porAño.entries()].sort((a, b) => +a[0] - +b[0])) {
    const valores = new Map(geo.map((d) => [d.cve, d.valor]));
    if (modo === "estado") {
      mapas.push(mapaEntidades(contexto.geoEnt, valores, {titulo: año,
        subtitulo: "seleccion resaltada", fuente: config.fuente, nombrePorCve: contexto.nombrePorCve,
        formato: config.unidad ?? "pct", etiquetaValor: config.etiquetaValor ?? "valor",
        resaltarCve: estado.cveEnt}));
    } else if (modo === "municipio" && contexto.geoMun) {
      mapas.push(mapaMunicipios(contexto.geoMun, valores, {titulo: año,
        subtitulo: "seleccion resaltada", fuente: config.fuente, formato: config.unidad ?? "pct",
        etiquetaValor: config.etiquetaValor ?? "valor", resaltarCve: estado.cveMun}));
    }
  }
  return fila(mapas);
}
