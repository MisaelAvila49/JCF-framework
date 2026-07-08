# ENIGH Personas — Estatal

Fuente: INEGI, ENIGH. Perfil de las personas con la beca por entidad. Muestra muy
chica por estado: solo referencia.

```js
import {barras, barrasFacetadas, maxProp, COLOR_SEXO} from "../components/graficas.js";
import {mapaEntidades} from "../components/mapa.js";
import {modoDesde, sufijoFiltro} from "../components/panel.js";
const beca = FileAttachment("../data/enigh_persona_beca.csv").csv({typed: true});
const cruces = FileAttachment("../data/padron_cruces.csv").csv({typed: true});
const geoEnt = FileAttachment("../data/mx_entidades.json").json();
```

```js
const nombrePorCve = new Map(cruces.map((d) => [String(d.cve_ent).padStart(2, "0"), d.nombre_ent]));
const nombresEnt = Array.from(new Set(nombrePorCve.values())).filter((n) => n).sort((a, b) => a.localeCompare(b, "es"));
function norm(t) { return (t ?? "").toString().normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); }
```

## Filtros

```js
const nombreEnt = view(Inputs.text({label: "Estado", value: "", placeholder: "escribe un estado", datalist: nombresEnt}));
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
const cveSel = (() => {
  const q = norm(nombreEnt);
  if (!q) return null;
  const hit = [...nombrePorCve.entries()].find(([, n]) => norm(n).includes(q));
  return hit ? hit[0] : null;
})();
function aplicar(datos) {
  let f = datos;
  if (cveSel) f = f.filter((d) => String(d.cve_ent).padStart(2, "0") === cveSel);
  if (modo === "sexo") f = f.filter((d) => d.sexo === "FEMENINO" || d.sexo === "MASCULINO");
  if (modo === "edad") f = f.filter((d) => +d.edad >= edadMin && +d.edad <= edadMax);
  return f;
}
const becaF = aplicar(beca);
```

## Mapa: personas con la beca por entidad (año reciente)

```js
const añoM = maxProp(beca, "año");
const porCve = new Map();
for (const d of beca.filter((x) => x.año === añoM)) {
  const cve = String(d.cve_ent).padStart(2, "0");
  porCve.set(cve, (porCve.get(cve) ?? 0) + d.personas);
}
const totCve = [...porCve.values()].reduce((s, v) => s + v, 0);
const valEnt = new Map([...porCve].map(([cve, per]) => [cve, totCve ? per / totCve * 100 : 0]));
display(mapaEntidades(await geoEnt, valEnt, {
  subtitulo: `% de las personas con beca por entidad (${añoM})`, fuente: "Fuente: INEGI (ENIGH)",
  nombrePorCve, formato: "pct", etiquetaValor: "% personas"}));
```

## Distribucion por edad (año reciente, estado filtrado)

```js
const añoP = maxProp(beca, "año");
const porEdad = new Map();
for (const d of becaF.filter((x) => x.año === añoP)) porEdad.set(+d.edad, (porEdad.get(+d.edad) ?? 0) + d.personas);
const totEdad = [...porEdad.values()].reduce((s, v) => s + v, 0);
const filasEdad = [...porEdad].map(([edad, per]) => ({edad: String(edad), per,
  pct: totEdad ? per / totEdad * 100 : 0})).sort((a, b) => +a.edad - +b.edad);
display(filasEdad.length ? barras(filasEdad, {x: "edad", y: "pct", crudoKey: "per",
  titulo: `Personas con la beca por edad (Personas con beca, estatal, ${añoP})`,
  subtitulo: "% por edad" + sufijoFiltro(modo), fuente: "Fuente: INEGI (ENIGH)"})
  : html`<p>Sin personas con beca en la muestra del estado elegido.</p>`);
```

## Distribucion por sexo (año reciente, estado filtrado)

```js
const porSexo = new Map();
for (const d of becaF.filter((x) => x.año === añoP)) porSexo.set(d.sexo, (porSexo.get(d.sexo) ?? 0) + d.personas);
const totSexo = [...porSexo.values()].reduce((s, v) => s + v, 0);
const filasSexo = [...porSexo].filter(([s]) => s === "FEMENINO" || s === "MASCULINO")
  .map(([sexo, per]) => ({sexo, per, pct: totSexo ? per / totSexo * 100 : 0}));
display(filasSexo.length ? barras(filasSexo, {x: "sexo", y: "pct", crudoKey: "per",
  titulo: `Personas con la beca por sexo (Personas con beca, estatal, ${añoP})`,
  subtitulo: "% por sexo" + sufijoFiltro(modo), fuente: "Fuente: INEGI (ENIGH)"})
  : html`<p>Sin datos para el estado elegido.</p>`);
```

## Distribucion por decil (3 años, estado filtrado)

```js
const porAñoDecil = new Map();
for (const d of becaF) {
  const k = d.año + "||" + d.decil;
  porAñoDecil.set(k, (porAñoDecil.get(k) ?? 0) + d.personas);
}
const totAño = new Map();
for (const [k, v] of porAñoDecil) { const a = k.split("||")[0]; totAño.set(a, (totAño.get(a) ?? 0) + v); }
const filasDecil = [...porAñoDecil].map(([k, v]) => {
  const [a, dec] = k.split("||");
  return {año: a, decil: String(dec), per: v, pct: totAño.get(a) ? v / totAño.get(a) * 100 : 0};
}).sort((x, y) => +x.decil - +y.decil);
display(filasDecil.length ? barrasFacetadas(filasDecil, {x: "decil", y: "pct", faceta: "año", crudoKey: "per",
  titulo: "Personas con la beca por decil (Personas con beca, estatal)",
  subtitulo: "% por decil, un panel por año" + sufijoFiltro(modo), fuente: "Fuente: INEGI (ENIGH)"})
  : html`<p>Sin datos para el estado elegido.</p>`);
```
