# Padron JCF

Cada grafica tiene su propio panel: nivel (Nacional/Estatal/Municipal), estado,
municipio, sexo y edad. Inicia en Nacional. En nivel Estatal/Municipal sin
seleccion se comparan las unidades (mapa + ranking); al elegir una se habilitan
sexo y edad.

```js
import {controlPanel, resolverEstado} from "./components/controlPanel.js";
import {filtrar} from "./components/filtro.js";
import {render} from "./components/render.js";
import {conTasa, agrupar} from "./components/agregar.js";
import {dispersion, maxProp, barrasFacetadas} from "./components/graficas.js";
const padron = FileAttachment("./data/padron_agregado.csv").csv({typed: true});
const cruces = FileAttachment("./data/padron_cruces.csv").csv({typed: true});
const unicos = FileAttachment("./data/padron_unicos_geo.csv").csv({typed: true});
const monto = FileAttachment("./data/padron_monto_geo.csv").csv({typed: true});
const antig = FileAttachment("./data/padron_antiguedad_geo.csv").csv({typed: true});
const geoEnt = FileAttachment("./data/mx_entidades.json").json();
```

```js
const GEO_MUN = {
  "01": FileAttachment("./data/municipios/01.json"), "02": FileAttachment("./data/municipios/02.json"),
  "03": FileAttachment("./data/municipios/03.json"), "04": FileAttachment("./data/municipios/04.json"),
  "05": FileAttachment("./data/municipios/05.json"), "06": FileAttachment("./data/municipios/06.json"),
  "07": FileAttachment("./data/municipios/07.json"), "08": FileAttachment("./data/municipios/08.json"),
  "09": FileAttachment("./data/municipios/09.json"), "10": FileAttachment("./data/municipios/10.json"),
  "11": FileAttachment("./data/municipios/11.json"), "12": FileAttachment("./data/municipios/12.json"),
  "13": FileAttachment("./data/municipios/13.json"), "14": FileAttachment("./data/municipios/14.json"),
  "15": FileAttachment("./data/municipios/15.json"), "16": FileAttachment("./data/municipios/16.json"),
  "17": FileAttachment("./data/municipios/17.json"), "18": FileAttachment("./data/municipios/18.json"),
  "19": FileAttachment("./data/municipios/19.json"), "20": FileAttachment("./data/municipios/20.json"),
  "21": FileAttachment("./data/municipios/21.json"), "22": FileAttachment("./data/municipios/22.json"),
  "23": FileAttachment("./data/municipios/23.json"), "24": FileAttachment("./data/municipios/24.json"),
  "25": FileAttachment("./data/municipios/25.json"), "26": FileAttachment("./data/municipios/26.json"),
  "27": FileAttachment("./data/municipios/27.json"), "28": FileAttachment("./data/municipios/28.json"),
  "29": FileAttachment("./data/municipios/29.json"), "30": FileAttachment("./data/municipios/30.json"),
  "31": FileAttachment("./data/municipios/31.json"), "32": FileAttachment("./data/municipios/32.json"),
};
async function geoMunDe(estado) {
  if (estado.nivel === "municipal" && estado.cveEnt && GEO_MUN[estado.cveEnt]) {
    return await GEO_MUN[estado.cveEnt].json();
  }
  return null;
}
```

```js
// Catalogos nombre<->cve.
const catEnt = Array.from(new Map(cruces.map((d) =>
  [String(d.cve_ent).padStart(2, "0"), d.nombre_ent])).entries())
  .map(([cve, nombre]) => ({cve, nombre}));
const catMun = Array.from(new Map(cruces.map((d) =>
  [String(d.cve_mun).padStart(5, "0"), d.nombre_mun])).entries())
  .map(([cve, nombre]) => ({cve, nombre}));
const nombrePorCve = new Map(catEnt.map((e) => [e.cve, e.nombre]));
const nombreEntPorCve = nombrePorCve;
const nombreMunPorCve = new Map(catMun.map((m) => [m.cve, m.nombre]));
// Años disponibles en el padron (para el filtro por año del controlPanel).
// aniosPad: todos los años con beneficiarios (monto, unicos, antiguedad).
// aniosCob: solo los que tienen candidatos > 0 (cobertura/sexo/edad necesitan
// denominador; 2019 y 2020 no lo tienen, por eso no se ofrecen ahi).
const aniosPad = [...new Set(padron.filter((d) => +d.beneficiarios > 0).map((d) => String(d.año)))].sort((a, b) => +a - +b);
const aniosCob = [...new Set(padron.filter((d) => +d.candidatos > 0).map((d) => String(d.año)))].sort((a, b) => +a - +b);
// Helper: agrupa geograficamente una metrica (suma numerador/denominador) para
// comparacion. calc(acc) devuelve el valor final; crudoKey el conteo.
function geoBloque(filas, estado, {num, den, crudoDe}) {
  const esMun = estado.nivel === "municipal";
  const llave = esMun ? "cve_mun" : "cve_ent";
  const pad = esMun ? 5 : 2;
  const nombreDe = esMun ? nombreMunPorCve : nombreEntPorCve;
  const m = new Map();
  for (const d of filas) {
    const cve = String(d[llave]).padStart(pad, "0");
    if (!m.has(cve)) m.set(cve, {n: 0, d: 0, c: 0});
    const a = m.get(cve);
    a.n += num(d); a.d += den(d); a.c += crudoDe(d);
  }
  return [...m].map(([cve, a]) => ({cve, nombre: nombreDe.get(cve) ?? cve,
    valor: a.d ? a.n / a.d * 100 : 0, crudo: a.c}));
}
// Igual que geoBloque pero por año x cve (para facetar la comparacion por año).
// ratio=true: valor = num/den*100 (%). ratio=false: valor = num (conteo).
function geoBloqueAño(filas, estado, {num, den, crudoDe, ratio = true}) {
  const esMun = estado.nivel === "municipal";
  const llave = esMun ? "cve_mun" : "cve_ent";
  const pad = esMun ? 5 : 2;
  const nombreDe = esMun ? nombreMunPorCve : nombreEntPorCve;
  const m = new Map();
  for (const d of filas) {
    const cve = String(d[llave]).padStart(pad, "0");
    const k = d.año + "|" + cve;
    if (!m.has(k)) m.set(k, {año: String(d.año), cve, n: 0, d: 0, c: 0});
    const a = m.get(k);
    a.n += num(d); a.d += (den ? den(d) : 0); a.c += crudoDe(d);
  }
  return [...m.values()].map((a) => ({año: a.año, cve: a.cve,
    nombre: nombreDe.get(a.cve) ?? a.cve,
    valor: ratio ? (a.d ? a.n / a.d * 100 : 0) : a.n, crudo: a.c}));
}
```

## Cobertura

```js
const cobV = view(controlPanel({catEnt, catMun, anios: aniosCob}));
```

```js
{
  const est = resolverEstado(cobV, {catEnt, catMun});
  const {filas, modo} = filtrar(padron, est);
  const cfg = {
    unidad: "pct", etiquetaValor: "cobertura", mapeable: true, tipo: "serie",
    facetaAño: false, serieDesglose: true, titulo: "Cobertura",
    subtitulo: "% de candidatos con beca", fuente: "Fuente: STPS",
    metrica: (f, e) => {
      const sexoAct = e.sexo && e.sexo !== "Todos";
      const edadAct = e.edadMin != null;
      if (sexoAct || edadAct) {
        // Serie por año x sexo o x edad (barras agrupadas, año en el eje).
        const key = sexoAct ? "sexo" : "edad";
        const m = new Map();
        for (const d of f) {
          if (sexoAct && d.sexo !== "FEMENINO" && d.sexo !== "MASCULINO") continue;
          if (edadAct && (d.edad === "" || d.edad == null)) continue;
          const serie = String(d[key]);
          const k = d.año + "|" + serie;
          if (!m.has(k)) m.set(k, {año: String(d.año), serie, ben: 0, can: 0});
          const a = m.get(k); a.ben += +d.beneficiarios || 0; a.can += +d.candidatos || 0;
        }
        return [...m.values()].filter((d) => d.can > 0)
          .map((d) => ({año: d.año, serie: d.serie, valor: d.ben / d.can * 100, crudo: d.ben}));
      }
      const g = conTasa(agrupar(f, ["año"])).filter((d) => d.tasa != null);
      return g.map((d) => ({clave: String(d.año), año: String(d.año), valor: d.tasa, crudo: d.beneficiarios}));
    },
    agrupaGeoAño: (f, e) => geoBloqueAño(f.filter((d) => +d.candidatos > 0), e,
      {num: (d) => +d.beneficiarios || 0, den: (d) => +d.candidatos || 0, crudoDe: (d) => +d.beneficiarios || 0}),
  };
  const ctx = {modo, estado: est, geoEnt: await geoEnt, geoMun: await geoMunDe(est), nombrePorCve, datosCompletos: padron};
  display(render(cfg, filas, ctx));
}
```

## Perfil por sexo

```js
const sexoV = view(controlPanel({catEnt, catMun, anios: aniosCob}));
```

```js
{
  const est = resolverEstado(sexoV, {catEnt, catMun});
  // Esta grafica ES el desglose por sexo: se ignora el filtro de sexo del panel
  // (si no, elegir un sexo daria 100%). El denominador es el total de ambos sexos.
  const {filas, modo} = filtrar(padron, {...est, sexo: "Todos"});
  const cfg = {
    unidad: "pct", mapeable: true, tipo: "serie", facetaAño: false, etiquetaValor: "% mujeres",
    titulo: "Perfil por sexo", subtitulo: "% de mujeres entre los beneficiarios por año",
    fuente: "Fuente: STPS",
    metrica: (f) => {
      // % de mujeres por año (año en el eje, todos los años).
      const cs = f.filter((d) => d.sexo === "FEMENINO" || d.sexo === "MASCULINO");
      const porAño = new Map();
      for (const d of cs) {
        if (!porAño.has(d.año)) porAño.set(d.año, {fem: 0, tot: 0});
        const a = porAño.get(d.año);
        a.tot += +d.beneficiarios || 0;
        if (d.sexo === "FEMENINO") a.fem += +d.beneficiarios || 0;
      }
      return [...porAño].filter(([, a]) => a.tot > 0)
        .map(([año, a]) => ({clave: String(año), año: String(año), valor: a.fem / a.tot * 100, crudo: a.fem}))
        .sort((x, y) => +x.clave - +y.clave);
    },
    agrupaGeoAño: (f, e) => geoBloqueAño(f.filter((d) => d.sexo === "FEMENINO" || d.sexo === "MASCULINO"), e,
      {num: (d) => d.sexo === "FEMENINO" ? (+d.beneficiarios || 0) : 0,
       den: (d) => +d.beneficiarios || 0, crudoDe: (d) => d.sexo === "FEMENINO" ? (+d.beneficiarios || 0) : 0}),
  };
  const ctx = {modo, estado: est, geoEnt: await geoEnt, geoMun: await geoMunDe(est), nombrePorCve, datosCompletos: padron};
  display(render(cfg, filas, ctx));
}
```

## Distribucion por edad

```js
const edadV = view(controlPanel({catEnt, catMun, anios: aniosCob}));
```

```js
{
  const est = resolverEstado(edadV, {catEnt, catMun});
  // Esta grafica ES la distribucion por edad: se ignora el filtro de edad del
  // panel (si no, un rango daria una distribucion recortada artificialmente).
  const {filas, modo} = filtrar(padron, {...est, edadMin: null, edadMax: null});
  const cfg = {
    unidad: "pct", mapeable: false, tipo: "distribucion", facetaAño: true,
    titulo: "Distribucion por edad", subtitulo: "% de beneficiarios por edad, un panel por año",
    fuente: "Fuente: STPS",
    metrica: (f) => {
      // Por año x edad; % dentro de cada año (todos los años, facetados).
      const conEdad = f.filter((d) => d.edad !== "" && d.edad != null && +d.edad <= 32);
      const totAño = new Map();
      for (const d of conEdad) totAño.set(d.año, (totAño.get(d.año) ?? 0) + (+d.beneficiarios || 0));
      const m = new Map();
      for (const d of conEdad) {
        const k = d.año + "|" + d.edad;
        m.set(k, (m.get(k) ?? 0) + (+d.beneficiarios || 0));
      }
      return [...m].map(([k, v]) => { const [a, e] = k.split("|");
        return {clave: String(e), año: String(a), valor: totAño.get(+a) ? v / totAño.get(+a) * 100 : 0, crudo: v}; })
        .sort((x, y) => +x.clave - +y.clave);
    },
    agrupaGeo: () => [],
  };
  const ctx = {modo, estado: est, geoEnt: await geoEnt, nombrePorCve};
  display(render(cfg, filas, ctx));
}
```

## Beneficiarios unicos por año

```js
const uniV = view(controlPanel({catEnt, catMun, anios: aniosPad}));
```

```js
{
  const est = resolverEstado(uniV, {catEnt, catMun});
  const {filas, modo} = filtrar(unicos, est);
  const cfg = {
    unidad: "entero", mapeable: true, etiquetaValor: "unicos", tipo: "serie", facetaAño: "auto",
    titulo: "Beneficiarios unicos por año", subtitulo: "Personas distintas deduplicadas",
    fuente: "Fuente: STPS",
    metrica: (f) => {
      const m = new Map();
      for (const d of f) m.set(d.año, (m.get(d.año) ?? 0) + (+d.unicos || 0));
      return [...m].map(([año, v]) => ({clave: String(año), año: String(año), valor: v, crudo: v}))
        .sort((a, b) => +a.clave - +b.clave);
    },
    agrupaGeoAño: (f, e) => geoBloqueAño(f, e,
      {num: (d) => +d.unicos || 0, crudoDe: (d) => +d.unicos || 0, ratio: false}),
  };
  const ctx = {modo, estado: est, geoEnt: await geoEnt, geoMun: await geoMunDe(est), nombrePorCve, datosCompletos: padron};
  display(render(cfg, filas, ctx));
}
```

## Monto: pago mensual promedio por beneficiario

```js
const montoV = view(controlPanel({catEnt, catMun, anios: aniosPad}));
```

```js
{
  const est = resolverEstado(montoV, {catEnt, catMun});
  const {filas, modo} = filtrar(monto, est);
  const cfg = {
    unidad: "entero", mapeable: false, tipo: "serie", facetaAño: "auto",
    titulo: "Pago mensual promedio por beneficiario", subtitulo: "Pesos por mes (importe / beneficiarios)",
    fuente: "Fuente: STPS",
    metrica: (f) => {
      const m = new Map();
      for (const d of f) {
        if (!m.has(d.año)) m.set(d.año, {imp: 0, n: 0});
        const a = m.get(d.año); a.imp += +d.importe_total || 0; a.n += +d.n || 0;
      }
      return [...m].map(([año, a]) => ({clave: String(año), año: String(año),
        valor: a.n ? a.imp / a.n : 0, crudo: a.n})).sort((a, b) => +a.clave - +b.clave);
    },
    agrupaGeo: () => [],
  };
  const ctx = {modo, estado: est, geoEnt: await geoEnt, nombrePorCve};
  display(render(cfg, filas, ctx));
}
```

## Antiguedad: altas nuevas y continuaciones

```js
const antV = view(controlPanel({catEnt, catMun, anios: aniosPad}));
```

```js
{
  const est = resolverEstado(antV, {catEnt, catMun});
  const {filas, modo} = filtrar(antig, est);
  const cfg = {
    unidad: "pct", mapeable: false, tipo: "apilada", x: "año", serie: "tipo", facetaAño: false,
    titulo: "Altas nuevas y continuaciones", subtitulo: "% de beneficiarios por tipo y año",
    fuente: "Fuente: STPS",
    metrica: (f) => {
      // Agregar por año x tipo (las filas vienen por ent/mun/edad/sexo).
      const porAñoTipo = new Map();
      for (const d of f) {
        const k = d.año + "|" + d.tipo;
        porAñoTipo.set(k, (porAñoTipo.get(k) ?? 0) + (+d.n || 0));
      }
      const tot = new Map();
      for (const [k, v] of porAñoTipo) { const a = k.split("|")[0]; tot.set(a, (tot.get(a) ?? 0) + v); }
      return [...porAñoTipo].map(([k, v]) => { const [a, tipo] = k.split("|");
        return {año: String(a), tipo, valor: tot.get(a) ? v / tot.get(a) * 100 : 0, crudo: v}; });
    },
    agrupaGeo: () => [],
  };
  const ctx = {modo, estado: est, geoEnt: await geoEnt, nombrePorCve};
  display(render(cfg, filas, ctx));
}
```

## Cobertura vs pobreza (municipal o estatal, 2021-2025)

Cada punto es un municipio o entidad; el tamaño representa el universo de
candidatos. Un panel por año. Al elegir un estado/municipio se resalta su punto.

```js
const pobV = view(controlPanel({catEnt, catMun, niveles: ["Estatal", "Municipal"], desagrega: false, anios: aniosCob}));
```

```js
{
  const est = resolverEstado(pobV, {catEnt, catMun});
  const esMun = est.nivel === "municipal";
  // La dispersion mantiene TODOS los puntos; elegir un estado/municipio solo lo
  // resalta (no filtra). En municipal, elegir estado acota a sus municipios;
  // elegir municipio solo resalta.
  const base = esMun && est.cveEnt
    ? cruces.filter((d) => String(d.cve_ent).padStart(2, "0") === est.cveEnt)
    : cruces;
  const nombreSel = esMun ? (est.cveMun && nombreMunPorCve.get(est.cveMun))
    : (est.cveEnt && nombreEntPorCve.get(est.cveEnt));
  const g = new Map();
  for (const d of base.filter((x) => +x.candidatos > 0 && x.pct_pobreza !== "" && x.pct_pobreza != null)) {
    const cve = esMun ? String(d.cve_mun).padStart(5, "0") : String(d.cve_ent).padStart(2, "0");
    const k = d.año + "|" + cve;
    if (!g.has(k)) g.set(k, {año: String(d.año), ben: 0, can: 0, pob: d.pct_pobreza, nombre: esMun ? d.nombre_mun : d.nombre_ent});
    const a = g.get(k); a.ben += +d.beneficiarios || 0; a.can += +d.candidatos || 0;
  }
  const pts = [...g.values()].map((d) => ({año: d.año, x: d.pob, valor: d.ben / d.can * 100, universo: d.can, nombre: d.nombre}));
  display(dispersion(pts, {x: "x", y: "valor", faceta: "año", etiquetaKey: "nombre",
    rKey: "universo", resaltarNombre: nombreSel || null,
    titulo: "Cobertura vs pobreza (Candidatos)",
    subtitulo: (esMun ? "Cada punto es un municipio" : "Cada punto es una entidad") + " (tamaño = candidatos)",
    fuente: "Fuente: STPS / CONEVAL"}));
}
```

## Cobertura vs marginacion (municipal o estatal, 2021-2025)

```js
const margV = view(controlPanel({catEnt, catMun, niveles: ["Estatal", "Municipal"], desagrega: false, anios: aniosCob}));
```

```js
{
  const est = resolverEstado(margV, {catEnt, catMun});
  const esMun = est.nivel === "municipal";
  const base = esMun && est.cveEnt
    ? cruces.filter((d) => String(d.cve_ent).padStart(2, "0") === est.cveEnt)
    : cruces;
  const nombreSel = esMun ? (est.cveMun && nombreMunPorCve.get(est.cveMun))
    : (est.cveEnt && nombreEntPorCve.get(est.cveEnt));
  const g = new Map();
  for (const d of base.filter((x) => +x.candidatos > 0 && x.indice_marginacion !== "" && x.indice_marginacion != null)) {
    const cve = esMun ? String(d.cve_mun).padStart(5, "0") : String(d.cve_ent).padStart(2, "0");
    const k = d.año + "|" + cve;
    if (!g.has(k)) g.set(k, {año: String(d.año), ben: 0, can: 0, mar: d.indice_marginacion, nombre: esMun ? d.nombre_mun : d.nombre_ent});
    const a = g.get(k); a.ben += +d.beneficiarios || 0; a.can += +d.candidatos || 0;
  }
  const pts = [...g.values()].map((d) => ({año: d.año, x: d.mar, valor: d.ben / d.can * 100, universo: d.can, nombre: d.nombre}));
  display(dispersion(pts, {x: "x", y: "valor", faceta: "año", etiquetaKey: "nombre",
    rKey: "universo", resaltarNombre: nombreSel || null,
    titulo: "Cobertura vs marginacion (Candidatos)",
    subtitulo: (esMun ? "Cada punto es un municipio" : "Cada punto es una entidad") + " (tamaño = candidatos)",
    fuente: "Fuente: STPS / CONAPO"}));
}
```

## Cobertura por grado de marginacion (estatal, 2021-2025)

```js
{
  const orden = ["Muy bajo", "Bajo", "Medio", "Alto", "Muy alto"];
  // Por año x grado (todos los años con candidatos, un panel por año).
  const porAñoGrado = new Map();
  for (const d of cruces.filter((x) => +x.candidatos > 0)) {
    const gr = d.grado_marginacion;
    if (gr == null || gr === "") continue;
    const k = d.año + "|" + gr;
    if (!porAñoGrado.has(k)) porAñoGrado.set(k, {año: String(d.año), grado: gr, ben: 0, can: 0});
    const a = porAñoGrado.get(k); a.ben += +d.beneficiarios || 0; a.can += +d.candidatos || 0;
  }
  const filas = [...porAñoGrado.values()].filter((a) => a.can > 0)
    .map((a) => ({año: a.año, grado: a.grado, pct: a.ben / a.can * 100, crudo: a.ben}));
  display(barrasFacetadas(filas, {x: "grado", y: "pct", faceta: "año", dominioX: orden,
    crudoKey: "crudo", titulo: "Cobertura por grado de marginacion (Candidatos)",
    subtitulo: "% de candidatos con beca por grado, un panel por año", fuente: "Fuente: STPS / CONAPO"}));
}
```
