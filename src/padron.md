# Padron JCF

Cada grafica tiene su propio panel: nivel (Nacional/Estatal/Municipal), estado,
municipio, sexo y edad. Inicia en Nacional. En Estatal sin estado se comparan las
32 entidades (mapa + ranking); al elegir un estado se habilitan sexo y edad. En
Municipal sin estado se muestra el top 50 de municipios; con estado, sus
municipios; con municipio, ese municipio con sexo y edad.

```js
import {controlPanel, resolverEstado} from "./components/controlPanel.js";
import {filtrar} from "./components/filtro.js";
import {render} from "./components/render.js";
import {conTasa, agrupar} from "./components/agregar.js";
const padron = FileAttachment("./data/padron_agregado.csv").csv({typed: true});
const cruces = FileAttachment("./data/padron_cruces.csv").csv({typed: true});
const geoEnt = FileAttachment("./data/mx_entidades.json").json();
```

```js
// Catalogo estatico de geojson municipal por cve_ent (carga perezosa: Observable
// solo descarga el del estado que se lee).
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
// Carga el geojson municipal del estado (o null) para el modo municipios-estado.
async function geoMunDe(estado) {
  if (estado.nivel === "municipal" && estado.cveEnt && GEO_MUN[estado.cveEnt]) {
    return await GEO_MUN[estado.cveEnt].json();
  }
  return null;
}
```

```js
// Catalogos nombre->cve (unicos).
const catEnt = Array.from(new Map(cruces.map((d) =>
  [String(d.cve_ent).padStart(2, "0"), d.nombre_ent])).entries())
  .map(([cve, nombre]) => ({cve, nombre}));
const catMun = Array.from(new Map(cruces.map((d) =>
  [String(d.cve_mun).padStart(5, "0"), d.nombre_mun])).entries())
  .map(([cve, nombre]) => ({cve, nombre}));
const nombresEnt = catEnt.map((e) => e.nombre).sort((a, b) => a.localeCompare(b, "es"));
const nombresMun = catMun.map((m) => m.nombre).sort((a, b) => a.localeCompare(b, "es"));
const nombrePorCve = new Map(catEnt.map((e) => [e.cve, e.nombre]));
```

## Cobertura

```js
const cobV = view(controlPanel({catEnt, catMun}));
```

```js
const cobEstado = resolverEstado(cobV, {catEnt, catMun});
const cobRes = filtrar(padron, cobEstado);
const cobConfig = {
  unidad: "pct",
  etiquetaValor: "cobertura",
  mapeable: true,
  titulo: "Cobertura",
  subtitulo: "% de candidatos con beca",
  fuente: "Fuente: STPS",
  metrica: (filas) => conTasa(agrupar(filas, ["año"]))
    .filter((d) => d.tasa != null)
    .map((d) => ({clave: String(d.año), valor: d.tasa, crudo: d.beneficiarios})),
  agrupaGeo: (filas, estado) => {
    const añoRef = 2021;
    const llave = estado.nivel === "municipal" ? "cve_mun" : "cve_ent";
    const nombreKey = estado.nivel === "municipal" ? "nombre_mun" : "nombre_ent";
    const pad = estado.nivel === "municipal" ? 5 : 2;
    return conTasa(agrupar(filas.filter((d) => d.año === añoRef), [llave, nombreKey]))
      .filter((d) => d.tasa != null && d[nombreKey])
      .map((d) => ({cve: String(d[llave]).padStart(pad, "0"), nombre: d[nombreKey],
        valor: d.tasa, crudo: d.beneficiarios}));
  },
};
const cobCtx = {modo: cobRes.modo, estado: cobEstado, geoEnt: await geoEnt,
  geoMun: await geoMunDe(cobEstado), nombrePorCve};
display(render(cobConfig, cobRes.filas, cobCtx));
```

## Perfil por sexo

```js
const sexoV = view(controlPanel({catEnt, catMun}));
```

```js
const sexoEstado = resolverEstado(sexoV, {catEnt, catMun});
const sexoRes = filtrar(padron, sexoEstado);
const sexoConfig = {
  unidad: "pct",
  mapeable: false,
  titulo: "Perfil por sexo",
  subtitulo: "% de beneficiarios por sexo",
  fuente: "Fuente: STPS",
  metrica: (filas) => {
    const conSexo = filas.filter((d) => d.sexo === "FEMENINO" || d.sexo === "MASCULINO");
    const tot = conSexo.reduce((s, d) => s + (+d.beneficiarios || 0), 0);
    const m = new Map();
    for (const d of conSexo) m.set(d.sexo, (m.get(d.sexo) ?? 0) + (+d.beneficiarios || 0));
    return [...m].map(([sexo, v]) => ({clave: sexo, valor: tot ? v / tot * 100 : 0, crudo: v}));
  },
  agrupaGeo: (filas, estado) => {
    const llave = estado.nivel === "municipal" ? "cve_mun" : "cve_ent";
    const nombreKey = estado.nivel === "municipal" ? "nombre_mun" : "nombre_ent";
    const pad = estado.nivel === "municipal" ? 5 : 2;
    const porGeo = new Map();
    for (const d of filas.filter((x) => x.sexo === "FEMENINO" || x.sexo === "MASCULINO")) {
      const cve = String(d[llave]).padStart(pad, "0");
      if (!porGeo.has(cve)) porGeo.set(cve, {nombre: d[nombreKey], fem: 0, tot: 0});
      const a = porGeo.get(cve);
      a.tot += +d.beneficiarios || 0;
      if (d.sexo === "FEMENINO") a.fem += +d.beneficiarios || 0;
    }
    return [...porGeo].map(([cve, a]) => ({cve, nombre: a.nombre,
      valor: a.tot ? a.fem / a.tot * 100 : 0, crudo: a.fem}));
  },
};
const sexoCtx = {modo: sexoRes.modo, estado: sexoEstado, geoEnt, nombrePorCve};
display(render(sexoConfig, sexoRes.filas, sexoCtx));
```
