# ENIGH JCF — Nacional

Fuente: INEGI, ENIGH (2020, 2022, 2024). La muestra de hogares con la beca es
chica. Los deciles son nacionales.

```js
import {barras, barrasApiladas} from "../components/graficas.js";
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
```

## Cobertura (Hogares con un integrante candidato)

```js
display(barras(c1.map((d) => ({año: d.año, pct: d.pct_con_jcf})), {x: "año", y: "pct",
  titulo: "Cobertura (Hogares con un integrante candidato)",
  subtitulo: "% de hogares con candidato que reciben la beca", fuente: "Fuente: INEGI (ENIGH)"}));
```

## Cobertura por decil de ingreso (Hogares con un integrante candidato, año reciente)

```js
const añoD = Math.max(...dec.map((d) => d.año));
const covDec = dec.filter((d) => d.año === añoD)
  .map((d) => ({decil: String(d.decil), pct: d.tasa_decil * 100}))
  .sort((a, b) => +a.decil - +b.decil);
display(barras(covDec, {x: "decil", y: "pct",
  titulo: `Cobertura por decil (Hogares con un integrante candidato, ${añoD})`,
  subtitulo: "% de candidatos con beca por decil nacional", fuente: "Fuente: INEGI (ENIGH)"}));
```

## Reparto de la beca por decil (Hogares con un integrante con beca, año reciente)

```js
const repDec = dec.filter((d) => d.año === añoD)
  .map((d) => ({decil: String(d.decil), pct: d.reparto_jcf * 100}))
  .sort((a, b) => +a.decil - +b.decil);
display(barras(repDec, {x: "decil", y: "pct",
  titulo: `Reparto de la beca por decil (Hogares con un integrante con beca, ${añoD})`,
  subtitulo: "% de los hogares con beca en cada decil", fuente: "Fuente: INEGI (ENIGH)"}));
```

## Personas con la beca por sexo (Personas con beca, año reciente)

```js
const añoP = Math.max(...persSexo.map((d) => d.año));
const conBeca = persSexo.filter((d) => d.año === añoP && d.universo === "tiene_jcf");
const totP = conBeca.reduce((s, d) => s + d.personas, 0);
display(barras(conBeca.map((d) => ({sexo: d.sexo_etiqueta, pct: totP ? d.personas / totP * 100 : 0})),
  {x: "sexo", y: "pct", titulo: `Personas con la beca por sexo (Personas con beca, ${añoP})`,
   subtitulo: "% por sexo", fuente: "Fuente: INEGI (ENIGH)"}));
```

## Personas con la beca por edad (Personas con beca, año reciente)

```js
const añoE = Math.max(...persEdad.map((d) => d.año));
const edadBeca = persEdad.filter((d) => d.año === añoE && d.universo === "tiene_jcf");
const totE = edadBeca.reduce((s, d) => s + d.personas, 0);
display(barras(edadBeca.map((d) => ({edad: String(d.edad_num), pct: totE ? d.personas / totE * 100 : 0}))
    .sort((a, b) => +a.edad - +b.edad),
  {x: "edad", y: "pct", titulo: `Personas con la beca por edad (Personas con beca, ${añoE})`,
   subtitulo: "% por edad", fuente: "Fuente: INEGI (ENIGH)"}));
```

## Composicion del ingreso: con beca (Hogares con un integrante con beca)

```js
const añoCB = Math.max(...compBeca.map((d) => d.año));
display(barrasApiladas(compBeca.filter((d) => d.año === añoCB).map((d) => ({...d, x: "con beca"})),
  {x: "x", serie: "macrotema", valor: "pct",
   titulo: "Composicion del ingreso: con beca (Hogares con un integrante con beca)",
   subtitulo: `% del ingreso total (${añoCB})`, fuente: "Fuente: INEGI (ENIGH)"}));
```

## Composicion del ingreso: candidatos sin beca (Hogares con un integrante candidato)

```js
const añoCS = Math.max(...compSin.map((d) => d.año));
display(barrasApiladas(compSin.filter((d) => d.año === añoCS).map((d) => ({...d, x: "sin beca"})),
  {x: "x", serie: "macrotema", valor: "pct",
   titulo: "Composicion del ingreso: candidatos sin beca (Hogares con un integrante candidato)",
   subtitulo: `% del ingreso total (${añoCS})`, fuente: "Fuente: INEGI (ENIGH)"}));
```

## Composicion del ingreso por decil (Hogares con un integrante con beca, año reciente)

```js
const añoCD = Math.max(...compDecil.map((d) => d.año));
display(barrasApiladas(compDecil.filter((d) => d.año === añoCD).map((d) => ({...d, x: String(d.decil)})),
  {x: "x", serie: "macrotema", valor: "pct",
   titulo: `Composicion del ingreso por decil (Hogares con un integrante con beca, ${añoCD})`,
   subtitulo: "cada columna (decil) suma 100%", fuente: "Fuente: INEGI (ENIGH)"}));
```

## Desglose dentro de programas sociales y becas (Hogares con un integrante con beca)

```js
const añoDG = Math.max(...desg.map((d) => d.año));
display(barrasApiladas(desg.filter((d) => d.año === añoDG).map((d) => ({...d, x: "programas"})),
  {x: "x", serie: "programa", valor: "pct",
   titulo: "Desglose de programas sociales y becas (Hogares con un integrante con beca)",
   subtitulo: `% del ingreso de programas (${añoDG}); incluye JCF`, fuente: "Fuente: INEGI (ENIGH)"}));
```

## Desglose de programas por decil (Hogares con un integrante con beca, año reciente)

```js
const añoDD = Math.max(...desgDecil.map((d) => d.año));
display(barrasApiladas(desgDecil.filter((d) => d.año === añoDD).map((d) => ({...d, x: String(d.decil)})),
  {x: "x", serie: "programa", valor: "pct",
   titulo: `Desglose de programas por decil (Hogares con un integrante con beca, ${añoDD})`,
   subtitulo: "cada decil suma 100% del ingreso de programas", fuente: "Fuente: INEGI (ENIGH)"}));
```

## Coincidencia con otros programas (Hogares con un integrante con beca)

```js
display(barras(c9.map((d) => ({año: d.año, pct: d.pct_con_otro})), {x: "año", y: "pct",
  titulo: "Coincidencia con otros programas (Hogares con un integrante con beca)",
  subtitulo: "% de hogares con beca que reciben otro programa (P101-P107)", fuente: "Fuente: INEGI (ENIGH)"}));
```

## Peso de la beca en el ingreso del hogar (Hogares con un integrante con beca, año reciente)

```js
const añoC = Math.max(...cajitas.map((d) => d.año));
const caj = cajitas.filter((d) => d.año === añoC);
const totCaj = caj.reduce((s, d) => s + d.n, 0);
display(barras(caj.map((d) => ({caja: d.caja, pct: totCaj ? d.n / totCaj * 100 : 0})),
  {x: "caja", y: "pct", titulo: `Peso de la beca en el ingreso del hogar (Hogares con un integrante con beca, ${añoC})`,
   subtitulo: "% de hogares por intervalo (0-100 en cajas de 10)", fuente: "Fuente: INEGI (ENIGH)"}));
```

## Ingreso per capita comparado (Hogares con un integrante candidato, año reciente)

```js
const añoPC = Math.max(...percap.map((d) => d.año));
display(barras(percap.filter((d) => d.año === añoPC).map((d) => ({grupo: d.grupo, ing: d.ing_pc_real_prom})),
  {x: "grupo", y: "ing", formato: "entero",
   titulo: `Ingreso per capita comparado (Hogares con un integrante candidato, ${añoPC})`,
   subtitulo: "Pesos de 2024: con beca vs candidato sin beca", fuente: "Fuente: INEGI (ENIGH)"}));
```
