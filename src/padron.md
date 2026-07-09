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
import {dispersion} from "./components/graficas.js";
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
```

## Cobertura

```js
const cobV = view(controlPanel({catEnt, catMun}));
```

```js
{
  const est = resolverEstado(cobV, {catEnt, catMun});
  const {filas, modo} = filtrar(padron, est);
  const cfg = {
    unidad: "pct", etiquetaValor: "cobertura", mapeable: true, tipo: "serie",
    facetaAño: "auto", titulo: "Cobertura", subtitulo: "% de candidatos con beca",
    fuente: "Fuente: STPS",
    metrica: (f, e) => {
      // Si hay desglose por sexo/edad: serie por año con esa restriccion.
      const g = conTasa(agrupar(f, ["año"])).filter((d) => d.tasa != null);
      return g.map((d) => ({clave: String(d.año), año: String(d.año), valor: d.tasa, crudo: d.beneficiarios}));
    },
    agrupaGeo: (f, e) => geoBloque(f.filter((d) => d.año === 2021), e,
      {num: (d) => +d.beneficiarios || 0, den: (d) => +d.candidatos || 0, crudoDe: (d) => +d.beneficiarios || 0}),
  };
  const ctx = {modo, estado: est, geoEnt: await geoEnt, geoMun: await geoMunDe(est), nombrePorCve};
  display(render(cfg, filas, ctx));
}
```

## Perfil por sexo

```js
const sexoV = view(controlPanel({catEnt, catMun}));
```

```js
{
  const est = resolverEstado(sexoV, {catEnt, catMun});
  const {filas, modo} = filtrar(padron, est);
  const cfg = {
    unidad: "pct", mapeable: true, tipo: "serie", facetaAño: false, etiquetaValor: "% mujeres",
    titulo: "Perfil por sexo", subtitulo: "% de mujeres entre los beneficiarios",
    fuente: "Fuente: STPS",
    metrica: (f) => {
      const cs = f.filter((d) => d.sexo === "FEMENINO" || d.sexo === "MASCULINO");
      const tot = cs.reduce((s, d) => s + (+d.beneficiarios || 0), 0);
      const m = new Map();
      for (const d of cs) m.set(d.sexo, (m.get(d.sexo) ?? 0) + (+d.beneficiarios || 0));
      return [...m].map(([sexo, v]) => ({clave: sexo, valor: tot ? v / tot * 100 : 0, crudo: v}));
    },
    agrupaGeo: (f, e) => geoBloque(f.filter((d) => d.sexo === "FEMENINO" || d.sexo === "MASCULINO"), e,
      {num: (d) => d.sexo === "FEMENINO" ? (+d.beneficiarios || 0) : 0,
       den: (d) => +d.beneficiarios || 0, crudoDe: (d) => d.sexo === "FEMENINO" ? (+d.beneficiarios || 0) : 0}),
  };
  const ctx = {modo, estado: est, geoEnt: await geoEnt, geoMun: await geoMunDe(est), nombrePorCve};
  display(render(cfg, filas, ctx));
}
```

## Distribucion por edad

```js
const edadV = view(controlPanel({catEnt, catMun}));
```

```js
{
  const est = resolverEstado(edadV, {catEnt, catMun});
  const {filas, modo} = filtrar(padron, est);
  const cfg = {
    unidad: "pct", mapeable: false, tipo: "distribucion", facetaAño: false,
    titulo: "Distribucion por edad", subtitulo: "% de beneficiarios por edad (año reciente)",
    fuente: "Fuente: STPS",
    metrica: (f) => {
      const conEdad = f.filter((d) => d.edad !== "" && d.edad != null && +d.edad <= 32);
      const añoMax = Math.max(2021, ...conEdad.map((d) => d.año));
      const g = conEdad.filter((d) => d.año === añoMax);
      const tot = g.reduce((s, d) => s + (+d.beneficiarios || 0), 0);
      const m = new Map();
      for (const d of g) m.set(+d.edad, (m.get(+d.edad) ?? 0) + (+d.beneficiarios || 0));
      return [...m].map(([edad, v]) => ({clave: String(edad), valor: tot ? v / tot * 100 : 0, crudo: v}))
        .sort((a, b) => +a.clave - +b.clave);
    },
    agrupaGeo: () => [],
  };
  const ctx = {modo, estado: est, geoEnt: await geoEnt, nombrePorCve};
  display(render(cfg, filas, ctx));
}
```

## Beneficiarios unicos por año

```js
const uniV = view(controlPanel({catEnt, catMun}));
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
    agrupaGeo: (f, e) => geoBloque(f.filter((d) => d.año === Math.max(...f.map((x) => x.año))), e,
      {num: (d) => +d.unicos || 0, den: () => 1, crudoDe: (d) => +d.unicos || 0}),
  };
  const ctx = {modo, estado: est, geoEnt: await geoEnt, geoMun: await geoMunDe(est), nombrePorCve};
  display(render(cfg, filas, ctx));
}
```

## Monto: pago mensual promedio por beneficiario

```js
const montoV = view(controlPanel({catEnt, catMun}));
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
const antV = view(controlPanel({catEnt, catMun}));
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
      const tot = new Map();
      for (const d of f) tot.set(d.año, (tot.get(d.año) ?? 0) + (+d.n || 0));
      return f.map((d) => ({año: String(d.año), tipo: d.tipo, valor: tot.get(d.año) ? (+d.n || 0) / tot.get(d.año) * 100 : 0, crudo: +d.n || 0}));
    },
    agrupaGeo: () => [],
  };
  const ctx = {modo, estado: est, geoEnt: await geoEnt, nombrePorCve};
  display(render(cfg, filas, ctx));
}
```

## Cobertura vs pobreza (municipal o estatal, 2021)

Cada punto es un municipio o entidad. No se desagrega por edad/sexo (indice del
territorio). Al elegir un nivel se muestran sus puntos.

```js
const pobV = view(controlPanel({catEnt, catMun, niveles: ["Estatal", "Municipal"], desagrega: false}));
```

```js
{
  const est = resolverEstado(pobV, {catEnt, catMun});
  const {filas} = filtrar(cruces, est);
  const esMun = est.nivel === "municipal";
  const g = new Map();
  for (const d of filas.filter((x) => x.año === 2021)) {
    const cve = esMun ? String(d.cve_mun).padStart(5, "0") : String(d.cve_ent).padStart(2, "0");
    if (!g.has(cve)) g.set(cve, {ben: 0, can: 0, pob: d.pct_pobreza, nombre: esMun ? d.nombre_mun : d.nombre_ent});
    const a = g.get(cve); a.ben += +d.beneficiarios || 0; a.can += +d.candidatos || 0;
  }
  const pts = [...g.values()].filter((d) => d.can > 0 && d.pob !== "" && d.pob != null)
    .map((d) => ({x: d.pob, valor: d.ben / d.can * 100, nombre: d.nombre}));
  display(dispersion(pts, {x: "x", y: "valor", etiquetaKey: "nombre",
    titulo: "Cobertura vs pobreza (Candidatos, 2021)",
    subtitulo: esMun ? "Cada punto es un municipio" : "Cada punto es una entidad",
    fuente: "Fuente: STPS / CONEVAL"}));
}
```

## Cobertura vs marginacion (municipal o estatal, 2021)

```js
const margV = view(controlPanel({catEnt, catMun, niveles: ["Estatal", "Municipal"], desagrega: false}));
```

```js
{
  const est = resolverEstado(margV, {catEnt, catMun});
  const {filas} = filtrar(cruces, est);
  const esMun = est.nivel === "municipal";
  const g = new Map();
  for (const d of filas.filter((x) => x.año === 2021)) {
    const cve = esMun ? String(d.cve_mun).padStart(5, "0") : String(d.cve_ent).padStart(2, "0");
    if (!g.has(cve)) g.set(cve, {ben: 0, can: 0, mar: d.indice_marginacion, nombre: esMun ? d.nombre_mun : d.nombre_ent});
    const a = g.get(cve); a.ben += +d.beneficiarios || 0; a.can += +d.candidatos || 0;
  }
  const pts = [...g.values()].filter((d) => d.can > 0 && d.mar !== "" && d.mar != null)
    .map((d) => ({x: d.mar, valor: d.ben / d.can * 100, nombre: d.nombre}));
  display(dispersion(pts, {x: "x", y: "valor", etiquetaKey: "nombre",
    titulo: "Cobertura vs marginacion (Candidatos, 2021)",
    subtitulo: esMun ? "Cada punto es un municipio" : "Cada punto es una entidad",
    fuente: "Fuente: STPS / CONAPO"}));
}
```

## Cobertura por grado de marginacion (estatal, 2021)

```js
{
  const orden = ["Muy bajo", "Bajo", "Medio", "Alto", "Muy alto"];
  const porGrado = new Map();
  for (const d of cruces.filter((x) => x.año === 2021)) {
    const gr = d.grado_marginacion;
    if (gr == null || gr === "") continue;
    if (!porGrado.has(gr)) porGrado.set(gr, {ben: 0, can: 0});
    const a = porGrado.get(gr); a.ben += +d.beneficiarios || 0; a.can += +d.candidatos || 0;
  }
  const filas = orden.filter((g) => porGrado.has(g)).map((g) => ({clave: g,
    valor: porGrado.get(g).can ? porGrado.get(g).ben / porGrado.get(g).can * 100 : 0,
    crudo: porGrado.get(g).ben}));
  display(Plot.plot({
    title: "Cobertura por grado de marginacion (Candidatos, 2021)",
    subtitle: "% de candidatos con beca por grado", caption: "Fuente: STPS / CONAPO",
    marginBottom: 40, x: {label: "grado"}, y: {label: "%", grid: true, tickFormat: (d) => `${d}%`},
    marks: [Plot.ruleY([0], {stroke: "#e2e8f0"}),
      Plot.barY(filas, {x: "clave", y: "valor", fill: "#60a5fa", fillOpacity: 0.85}),
      Plot.text(filas, {x: "clave", y: "valor", text: (d) => `${d.valor.toFixed(1)}%`, dy: -6, fontSize: 9})]}));
}
```
