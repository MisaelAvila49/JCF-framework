# Padron JCF — Estatal

```js
import {agrupar, conTasa} from "../components/agregar.js";
import {desglosar} from "../components/desglose.js";
import {filtrarDatos} from "../components/filtros.js";
import {barras, barrasAgrupadas, barrasH, dispersion, maxProp, COLOR_SEXO} from "../components/graficas.js";
import {mapaEntidades} from "../components/mapa.js";
const padron = FileAttachment("../data/padron_agregado.csv").csv({typed: true});
const proyeccion = FileAttachment("../data/padron_proyeccion.csv").csv({typed: true});
const cruces = FileAttachment("../data/padron_cruces.csv").csv({typed: true});
const geoEnt = FileAttachment("../data/mx_entidades.json").json();
```

```js
// Nombre por cve_ent (2 digitos) para los tooltips del mapa.
const nombrePorCve = new Map(cruces.map((d) => [String(d.cve_ent).padStart(2, "0"), d.nombre_ent]));
```

```js
// Lista de nombres de entidad para autocompletar el campo de texto.
const nombresEnt = Array.from(new Set(padron.map((d) => d.nombre_ent)
  .filter((n) => n != null && n !== ""))).sort((a, b) => a.localeCompare(b, "es"));
```

## Filtro

```js
const nombreEnt = view(Inputs.text({label: "Estado contiene", value: "",
  placeholder: "escribe un estado (vacio = todos)", datalist: nombresEnt}));
```
```js
const padronF = filtrarDatos(padron, {nombreEnt});
const crucesF = filtrarDatos(cruces, {nombreEnt});
```

## Mapa de cobertura por entidad (Candidatos, estatal, 2021)

Tasa de cobertura por entidad (todos los estados, no depende del filtro).

```js
const cobMapa = conTasa(agrupar(padron.filter((d) => d.año === 2021), ["cve_ent"]));
const valCob = new Map(cobMapa.filter((d) => d.tasa != null)
  .map((d) => [String(d.cve_ent).padStart(2, "0"), d.tasa]));
display(mapaEntidades(await geoEnt, valCob, {
  subtitulo: "% de candidatos con beca (2021)", fuente: "Fuente: STPS",
  nombrePorCve, formato: "pct", etiquetaValor: "cobertura"}));
```

## Cobertura por entidad (Candidatos, estatal, 2021)

Primer año con candidatos por entidad en el padron.

```js
const porEnt = conTasa(agrupar(padronF.filter((d) => d.año === 2021), ["cve_ent", "nombre_ent"]))
  .filter((d) => d.nombre_ent != null && d.nombre_ent !== "" && d.tasa != null)
  .map((d) => ({nombre_ent: d.nombre_ent, tasa: d.tasa, benef: d.beneficiarios}));
display(barrasH(porEnt, {x: "tasa", y: "nombre_ent", crudoKey: "benef",
  titulo: "Cobertura por entidad (Candidatos, estatal, 2021)",
  subtitulo: "% de candidatos con beca", fuente: "Fuente: STPS"}));
```

## Evolucion de la cobertura estatal (Candidatos, estatal, 2019-2025)

Proyeccion con factor por entidad. Muestra la serie del estado escrito (o el
promedio nacional si el campo esta vacio).

```js
const evoEst = (() => {
  if (!nombreEnt) return proyeccion.filter((d) => d.cve_ent === 0 || d.cve_ent === "00");
  const claves = new Set(crucesF.map((d) => String(d.cve_ent).padStart(2, "0")));
  return proyeccion.filter((d) => claves.has(String(d.cve_ent).padStart(2, "0")));
})();
const evoAgg = (() => {
  const m = new Map();
  for (const d of evoEst) {
    if (!m.has(d.año)) m.set(d.año, {año: d.año, beneficiarios: 0, candidatos: 0});
    const a = m.get(d.año);
    a.beneficiarios += d.beneficiarios;
    a.candidatos += d.candidatos_estimados;
  }
  return [...m.values()].map((d) => ({año: String(d.año), benef: d.beneficiarios,
    tasa: d.candidatos ? d.beneficiarios / d.candidatos * 100 : 0}));
})();
display(barras(evoAgg, {x: "año", y: "tasa", crudoKey: "benef",
  titulo: "Evolucion de la cobertura (Candidatos, estatal, 2019-2025)",
  subtitulo: "% de candidatos estimados con beca", fuente: "Fuente: STPS / CONAPO"}));
```

## Perfil por sexo y entidad (Beneficiarios, estatal, año reciente)

```js
const añoS = maxProp(padronF, "año");
const sxe = padronF.filter((d) => d.año === añoS
  && (d.sexo === "FEMENINO" || d.sexo === "MASCULINO")
  && d.nombre_ent != null && d.nombre_ent !== "");
const porEntSexo = new Map();
for (const d of sxe) {
  const k = d.nombre_ent + "||" + d.sexo;
  porEntSexo.set(k, (porEntSexo.get(k) ?? 0) + (+d.beneficiarios || 0));
}
const totEnt = new Map();
for (const [k, v] of porEntSexo) {
  const ent = k.split("||")[0];
  totEnt.set(ent, (totEnt.get(ent) ?? 0) + v);
}
const pctMuj = [...totEnt.keys()].map((ent) => {
  const fem = porEntSexo.get(ent + "||FEMENINO") ?? 0;
  return {nombre_ent: ent, fem, pct: totEnt.get(ent) ? fem / totEnt.get(ent) * 100 : 0};
});
display(barrasH(pctMuj, {x: "pct", y: "nombre_ent", crudoKey: "fem",
  titulo: `Porcentaje de mujeres por entidad (Beneficiarios, estatal, ${añoS})`,
  subtitulo: "% de mujeres entre los beneficiarios", fuente: "Fuente: STPS"}));
```

## Mapa de porcentaje de mujeres por entidad (Beneficiarios, estatal, año reciente)

```js
const añoM = maxProp(padron, "año");
const sxAll = padron.filter((d) => d.año === añoM
  && (d.sexo === "FEMENINO" || d.sexo === "MASCULINO"));
const femPorCve = new Map(), totPorCve = new Map();
for (const d of sxAll) {
  const cve = String(d.cve_ent).padStart(2, "0");
  totPorCve.set(cve, (totPorCve.get(cve) ?? 0) + (+d.beneficiarios || 0));
  if (d.sexo === "FEMENINO") femPorCve.set(cve, (femPorCve.get(cve) ?? 0) + (+d.beneficiarios || 0));
}
const valMuj = new Map([...totPorCve].map(([cve, tot]) =>
  [cve, tot ? (femPorCve.get(cve) ?? 0) / tot * 100 : 0]));
display(mapaEntidades(await geoEnt, valMuj, {
  subtitulo: `% de mujeres entre los beneficiarios (${añoM})`, fuente: "Fuente: STPS",
  nombrePorCve, formato: "pct", etiquetaValor: "% mujeres"}));
```

## Concentracion geografica por entidad (Beneficiarios, estatal)

```js
const modoTxt = view(Inputs.select(["Sin desglose", "Por sexo", "Por edad"], {label: "Desglose", value: "Sin desglose"}));
```
```js
const modo = modoTxt === "Por sexo" ? "sexo" : modoTxt === "Por edad" ? "edad" : "ninguno";
```
```js
const edadMin = modo === "edad" ? view(Inputs.range([18, 29], {step: 1, value: 18, label: "Edad minima"})) : 18;
```
```js
const edadMax = modo === "edad" ? view(Inputs.range([18, 29], {step: 1, value: 29, label: "Edad maxima"})) : 29;
```
```js
const añoC = maxProp(padronF, "año");
const delAñoC = padronF.filter((d) => d.año === añoC && d.nombre_ent != null && d.nombre_ent !== "");
if (modo === "ninguno") {
  const porE = agrupar(delAñoC, ["nombre_ent"]);
  const tot = porE.reduce((s, d) => s + d.beneficiarios, 0);
  const filas = porE.map((d) => ({nombre_ent: d.nombre_ent, benef: d.beneficiarios,
    pct: tot ? d.beneficiarios / tot * 100 : 0}));
  display(barrasH(filas, {x: "pct", y: "nombre_ent", crudoKey: "benef",
    titulo: `Concentracion por entidad (Beneficiarios, estatal, ${añoC})`,
    subtitulo: "% del total del filtro", fuente: "Fuente: STPS"}));
} else {
  const des = desglosar(delAñoC, {modo, edadMin, edadMax});
  const tot = des.reduce((s, d) => s + d.beneficiarios, 0);
  const filas = des.map((d) => ({serie: d.serie, benef: d.beneficiarios,
    pct: tot ? d.beneficiarios / tot * 100 : 0, x: "total"}));
  display(barrasAgrupadas(filas, {x: "x", serie: "serie", y: "pct", crudoKey: "benef",
    colorSerie: modo === "sexo" ? COLOR_SEXO : null,
    serieLabel: modo === "sexo" ? "Sexo" : "Edad", xLabel: "",
    titulo: `Concentracion por ${modoTxt.replace("Por ", "")} (Beneficiarios, estatal, ${añoC})`,
    subtitulo: "% del total del filtro", fuente: "Fuente: STPS"}));
}
```

## Cobertura vs pobreza (Candidatos, estatal, 2021)

```js
// Cruce por entidad en 2021 (primer año con candidatos): tasa estatal vs pobreza.
const cr2021 = crucesF.filter((d) => d.año === 2021);
const porEntP = new Map();
for (const d of cr2021) {
  const k = String(d.cve_ent);
  if (!porEntP.has(k)) porEntP.set(k, {nombre_ent: d.nombre_ent, ben: 0, can: 0, pob: d.pct_pobreza});
  const a = porEntP.get(k);
  a.ben += +d.beneficiarios || 0;
  a.can += +d.candidatos || 0;
}
const dispPob = [...porEntP.values()].filter((d) => d.can > 0 && d.pob !== "" && d.pob != null)
  .map((d) => ({nombre_ent: d.nombre_ent, tasa: d.ben / d.can * 100, pct_pobreza: d.pob}));
display(dispersion(dispPob, {x: "pct_pobreza", y: "tasa", etiquetaKey: "nombre_ent",
  titulo: "Cobertura vs pobreza (Candidatos, estatal, 2021)",
  subtitulo: "Cada punto es una entidad", fuente: "Fuente: STPS / CONEVAL"}));
```

## Cobertura por grado de marginacion (Candidatos, estatal, 2021)

```js
const orden = ["Muy bajo", "Bajo", "Medio", "Alto", "Muy alto"];
const porGrado = new Map();
for (const d of cr2021) {
  const g = d.grado_marginacion;
  if (g == null || g === "") continue;
  if (!porGrado.has(g)) porGrado.set(g, {ben: 0, can: 0});
  const a = porGrado.get(g);
  a.ben += +d.beneficiarios || 0;
  a.can += +d.candidatos || 0;
}
const gradoFilas = orden.filter((g) => porGrado.has(g)).map((g) => ({
  grado: g, benef: porGrado.get(g).ben,
  tasa: porGrado.get(g).can ? porGrado.get(g).ben / porGrado.get(g).can * 100 : 0}));
display(barras(gradoFilas, {x: "grado", y: "tasa", crudoKey: "benef",
  titulo: "Cobertura por grado de marginacion (Candidatos, estatal, 2021)",
  subtitulo: "% de candidatos con beca por grado", fuente: "Fuente: STPS / CONAPO"}));
```

## Cuadrantes de pobreza y marginacion (Candidatos, estatal, 2021)

```js
const porEntPM = new Map();
for (const d of cr2021) {
  const k = String(d.cve_ent);
  if (!porEntPM.has(k)) porEntPM.set(k, {ben: 0, can: 0, pob: d.pct_pobreza, mar: d.indice_marginacion});
  const a = porEntPM.get(k);
  a.ben += +d.beneficiarios || 0;
  a.can += +d.candidatos || 0;
}
const ents = [...porEntPM.values()].filter((d) => d.pob !== "" && d.pob != null
  && d.mar !== "" && d.mar != null && d.can > 0);
const medP = ents.map((d) => d.pob).sort((a, b) => a - b)[Math.floor(ents.length / 2)];
const medM = ents.map((d) => d.mar).sort((a, b) => a - b)[Math.floor(ents.length / 2)];
const cuad = new Map();
for (const d of ents) {
  const cx = d.pob >= medP ? "pobreza alta" : "pobreza baja";
  const cy = d.mar >= medM ? "marg alta" : "marg baja";
  const c = cx + " / " + cy;
  if (!cuad.has(c)) cuad.set(c, {ben: 0, can: 0});
  cuad.get(c).ben += d.ben;
  cuad.get(c).can += d.can;
}
const cuadFilas = [...cuad].map(([c, v]) => ({cuadrante: c, benef: v.ben,
  tasa: v.can ? v.ben / v.can * 100 : 0}));
display(barras(cuadFilas, {x: "cuadrante", y: "tasa", crudoKey: "benef",
  titulo: "Cobertura promedio por cuadrante (Candidatos, estatal, 2021)",
  subtitulo: "% de candidatos con beca", fuente: "Fuente: STPS / CONEVAL / CONAPO"}));
```
