# Padron JCF: tasa por cada 1,000 jovenes

Mismos analisis del padron, pero con un denominador distinto: la poblacion joven
(18-29) del **censo 2020**, no la proyeccion de candidatos. Esto evita las tasas
mayores a 100% que aparecen en algunos municipios (cuando la proyeccion de
candidatos queda por debajo de los beneficiarios reales). La cobertura se expresa
como **beneficiarios por cada 1,000 jovenes**: un valor de 42 se lee "42 de cada
1,000 jovenes del municipio reciben la beca".

```js
import {controlPanel, resolverEstado} from "./components/controlPanel.js";
import {filtrar} from "./components/filtro.js";
import {render} from "./components/render.js";
const padron = FileAttachment("./data/padron_agregado.csv").csv({typed: true});
const cruces = FileAttachment("./data/padron_cruces.csv").csv({typed: true});
const censo = FileAttachment("./data/padron_poblacion_censo.csv").csv({typed: true});
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
const aniosPad = [...new Set(padron.map((d) => String(d.año)))].sort((a, b) => +a - +b);

// Poblacion joven del censo por municipio (fija, no depende del año). Se indexa
// por cve_mun (5) y por cve_ent (2) para el denominador estatal/municipal.
const popMun = new Map();
const popEnt = new Map();
for (const d of censo) {
  const cm = String(d.cve_mun).padStart(5, "0");
  const ce = cm.slice(0, 2);
  popMun.set(cm, (popMun.get(cm) ?? 0) + (+d.poblacion || 0));
  popEnt.set(ce, (popEnt.get(ce) ?? 0) + (+d.poblacion || 0));
}

// Igual que geoBloqueAño del padron, pero el denominador es la poblacion del
// censo (no la proyeccion). valor = beneficiarios / poblacion * 1000.
function geoTasaAño(filas, estado, {num, crudoDe}) {
  const esMun = estado.nivel === "municipal";
  const llave = esMun ? "cve_mun" : "cve_ent";
  const pad = esMun ? 5 : 2;
  const pop = esMun ? popMun : popEnt;
  const nombreDe = esMun ? nombreMunPorCve : nombreEntPorCve;
  const m = new Map();
  for (const d of filas) {
    const cve = String(d[llave]).padStart(pad, "0");
    const k = d.año + "|" + cve;
    if (!m.has(k)) m.set(k, {año: String(d.año), cve, n: 0, c: 0});
    const a = m.get(k);
    a.n += num(d); a.c += crudoDe(d);
  }
  return [...m.values()].map((a) => {
    const p = pop.get(a.cve) ?? 0;
    return {año: a.año, cve: a.cve, nombre: nombreDe.get(a.cve) ?? a.cve,
      valor: p ? a.n / p * 1000 : 0, crudo: a.c};
  });
}
```

## Cobertura (por cada 1,000 jovenes)

```js
const cobV = view(controlPanel({catEnt, catMun, anios: aniosPad}));
```

```js
{
  const est = resolverEstado(cobV, {catEnt, catMun});
  const {filas, modo} = filtrar(padron, est);
  const cfg = {
    unidad: "entero", etiquetaValor: "por cada 1,000", mapeable: true, tipo: "serie",
    facetaAño: false, titulo: "Cobertura (por cada 1,000 jovenes)",
    subtitulo: "beneficiarios por cada 1,000 jovenes del censo 2020",
    fuente: "Fuente: STPS / INEGI (Censo 2020)",
    metrica: (f, e) => {
      // Serie por año: tasa por cada 1,000 usando la poblacion del censo del
      // ambito elegido (nacional = suma nacional; estatal/municipal = su pop).
      const esMun = e.nivel === "municipal";
      let pobAmbito;
      if (esMun && e.cveMun) pobAmbito = popMun.get(e.cveMun) ?? 0;
      else if (e.nivel === "estatal" && e.cveEnt) pobAmbito = popEnt.get(e.cveEnt) ?? 0;
      else pobAmbito = [...popEnt.values()].reduce((s, v) => s + v, 0);
      const porAño = new Map();
      for (const d of f) porAño.set(d.año, (porAño.get(d.año) ?? 0) + (+d.beneficiarios || 0));
      return [...porAño].map(([año, ben]) => ({clave: String(año), año: String(año),
        valor: pobAmbito ? ben / pobAmbito * 1000 : 0, crudo: ben}))
        .sort((x, y) => +x.clave - +y.clave);
    },
    agrupaGeoAño: (f, e) => geoTasaAño(f, e,
      {num: (d) => +d.beneficiarios || 0, crudoDe: (d) => +d.beneficiarios || 0}),
  };
  const ctx = {modo, estado: est, geoEnt: await geoEnt, geoMun: await geoMunDe(est), nombrePorCve, datosCompletos: padron};
  display(render(cfg, filas, ctx));
}
```

## Cobertura por sexo (por cada 1,000 jovenes)

```js
const sexoV = view(controlPanel({catEnt, catMun, anios: aniosPad}));
```

```js
{
  const est = resolverEstado(sexoV, {catEnt, catMun});
  const {filas, modo} = filtrar(padron, {...est, sexo: "Todos"});
  // Poblacion del censo por sexo (para el denominador de cada sexo).
  const popSexo = new Map();
  for (const d of censo) {
    const cm = String(d.cve_mun).padStart(5, "0");
    const ce = cm.slice(0, 2);
    for (const [k, v] of [[cm, d.sexo], [ce, d.sexo]]) {
      const kk = k + "|" + v;
      popSexo.set(kk, (popSexo.get(kk) ?? 0) + (+d.poblacion || 0));
    }
  }
  const esMun = est.nivel === "municipal";
  const cveAmbito = esMun ? est.cveMun : est.cveEnt;
  const cfg = {
    unidad: "entero", mapeable: false, tipo: "distribucion", facetaAño: true,
    etiquetaValor: "por cada 1,000",
    titulo: "Cobertura por sexo (por cada 1,000 jovenes)",
    subtitulo: "beneficiarios por cada 1,000 jovenes de ese sexo, un panel por año",
    fuente: "Fuente: STPS / INEGI (Censo 2020)",
    metrica: (f) => {
      const cs = f.filter((d) => d.sexo === "FEMENINO" || d.sexo === "MASCULINO");
      const m = new Map();
      for (const d of cs) {
        const k = d.año + "|" + d.sexo;
        m.set(k, (m.get(k) ?? 0) + (+d.beneficiarios || 0));
      }
      const denSexo = (sexo) => {
        if (cveAmbito) return popSexo.get(cveAmbito + "|" + sexo) ?? 0;
        // Nacional: suma sobre entidades.
        let s = 0;
        for (const [kk, v] of popSexo) if (kk.length === 2 + 1 + sexo.length && kk.endsWith("|" + sexo)) s += v;
        return s;
      };
      const denNacF = denSexo("FEMENINO"), denNacM = denSexo("MASCULINO");
      return [...m].map(([k, v]) => { const [a, s] = k.split("|");
        const den = s === "FEMENINO" ? denNacF : denNacM;
        return {clave: s === "FEMENINO" ? "Mujeres" : "Hombres", año: String(a),
          valor: den ? v / den * 1000 : 0, crudo: v}; })
        .sort((x, y) => x.clave.localeCompare(y.clave));
    },
    agrupaGeo: () => [],
  };
  const ctx = {modo, estado: est, geoEnt: await geoEnt, nombrePorCve};
  display(render(cfg, filas, ctx));
}
```

## Distribucion por edad (por cada 1,000 jovenes)

```js
const edadV = view(controlPanel({catEnt, catMun, anios: aniosPad}));
```

```js
{
  const est = resolverEstado(edadV, {catEnt, catMun});
  const {filas, modo} = filtrar(padron, {...est, edadMin: null, edadMax: null});
  // Poblacion del censo por edad (denominador por edad del ambito elegido).
  const popEdad = new Map();
  for (const d of censo) {
    const cm = String(d.cve_mun).padStart(5, "0");
    const ce = cm.slice(0, 2);
    for (const k of [cm, ce]) {
      const kk = k + "|" + d.edad;
      popEdad.set(kk, (popEdad.get(kk) ?? 0) + (+d.poblacion || 0));
    }
  }
  const esMun = est.nivel === "municipal";
  const cveAmbito = esMun ? est.cveMun : est.cveEnt;
  const cfg = {
    unidad: "entero", mapeable: false, tipo: "distribucion", facetaAño: true,
    etiquetaValor: "por cada 1,000",
    titulo: "Cobertura por edad (por cada 1,000 jovenes)",
    subtitulo: "beneficiarios por cada 1,000 jovenes de esa edad, un panel por año",
    fuente: "Fuente: STPS / INEGI (Censo 2020)",
    metrica: (f) => {
      const conEdad = f.filter((d) => d.edad !== "" && d.edad != null && +d.edad >= 18 && +d.edad <= 29);
      const m = new Map();
      for (const d of conEdad) {
        const k = d.año + "|" + d.edad;
        m.set(k, (m.get(k) ?? 0) + (+d.beneficiarios || 0));
      }
      const denEdad = (edad) => {
        if (cveAmbito) return popEdad.get(cveAmbito + "|" + edad) ?? 0;
        let s = 0;
        for (const [kk, v] of popEdad) if (kk.length === 2 + 1 + String(edad).length && kk.endsWith("|" + edad)) s += v;
        return s;
      };
      return [...m].map(([k, v]) => { const [a, e] = k.split("|");
        const den = denEdad(e);
        return {clave: String(e), año: String(a), valor: den ? v / den * 1000 : 0, crudo: v}; })
        .sort((x, y) => +x.clave - +y.clave);
    },
    agrupaGeo: () => [],
  };
  const ctx = {modo, estado: est, geoEnt: await geoEnt, nombrePorCve};
  display(render(cfg, filas, ctx));
}
```
