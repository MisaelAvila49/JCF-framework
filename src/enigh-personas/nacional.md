# ENIGH Personas — Nacional

Fuente: INEGI, ENIGH (2020, 2022, 2024). Perfil de las personas con la beca
(receptor identificado por la ENIGH) y de las personas candidatas. Muestra chica.

```js
import {barras, barrasFacetadas, maxProp, COLOR_SEXO, ESCALA_EDAD} from "../components/graficas.js";
import {modoDesde, sufijoFiltro} from "../components/panel.js";
const beca = FileAttachment("../data/enigh_persona_beca.csv").csv({typed: true});
const cand = FileAttachment("../data/enigh_persona_candidato.csv").csv({typed: true});
```

## Filtros

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
// Aplica el filtro de edad/sexo del panel a las personas con beca.
function aplicar(datos) {
  let f = datos;
  if (modo === "sexo") f = f.filter((d) => d.sexo === "FEMENINO" || d.sexo === "MASCULINO");
  if (modo === "edad") f = f.filter((d) => +d.edad >= edadMin && +d.edad <= edadMax);
  return f;
}
const becaF = aplicar(beca);
```

## Distribucion de personas con beca por edad (año reciente)

```js
const añoP = maxProp(becaF, "año");
const porEdad = new Map();
for (const d of becaF.filter((x) => x.año === añoP)) porEdad.set(+d.edad, (porEdad.get(+d.edad) ?? 0) + d.personas);
const totEdad = [...porEdad.values()].reduce((s, v) => s + v, 0);
const filasEdad = [...porEdad].map(([edad, per]) => ({edad: String(edad), per,
  pct: totEdad ? per / totEdad * 100 : 0})).sort((a, b) => +a.edad - +b.edad);
display(barras(filasEdad, {x: "edad", y: "pct", crudoKey: "per",
  titulo: `Personas con la beca por edad (Personas con beca, nacional, ${añoP})`,
  subtitulo: "% por edad" + sufijoFiltro(modo), fuente: "Fuente: INEGI (ENIGH)"}));
```

## Distribucion de personas con beca por sexo (año reciente)

```js
const porSexo = new Map();
for (const d of becaF.filter((x) => x.año === añoP)) porSexo.set(d.sexo, (porSexo.get(d.sexo) ?? 0) + d.personas);
const totSexo = [...porSexo.values()].reduce((s, v) => s + v, 0);
const filasSexo = [...porSexo].filter(([s]) => s === "FEMENINO" || s === "MASCULINO")
  .map(([sexo, per]) => ({sexo, per, pct: totSexo ? per / totSexo * 100 : 0}));
display(barras(filasSexo, {x: "sexo", y: "pct", crudoKey: "per",
  titulo: `Personas con la beca por sexo (Personas con beca, nacional, ${añoP})`,
  subtitulo: "% por sexo" + sufijoFiltro(modo), fuente: "Fuente: INEGI (ENIGH)"}));
```

## Distribucion de personas con beca por decil (3 años)

```js
const porAñoDecil = new Map();
for (const d of becaF) {
  const k = d.año + "||" + d.decil;
  porAñoDecil.set(k, (porAñoDecil.get(k) ?? 0) + d.personas);
}
const totAño = new Map();
for (const [k, v] of porAñoDecil) {
  const a = k.split("||")[0];
  totAño.set(a, (totAño.get(a) ?? 0) + v);
}
const filasDecil = [...porAñoDecil].map(([k, v]) => {
  const [a, dec] = k.split("||");
  return {año: a, decil: String(dec), per: v, pct: totAño.get(a) ? v / totAño.get(a) * 100 : 0};
}).sort((x, y) => +x.decil - +y.decil);
display(barrasFacetadas(filasDecil, {x: "decil", y: "pct", faceta: "año", crudoKey: "per",
  titulo: "Personas con la beca por decil (Personas con beca, nacional)",
  subtitulo: "% por decil, un panel por año" + sufijoFiltro(modo), fuente: "Fuente: INEGI (ENIGH)"}));
```

## Distribucion de personas candidatas por decil (3 años)

Analisis extra: como se distribuyen por decil las personas candidatas (con o sin
beca). No se filtra por edad/sexo del panel (universo de referencia).

```js
const candPorAñoDecil = new Map();
for (const d of cand) {
  const k = d.año + "||" + d.decil;
  candPorAñoDecil.set(k, (candPorAñoDecil.get(k) ?? 0) + d.personas);
}
const candTotAño = new Map();
for (const [k, v] of candPorAñoDecil) {
  const a = k.split("||")[0];
  candTotAño.set(a, (candTotAño.get(a) ?? 0) + v);
}
const candFilas = [...candPorAñoDecil].map(([k, v]) => {
  const [a, dec] = k.split("||");
  return {año: a, decil: String(dec), per: v, pct: candTotAño.get(a) ? v / candTotAño.get(a) * 100 : 0};
}).sort((x, y) => +x.decil - +y.decil);
display(barrasFacetadas(candFilas, {x: "decil", y: "pct", faceta: "año", crudoKey: "per",
  titulo: "Personas candidatas por decil (Personas candidatas, nacional)",
  subtitulo: "% por decil, un panel por año", fuente: "Fuente: INEGI (ENIGH)"}));
```
