# ENIGH JCF — Nacional

Fuente: INEGI, ENIGH (2020, 2022, 2024). La muestra de hogares con la beca es
chica. Los deciles son nacionales.

```js
import {barras, barrasApiladas, maxProp} from "../components/graficas.js";
const c1 = FileAttachment("../data/enigh_c1_cobertura.csv").csv({typed: true});
const dec = FileAttachment("../data/enigh_c3c4_decil.csv").csv({typed: true});
const persSexo = FileAttachment("../data/enigh_personas_sexo.csv").csv({typed: true});
const persEdad = FileAttachment("../data/enigh_personas_edad.csv").csv({typed: true});
const compBeca = FileAttachment("../data/enigh_composicion_ingreso.csv").csv({typed: true});
const compSin = FileAttachment("../data/enigh_composicion_sin_beca.csv").csv({typed: true});
const compDecil = FileAttachment("../data/enigh_composicion_por_decil.csv").csv({typed: true});
const desg = FileAttachment("../data/enigh_desglose_programas.csv").csv({typed: true});
const desgDecil = FileAttachment("../data/enigh_desglose_programas_por_decil.csv").csv({typed: true});
const c9 = FileAttachment("../data/enigh_c9_otro_programa.csv").csv({typed: true});
const cajitas = FileAttachment("../data/enigh_c10_cajitas.csv").csv({typed: true});
const percap = FileAttachment("../data/enigh_ingreso_percapita.csv").csv({typed: true});
const deciles = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
```

## Cobertura (Hogares con un integrante candidato)

```js
display(barras(c1.map((d) => ({año: String(d.año), pct: d.pct_con_jcf})), {x: "año", y: "pct",
  subtitulo: "% de hogares con candidato que reciben la beca", fuente: "Fuente: INEGI (ENIGH)"}));
```

## Cobertura por decil de ingreso (año reciente)

```js
const añoD = maxProp(dec, "año");
const covDec = dec.filter((d) => d.año === añoD)
  .map((d) => ({decil: String(d.decil), pct: d.tasa_decil * 100, hog: d.con_jcf}))
  .sort((a, b) => +a.decil - +b.decil);
display(barras(covDec, {x: "decil", y: "pct", crudoKey: "hog",
  subtitulo: `% de candidatos con beca por decil nacional (${añoD})`, fuente: "Fuente: INEGI (ENIGH)"}));
```

## Reparto de la beca por decil (año reciente)

```js
const repDec = dec.filter((d) => d.año === añoD)
  .map((d) => ({decil: String(d.decil), pct: d.reparto_jcf * 100, hog: d.con_jcf}))
  .sort((a, b) => +a.decil - +b.decil);
display(barras(repDec, {x: "decil", y: "pct", crudoKey: "hog",
  subtitulo: `% de los hogares con beca en cada decil (${añoD})`, fuente: "Fuente: INEGI (ENIGH)"}));
```

## Personas con la beca por sexo (año reciente)

```js
const añoP = maxProp(persSexo, "año");
const conBeca = persSexo.filter((d) => d.año === añoP && d.universo === "tiene_jcf");
const totP = conBeca.reduce((s, d) => s + d.personas, 0);
display(barras(conBeca.map((d) => ({sexo: d.sexo_etiqueta, pct: totP ? d.personas / totP * 100 : 0, per: d.personas})),
  {x: "sexo", y: "pct", crudoKey: "per",
   subtitulo: `% por sexo (${añoP})`, fuente: "Fuente: INEGI (ENIGH)"}));
```

## Personas con la beca por edad (año reciente)

```js
const añoE = maxProp(persEdad, "año");
const edadBeca = persEdad.filter((d) => d.año === añoE && d.universo === "tiene_jcf");
const totE = edadBeca.reduce((s, d) => s + d.personas, 0);
display(barras(edadBeca.map((d) => ({edad: String(d.edad_num), pct: totE ? d.personas / totE * 100 : 0, per: d.personas}))
    .sort((a, b) => +a.edad - +b.edad),
  {x: "edad", y: "pct", crudoKey: "per",
   subtitulo: `% por edad (${añoE})`, fuente: "Fuente: INEGI (ENIGH)"}));
```

## Composicion del ingreso: con beca (Hogares con beca)

```js
const añoCB = maxProp(compBeca, "año");
display(barrasApiladas(compBeca.filter((d) => d.año === añoCB).map((d) => ({...d, x: "con beca"})),
  {x: "x", serie: "macrotema", valor: "pct", crudoKey: "monto_exp",
   subtitulo: `% del ingreso total (${añoCB})`, fuente: "Fuente: INEGI (ENIGH)"}));
```

## Composicion del ingreso: candidatos sin beca (Hogares candidatos)

```js
const añoCS = maxProp(compSin, "año");
display(barrasApiladas(compSin.filter((d) => d.año === añoCS).map((d) => ({...d, x: "sin beca"})),
  {x: "x", serie: "macrotema", valor: "pct", crudoKey: "monto_exp",
   subtitulo: `% del ingreso total (${añoCS})`, fuente: "Fuente: INEGI (ENIGH)"}));
```

## Composicion del ingreso por decil (Hogares con beca, año reciente)

```js
const añoCD = maxProp(compDecil, "año");
display(barrasApiladas(compDecil.filter((d) => d.año === añoCD).map((d) => ({...d, x: String(d.decil)})),
  {x: "x", serie: "macrotema", valor: "pct", crudoKey: "monto_exp", dominioX: deciles,
   subtitulo: `cada columna (decil) suma 100% (${añoCD})`, fuente: "Fuente: INEGI (ENIGH)"}));
```

## Desglose dentro de programas sociales y becas (Hogares con beca)

```js
const añoDG = maxProp(desg, "año");
display(barrasApiladas(desg.filter((d) => d.año === añoDG).map((d) => ({...d, x: "programas"})),
  {x: "x", serie: "programa", valor: "pct", crudoKey: "monto_exp",
   subtitulo: `% del ingreso de programas (${añoDG}); incluye JCF`, fuente: "Fuente: INEGI (ENIGH)"}));
```

## Desglose de programas por decil (Hogares con beca, año reciente)

```js
const añoDD = maxProp(desgDecil, "año");
display(barrasApiladas(desgDecil.filter((d) => d.año === añoDD).map((d) => ({...d, x: String(d.decil)})),
  {x: "x", serie: "programa", valor: "pct", crudoKey: "monto_exp", dominioX: deciles,
   subtitulo: `cada decil suma 100% del ingreso de programas (${añoDD})`, fuente: "Fuente: INEGI (ENIGH)"}));
```

## Coincidencia con otros programas (Hogares con beca)

```js
display(barras(c9.map((d) => ({año: String(d.año), pct: d.pct_con_otro})), {x: "año", y: "pct",
  subtitulo: "% de hogares con beca que reciben otro programa (P101-P107)", fuente: "Fuente: INEGI (ENIGH)"}));
```

## Peso de la beca en el ingreso del hogar (Hogares con beca, año reciente)

```js
const añoC = maxProp(cajitas, "año");
const caj = cajitas.filter((d) => d.año === añoC);
const totCaj = caj.reduce((s, d) => s + d.n, 0);
display(barras(caj.map((d) => ({caja: String(d.caja), pct: totCaj ? d.n / totCaj * 100 : 0, hog: d.n})),
  {x: "caja", y: "pct", crudoKey: "hog",
   subtitulo: `% de hogares por intervalo, 0-100 en cajas de 10 (${añoC})`, fuente: "Fuente: INEGI (ENIGH)"}));
```

## Ingreso per capita comparado (Hogares candidatos, año reciente)

```js
const añoPC = maxProp(percap, "año");
display(barras(percap.filter((d) => d.año === añoPC).map((d) => ({grupo: d.grupo, ing: d.ing_pc_real_prom, hog: d.hogares})),
  {x: "grupo", y: "ing", formato: "entero", crudoKey: "hog",
   subtitulo: `Pesos de 2024: con beca vs candidato sin beca (${añoPC})`, fuente: "Fuente: INEGI (ENIGH)"}));
```
