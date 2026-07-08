# Padron JCF — Nacional

```js
import {agrupar, conTasa} from "../components/agregar.js";
import {desglosar} from "../components/desglose.js";
import {barras, barrasAgrupadas, lineas} from "../components/graficas.js";
const padron = FileAttachment("../data/padron_agregado.csv").csv({typed: true});
const proyeccion = FileAttachment("../data/padron_proyeccion.csv").csv({typed: true});
const monto = FileAttachment("../data/padron_monto.csv").csv({typed: true});
const antiguedad = FileAttachment("../data/padron_antiguedad.csv").csv({typed: true});
const resumen = FileAttachment("../data/padron_resumen_dedup.csv").csv({typed: true});
```

## Numeralia (Candidatos, nacional, 2020)

```js
const cob2020 = conTasa(agrupar(padron.filter((d) => d.año === 2020), ["año"]))[0];
display(html`<p>En 2020 el padron registra
  <strong>${cob2020.beneficiarios.toLocaleString()}</strong> beneficiarios frente a
  <strong>${cob2020.candidatos.toLocaleString()}</strong> candidatos del censo, una
  tasa de cobertura de <strong>${cob2020.tasa.toFixed(1)}%</strong>.</p>`);
```

## Evolucion de la cobertura (Candidatos, nacional, 2019-2025)

Tasa de cobertura con universo estimado por proyeccion (factor base 2020).

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
// Evolucion sin desglose usa la proyeccion nacional (cve_ent "00"); con desglose
// usa el padron (que trae edad/sexo) y su tasa vs candidatos del padron.
const evoNac = proyeccion.filter((d) => d.cve_ent === 0 || d.cve_ent === "00");
```
```js
if (modo === "ninguno") {
  const filas = evoNac.map((d) => ({año: d.año, tasa: d.tasa * 100}));
  display(barras(filas, {x: "año", y: "tasa",
    titulo: "Evolucion de la cobertura (Candidatos, nacional, 2019-2025)",
    subtitulo: "% de candidatos estimados con beca", fuente: "Fuente: STPS / CONAPO"}));
} else {
  const filas = conTasa(desglosar(padron, {modo, edadMin, edadMax}))
    .map((d) => ({año: d.año, serie: d.serie, tasa: d.tasa == null ? 0 : d.tasa}));
  display(barrasAgrupadas(filas, {x: "año", serie: "serie", y: "tasa",
    titulo: "Evolucion de la cobertura por " + modoTxt.replace("Por ", "") + " (Candidatos, nacional)",
    subtitulo: "% de candidatos del padron con beca", fuente: "Fuente: STPS"}));
}
```

## Beneficiarios unicos por año (Beneficiarios, nacional)

```js
const filasU = resumen.map((d) => ({año: d.año, unicos: d.unicos}));
display(barras(filasU, {x: "año", y: "unicos", formato: "entero",
  titulo: "Beneficiarios unicos por año (Beneficiarios, nacional)",
  subtitulo: "Personas distintas deduplicadas", fuente: "Fuente: STPS"}));
```

## Cobertura por edad (Candidatos, nacional, 2020)

```js
const porEdad = conTasa(agrupar(
  padron.filter((d) => d.edad !== "" && d.edad != null
    && +d.edad >= 18 && +d.edad <= 29), ["edad"]))
  .sort((a, b) => a.edad - b.edad)
  .map((d) => ({edad: String(d.edad), tasa: d.tasa}));
display(barras(porEdad, {x: "edad", y: "tasa",
  titulo: "Cobertura por edad (Candidatos, nacional, 2020)",
  subtitulo: "% de candidatos con beca por edad", fuente: "Fuente: STPS"}));
```

## Perfil por sexo (Beneficiarios, nacional)

```js
// Porcentaje por sexo dentro de cada año.
const porSexo = desglosar(padron, {modo: "sexo"});
const totPorAño = new Map();
for (const d of porSexo) totPorAño.set(d.año, (totPorAño.get(d.año) ?? 0) + d.beneficiarios);
const sexoPct = porSexo.map((d) => ({año: d.año, serie: d.serie,
  pct: totPorAño.get(d.año) ? d.beneficiarios / totPorAño.get(d.año) * 100 : 0}));
display(barrasAgrupadas(sexoPct, {x: "año", serie: "serie", y: "pct",
  titulo: "Perfil por sexo (Beneficiarios, nacional)",
  subtitulo: "% de beneficiarios por sexo y año", fuente: "Fuente: STPS"}));
```

## Distribucion por edad (Beneficiarios, nacional)

```js
// Una linea por año: % del total de beneficiarios de ese año, por edad.
const conEdad = padron.filter((d) => d.edad !== "" && d.edad != null && +d.edad <= 32);
const porAñoEdad = desglosar(conEdad, {modo: "edad", edadMin: 18, edadMax: 32});
const totAño = new Map();
for (const d of porAñoEdad) totAño.set(d.año, (totAño.get(d.año) ?? 0) + d.beneficiarios);
const distEdad = porAñoEdad.map((d) => ({edad: +d.serie, año: String(d.año),
  pct: totAño.get(d.año) ? d.beneficiarios / totAño.get(d.año) * 100 : 0}))
  .sort((a, b) => a.edad - b.edad);
display(lineas(distEdad, {x: "edad", y: "pct", serie: "año",
  titulo: "Distribucion por edad (Beneficiarios, nacional)",
  subtitulo: "% de beneficiarios por edad, una linea por año", fuente: "Fuente: STPS"}));
```

## Distribucion por edad y sexo (Beneficiarios, nacional, año reciente)

```js
const añoMax = Math.max(...padron.map((d) => d.año));
const es = padron.filter((d) => d.año === añoMax
  && (d.sexo === "FEMENINO" || d.sexo === "MASCULINO")
  && d.edad !== "" && d.edad != null && +d.edad >= 18 && +d.edad <= 29);
// Porcentaje por sexo dentro de cada edad.
const porEdadSexo = new Map();
for (const d of es) {
  const k = d.edad + "||" + d.sexo;
  porEdadSexo.set(k, (porEdadSexo.get(k) ?? 0) + (+d.beneficiarios || 0));
}
const totEdad = new Map();
for (const [k, v] of porEdadSexo) {
  const edad = k.split("||")[0];
  totEdad.set(edad, (totEdad.get(edad) ?? 0) + v);
}
const esFilas = [...porEdadSexo].map(([k, v]) => {
  const [edad, sexo] = k.split("||");
  return {edad, serie: sexo, pct: totEdad.get(edad) ? v / totEdad.get(edad) * 100 : 0};
}).sort((a, b) => +a.edad - +b.edad);
display(barrasAgrupadas(esFilas, {x: "edad", serie: "serie", y: "pct",
  titulo: `Distribucion por edad y sexo (Beneficiarios, nacional, ${añoMax})`,
  subtitulo: "% por sexo dentro de cada edad", fuente: "Fuente: STPS"}));
```

## Monto: gasto mensual del programa (Beneficiarios, nacional)

```js
const filasM = monto.map((d) => ({año: d.año, gasto: d.gasto_mensual_mill}));
display(barras(filasM, {x: "año", y: "gasto", formato: "entero",
  titulo: "Gasto mensual del programa (Beneficiarios, nacional)",
  subtitulo: "Millones de pesos de 2024", fuente: "Fuente: STPS"}));
```

## Antiguedad: altas nuevas y continuaciones (Beneficiarios, nacional)

```js
// Porcentaje de nuevas y continuaciones dentro de cada año.
const totA = new Map();
for (const d of antiguedad) totA.set(d.año, (totA.get(d.año) ?? 0) + d.n);
const antigPct = antiguedad.map((d) => ({año: d.año, serie: d.tipo,
  pct: totA.get(d.año) ? d.n / totA.get(d.año) * 100 : 0}));
display(barrasAgrupadas(antigPct, {x: "año", serie: "serie", y: "pct",
  titulo: "Altas nuevas y continuaciones (Beneficiarios, nacional)",
  subtitulo: "% de beneficiarios por tipo y año", fuente: "Fuente: STPS"}));
```
