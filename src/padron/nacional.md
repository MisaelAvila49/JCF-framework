# Padron JCF — Nacional

```js
import {agrupar, conTasa} from "../components/agregar.js";
import {desglosar} from "../components/desglose.js";
import {barras, barrasAgrupadas, lineas, maxProp, compacto, COLOR_SEXO} from "../components/graficas.js";
const padron = FileAttachment("../data/padron_agregado.csv").csv({typed: true});
const proyeccion = FileAttachment("../data/padron_proyeccion.csv").csv({typed: true});
const monto = FileAttachment("../data/padron_monto.csv").csv({typed: true});
const antiguedad = FileAttachment("../data/padron_antiguedad.csv").csv({typed: true});
const resumen = FileAttachment("../data/padron_resumen_dedup.csv").csv({typed: true});
```

## Cobertura nacional 2020

```js
const proyNac2020 = proyeccion.find((d) => (d.cve_ent === 0 || d.cve_ent === "00") && d.año === 2020);
display(html`<p>En 2020 el padron registra
  <strong>${compacto(proyNac2020.beneficiarios)}</strong> beneficiarios frente a
  <strong>${compacto(proyNac2020.candidatos_estimados)}</strong> candidatos estimados,
  una tasa de cobertura de <strong>${(proyNac2020.tasa * 100).toFixed(1)}%</strong>.</p>`);
```

## Evolucion de la cobertura (Candidatos, nacional, 2019-2025)

Tasa de cobertura con universo estimado por proyeccion (factor base 2020). El
desglose usa el padron (edad/sexo desde 2021).

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
const evoNac = proyeccion.filter((d) => d.cve_ent === 0 || d.cve_ent === "00");
```
```js
if (modo === "ninguno") {
  const filas = evoNac.map((d) => ({año: String(d.año), tasa: d.tasa * 100, benef: d.beneficiarios}));
  display(barras(filas, {x: "año", y: "tasa", crudoKey: "benef",
    titulo: "Evolucion de la cobertura (Candidatos, nacional, 2019-2025)",
    subtitulo: "% de candidatos estimados con beca", fuente: "Fuente: STPS / CONAPO"}));
} else {
  const filas = conTasa(desglosar(padron, {modo, edadMin, edadMax}))
    .filter((d) => d.candidatos > 0)
    .map((d) => ({año: String(d.año), serie: d.serie, tasa: d.tasa == null ? 0 : d.tasa, benef: d.beneficiarios}));
  display(barrasAgrupadas(filas, {x: "año", serie: "serie", y: "tasa", crudoKey: "benef",
    colorSerie: modo === "sexo" ? COLOR_SEXO : null,
    serieLabel: modo === "sexo" ? "Sexo" : "Edad",
    titulo: "Evolucion de la cobertura por " + modoTxt.replace("Por ", "") + " (Candidatos, nacional, 2021-2025)",
    subtitulo: "% de candidatos del padron con beca", fuente: "Fuente: STPS"}));
}
```

## Beneficiarios unicos por año (Beneficiarios, nacional)

```js
const filasU = resumen.map((d) => ({año: String(d.año), unicos: d.unicos}));
display(barras(filasU, {x: "año", y: "unicos", formato: "entero", crudoKey: "unicos",
  titulo: "Beneficiarios unicos por año (Beneficiarios, nacional)",
  subtitulo: "Personas distintas deduplicadas", fuente: "Fuente: STPS"}));
```

## Cobertura por edad (Candidatos, nacional, 2021)

Primer año con candidatos por edad en el padron. Se puede partir por sexo.

```js
const partirSexoCob = view(Inputs.toggle({label: "Dividir por sexo", value: false}));
```
```js
const baseCobEdad = padron.filter((d) => d.año === 2021 && d.edad !== "" && d.edad != null
  && +d.edad >= 18 && +d.edad <= 29);
if (!partirSexoCob) {
  const porEdad = conTasa(agrupar(baseCobEdad, ["edad"]))
    .filter((d) => d.tasa != null)
    .sort((a, b) => a.edad - b.edad)
    .map((d) => ({edad: String(d.edad), tasa: d.tasa, benef: d.beneficiarios}));
  display(barras(porEdad, {x: "edad", y: "tasa", crudoKey: "benef",
    titulo: "Cobertura por edad (Candidatos, nacional, 2021)",
    subtitulo: "% de candidatos con beca por edad", fuente: "Fuente: STPS"}));
} else {
  const porEdadSexo = conTasa(agrupar(
    baseCobEdad.filter((d) => d.sexo === "FEMENINO" || d.sexo === "MASCULINO"),
    ["edad", "sexo"]))
    .filter((d) => d.tasa != null)
    .sort((a, b) => a.edad - b.edad)
    .map((d) => ({edad: String(d.edad), serie: d.sexo, tasa: d.tasa, benef: d.beneficiarios}));
  display(barrasAgrupadas(porEdadSexo, {x: "edad", serie: "serie", y: "tasa", crudoKey: "benef",
    colorSerie: COLOR_SEXO, serieLabel: "Sexo", xLabel: "Edad",
    titulo: "Cobertura por edad y sexo (Candidatos, nacional, 2021)",
    subtitulo: "% de candidatos con beca por edad y sexo", fuente: "Fuente: STPS"}));
}
```

## Perfil por sexo (Beneficiarios, nacional)

```js
const porSexo = desglosar(padron, {modo: "sexo"});
const totPorAño = new Map();
for (const d of porSexo) totPorAño.set(d.año, (totPorAño.get(d.año) ?? 0) + d.beneficiarios);
const sexoPct = porSexo.map((d) => ({año: String(d.año), serie: d.serie, benef: d.beneficiarios,
  pct: totPorAño.get(d.año) ? d.beneficiarios / totPorAño.get(d.año) * 100 : 0}));
display(barrasAgrupadas(sexoPct, {x: "año", serie: "serie", y: "pct", crudoKey: "benef",
  colorSerie: COLOR_SEXO, serieLabel: "Sexo",
  titulo: "Perfil por sexo (Beneficiarios, nacional)",
  subtitulo: "% de beneficiarios por sexo y año", fuente: "Fuente: STPS"}));
```

## Distribucion por edad (Beneficiarios, nacional)

```js
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
const añoMax = maxProp(padron, "año");
const es = padron.filter((d) => d.año === añoMax
  && (d.sexo === "FEMENINO" || d.sexo === "MASCULINO")
  && d.edad !== "" && d.edad != null && +d.edad >= 18 && +d.edad <= 29);
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
  return {edad, serie: sexo, benef: v, pct: totEdad.get(edad) ? v / totEdad.get(edad) * 100 : 0};
}).sort((a, b) => +a.edad - +b.edad);
display(barrasAgrupadas(esFilas, {x: "edad", serie: "serie", y: "pct", crudoKey: "benef",
  colorSerie: COLOR_SEXO, serieLabel: "Sexo", xLabel: "Edad",
  titulo: `Distribucion por edad y sexo (Beneficiarios, nacional, ${añoMax})`,
  subtitulo: "% por sexo dentro de cada edad", fuente: "Fuente: STPS"}));
```

## Monto: gasto mensual del programa (Beneficiarios, nacional)

```js
const filasM = monto.map((d) => ({año: String(d.año), gasto: d.gasto_mensual_mill}));
display(barras(filasM, {x: "año", y: "gasto", formato: "entero", crudoKey: "gasto",
  titulo: "Gasto mensual del programa (Beneficiarios, nacional)",
  subtitulo: "Millones de pesos de 2024", fuente: "Fuente: STPS"}));
```

## Antiguedad: altas nuevas y continuaciones (Beneficiarios, nacional)

```js
const totA = new Map();
for (const d of antiguedad) totA.set(d.año, (totA.get(d.año) ?? 0) + d.n);
const antigPct = antiguedad.map((d) => ({año: String(d.año), serie: d.tipo, benef: d.n,
  pct: totA.get(d.año) ? d.n / totA.get(d.año) * 100 : 0}));
display(barrasAgrupadas(antigPct, {x: "año", serie: "serie", y: "pct", crudoKey: "benef",
  serieLabel: "Tipo",
  titulo: "Altas nuevas y continuaciones (Beneficiarios, nacional)",
  subtitulo: "% de beneficiarios por tipo y año", fuente: "Fuente: STPS"}));
```
