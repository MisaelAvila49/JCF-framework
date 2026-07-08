# Padron JCF — Municipal

```js
import {agrupar, conTasa} from "../components/agregar.js";
import {filtrarDatos} from "../components/filtros.js";
import {barrasH, dispersion, maxProp} from "../components/graficas.js";
import {mapaMunicipios} from "../components/mapa.js";
import {modoDesde, sufijoFiltro, nombresUnicos} from "../components/panel.js";
const padron = FileAttachment("../data/padron_agregado.csv").csv({typed: true});
const cruces = FileAttachment("../data/padron_cruces.csv").csv({typed: true});
```

```js
// Catalogo estatico de geojson municipal por cve_ent (carga perezosa: Observable
// solo descarga el que se lee). Los archivos vienen de descargar-municipios.mjs.
const GEO_MUN = {
  "01": FileAttachment("../data/municipios/01.json"), "02": FileAttachment("../data/municipios/02.json"),
  "03": FileAttachment("../data/municipios/03.json"), "04": FileAttachment("../data/municipios/04.json"),
  "05": FileAttachment("../data/municipios/05.json"), "06": FileAttachment("../data/municipios/06.json"),
  "07": FileAttachment("../data/municipios/07.json"), "08": FileAttachment("../data/municipios/08.json"),
  "09": FileAttachment("../data/municipios/09.json"), "10": FileAttachment("../data/municipios/10.json"),
  "11": FileAttachment("../data/municipios/11.json"), "12": FileAttachment("../data/municipios/12.json"),
  "13": FileAttachment("../data/municipios/13.json"), "14": FileAttachment("../data/municipios/14.json"),
  "15": FileAttachment("../data/municipios/15.json"), "16": FileAttachment("../data/municipios/16.json"),
  "17": FileAttachment("../data/municipios/17.json"), "18": FileAttachment("../data/municipios/18.json"),
  "19": FileAttachment("../data/municipios/19.json"), "20": FileAttachment("../data/municipios/20.json"),
  "21": FileAttachment("../data/municipios/21.json"), "22": FileAttachment("../data/municipios/22.json"),
  "23": FileAttachment("../data/municipios/23.json"), "24": FileAttachment("../data/municipios/24.json"),
  "25": FileAttachment("../data/municipios/25.json"), "26": FileAttachment("../data/municipios/26.json"),
  "27": FileAttachment("../data/municipios/27.json"), "28": FileAttachment("../data/municipios/28.json"),
  "29": FileAttachment("../data/municipios/29.json"), "30": FileAttachment("../data/municipios/30.json"),
  "31": FileAttachment("../data/municipios/31.json"), "32": FileAttachment("../data/municipios/32.json"),
};
```

```js
const nombresEnt = nombresUnicos(padron, "nombre_ent");
```

## Filtros

El desglose por edad/sexo aplica a cobertura por municipio y perfil por sexo. Las
dispersiones y el mapa no dependen del desglose.

```js
const nombreEnt = view(Inputs.text({label: "Estado contiene", value: "",
  placeholder: "escribe un estado (vacio = todos)", datalist: nombresEnt}));
```
```js
// Municipios del estado elegido, para autocompletar el segundo campo.
const nombresMun = nombresUnicos(filtrarDatos(padron, {nombreEnt}), "nombre_mun");
```
```js
const nombreMun = view(Inputs.text({label: "Municipio contiene", placeholder: "todos",
  datalist: nombresMun}));
```
```js
const modoTxt = view(Inputs.select(["Sin desglose", "Por sexo", "Por edad"], {label: "Desglose", value: "Sin desglose"}));
```
```js
const modo = modoDesde(modoTxt);
```
```js
const edadMin = modo === "edad" ? view(Inputs.range([18, 29], {step: 1, value: 18, label: "Edad minima"})) : 18;
```
```js
const edadMax = modo === "edad" ? view(Inputs.range([18, 29], {step: 1, value: 29, label: "Edad maxima"})) : 29;
```
```js
// Padron filtrado por estado/municipio y (si el desglose lo pide) por edad/sexo.
const padronF = (() => {
  let f = filtrarDatos(padron, {nombreEnt, nombreMun});
  if (modo === "sexo") f = f.filter((d) => d.sexo === "FEMENINO" || d.sexo === "MASCULINO");
  if (modo === "edad") f = f.filter((d) => d.edad !== "" && d.edad != null
    && +d.edad >= edadMin && +d.edad <= edadMax);
  return f;
})();
```

## Mapa de cobertura por municipio (Candidatos, municipal, 2021)

Requiere escribir un estado. Muestra los municipios de ese estado; colormap 0-100%.

```js
// cve_ent del estado escrito (para elegir el geojson municipal).
const cveEntSel = (() => {
  const q = (nombreEnt ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  if (!q) return null;
  const hit = padron.find((d) => (d.nombre_ent ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().includes(q));
  return hit ? String(hit.cve_ent).padStart(2, "0") : null;
})();
```
```js
if (!cveEntSel) {
  display(html`<p>Escribe un estado para ver el mapa municipal.</p>`);
} else {
  const geo = await GEO_MUN[cveEntSel].json();
  const cob = conTasa(agrupar(padron.filter((d) => d.año === 2021
    && String(d.cve_ent).padStart(2, "0") === cveEntSel), ["cve_mun"]));
  const valores = new Map(cob.filter((d) => d.tasa != null)
    .map((d) => [String(d.cve_mun).padStart(5, "0"), d.tasa]));
  display(mapaMunicipios(geo, valores, {
    subtitulo: "% de candidatos con beca por municipio (2021)", fuente: "Fuente: STPS",
    formato: "pct", etiquetaValor: "cobertura"}));
}
```

## Cobertura por municipio (Candidatos, municipal, 2021)

Primer año con candidatos por municipio. Top 25 del filtro por tasa.

Nota: la tasa puede superar el 100%. El numerador (beneficiarios) viene del
padron administrativo y el denominador (candidatos) del censo 2020; en algunos
municipios el padron registra mas beneficiarios que los candidatos que el censo
conto (por movilidad, altas de fuera del municipio o desfase entre fuentes). No
es un error: son dos fuentes distintas.

```js
const porMun = conTasa(agrupar(padronF.filter((d) => d.año === 2021), ["cve_mun", "nombre_mun"]))
  .filter((d) => d.nombre_mun != null && d.nombre_mun !== "" && d.tasa != null)
  .sort((a, b) => b.tasa - a.tasa)
  .slice(0, 25)
  .map((d) => ({nombre_mun: d.nombre_mun, tasa: d.tasa, benef: d.beneficiarios}));
display(barrasH(porMun, {x: "tasa", y: "nombre_mun", crudoKey: "benef",
  titulo: "Cobertura por municipio (Candidatos, municipal, 2021)",
  subtitulo: "% de candidatos con beca (top 25 del filtro)" + sufijoFiltro(modo), fuente: "Fuente: STPS"}));
```

## Perfil por sexo del municipio (Beneficiarios, municipal, año reciente)

```js
const añoS = maxProp(padronF, "año");
const sxm = padronF.filter((d) => d.año === añoS
  && (d.sexo === "FEMENINO" || d.sexo === "MASCULINO")
  && d.nombre_mun != null && d.nombre_mun !== "");
const porMunSexo = new Map();
for (const d of sxm) {
  const k = d.nombre_mun + "||" + d.sexo;
  porMunSexo.set(k, (porMunSexo.get(k) ?? 0) + (+d.beneficiarios || 0));
}
const totMun = new Map();
for (const [k, v] of porMunSexo) {
  const mun = k.split("||")[0];
  totMun.set(mun, (totMun.get(mun) ?? 0) + v);
}
// Solo municipios con al menos 100 beneficiarios: con pocos casos el % de
// mujeres se va a 0 o 100 y no es informativo. Se ordena por total (los mas
// grandes primero).
const MIN_BENEF = 100;
const pctMuj = [...totMun.keys()].map((mun) => {
  const fem = porMunSexo.get(mun + "||FEMENINO") ?? 0;
  const tot = totMun.get(mun);
  return {nombre_mun: mun, fem, total: tot, pct: tot ? fem / tot * 100 : 0};
}).filter((d) => d.total >= MIN_BENEF)
  .sort((a, b) => b.total - a.total).slice(0, 25);
display(barrasH(pctMuj, {x: "pct", y: "nombre_mun", crudoKey: "fem",
  titulo: `Porcentaje de mujeres por municipio (Beneficiarios, municipal, ${añoS})`,
  subtitulo: `% de mujeres entre los beneficiarios (municipios con >=${MIN_BENEF}, top 25 por tamaño)` + sufijoFiltro(modo),
  fuente: "Fuente: STPS"}));
```

## Cobertura vs pobreza (Candidatos, municipal, 2021)

Cada punto es un municipio. El filtro de estado/municipio acota los puntos.

```js
const crucesF = filtrarDatos(cruces, {nombreEnt, nombreMun});
const delAño = conTasa(crucesF.filter((d) => d.año === 2021))
  .filter((d) => d.tasa != null && d.pct_pobreza !== "" && d.pct_pobreza != null);
display(dispersion(delAño, {x: "pct_pobreza", y: "tasa", etiquetaKey: "nombre_mun",
  titulo: "Cobertura vs pobreza (Candidatos, municipal, 2021)",
  subtitulo: "Cada punto es un municipio", fuente: "Fuente: STPS / CONEVAL"}));
```

## Cobertura vs marginacion (Candidatos, municipal, 2021)

```js
const conMarg = delAño.filter((d) => d.indice_marginacion !== "" && d.indice_marginacion != null);
display(dispersion(conMarg, {x: "indice_marginacion", y: "tasa", etiquetaKey: "nombre_mun",
  titulo: "Cobertura vs marginacion (Candidatos, municipal, 2021)",
  subtitulo: "Cada punto es un municipio", fuente: "Fuente: STPS / CONAPO"}));
```
