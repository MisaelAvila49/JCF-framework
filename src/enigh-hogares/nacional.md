# ENIGH Hogares — Nacional

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
const compSinDecil = FileAttachment("../data/enigh_composicion_sin_beca_por_decil.csv").csv({typed: true});
const desg = FileAttachment("../data/enigh_desglose_programas.csv").csv({typed: true});
const desgDecil = FileAttachment("../data/enigh_desglose_programas_por_decil.csv").csv({typed: true});
const c9 = FileAttachment("../data/enigh_c9_otro_programa.csv").csv({typed: true});
const cajitas = FileAttachment("../data/enigh_c10_cajitas.csv").csv({typed: true});
const percap = FileAttachment("../data/enigh_ingreso_percapita.csv").csv({typed: true});
const deciles = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
```

## Año

Los analisis por decil, composicion, cajitas e ingreso usan el año elegido. Las
series por año (cobertura, otros programas) muestran los tres años.

```js
const anio = view(Inputs.select([2024, 2022, 2020], {label: "Año", value: 2024}));
```

## Cobertura por año (Hogares con un integrante candidato)

```js
display(barras(c1.map((d) => ({año: String(d.año), pct: d.pct_con_jcf, hog: d.con_jcf})),
  {x: "año", y: "pct", crudoKey: "hog",
   subtitulo: "% de hogares con candidato que reciben la beca", fuente: "Fuente: INEGI (ENIGH)"}));
```

## Cobertura por decil de ingreso

```js
const covDec = dec.filter((d) => d.año === anio)
  .map((d) => ({decil: String(d.decil), pct: d.tasa_decil * 100, hog: d.con_jcf}))
  .sort((a, b) => +a.decil - +b.decil);
display(barras(covDec, {x: "decil", y: "pct", crudoKey: "hog",
  subtitulo: `% de candidatos con beca por decil nacional (${anio})`, fuente: "Fuente: INEGI (ENIGH)"}));
```

## Reparto de la beca por decil

```js
const repDec = dec.filter((d) => d.año === anio)
  .map((d) => ({decil: String(d.decil), pct: d.reparto_jcf * 100, hog: d.con_jcf}))
  .sort((a, b) => +a.decil - +b.decil);
display(barras(repDec, {x: "decil", y: "pct", crudoKey: "hog",
  subtitulo: `% de los hogares con beca en cada decil (${anio})`, fuente: "Fuente: INEGI (ENIGH)"}));
```

## Personas con la beca por sexo

```js
const conBeca = persSexo.filter((d) => d.año === anio && d.universo === "tiene_jcf");
const totP = conBeca.reduce((s, d) => s + d.personas, 0);
display(conBeca.length ? barras(conBeca.map((d) => ({sexo: d.sexo_etiqueta, pct: totP ? d.personas / totP * 100 : 0, per: d.personas})),
  {x: "sexo", y: "pct", crudoKey: "per",
   subtitulo: `% por sexo (${anio})`, fuente: "Fuente: INEGI (ENIGH)"})
  : html`<p>Sin datos para ${anio}.</p>`);
```

## Personas con la beca por edad

```js
const edadBeca = persEdad.filter((d) => d.año === anio && d.universo === "tiene_jcf");
const totE = edadBeca.reduce((s, d) => s + d.personas, 0);
display(edadBeca.length ? barras(edadBeca.map((d) => ({edad: String(d.edad_num), pct: totE ? d.personas / totE * 100 : 0, per: d.personas}))
    .sort((a, b) => +a.edad - +b.edad),
  {x: "edad", y: "pct", crudoKey: "per",
   subtitulo: `% por edad (${anio})`, fuente: "Fuente: INEGI (ENIGH)"})
  : html`<p>Sin datos para ${anio}.</p>`);
```

## Composicion del ingreso: con beca (Hogares con beca)

```js
const cb = compBeca.filter((d) => d.año === anio).map((d) => ({...d, x: "con beca"}));
display(cb.length ? barrasApiladas(cb, {x: "x", serie: "macrotema", valor: "pct", crudoKey: "monto_exp",
   subtitulo: `% del ingreso total (${anio})`, fuente: "Fuente: INEGI (ENIGH)"})
  : html`<p>Sin datos para ${anio}.</p>`);
```

## Composicion del ingreso: candidatos sin beca (Hogares candidatos)

```js
const cs = compSin.filter((d) => d.año === anio).map((d) => ({...d, x: "sin beca"}));
display(cs.length ? barrasApiladas(cs, {x: "x", serie: "macrotema", valor: "pct", crudoKey: "monto_exp",
   subtitulo: `% del ingreso total (${anio})`, fuente: "Fuente: INEGI (ENIGH)"})
  : html`<p>Sin datos para ${anio}.</p>`);
```

## Composicion del ingreso por decil: con beca (Hogares con beca)

```js
const cdB = compDecil.filter((d) => d.año === anio).map((d) => ({...d, x: String(d.decil)}));
display(cdB.length ? barrasApiladas(cdB, {x: "x", serie: "macrotema", valor: "pct", crudoKey: "monto_exp",
   dominioX: deciles, subtitulo: `cada decil suma 100% (${anio})`, fuente: "Fuente: INEGI (ENIGH)"})
  : html`<p>Sin datos para ${anio}.</p>`);
```

## Composicion del ingreso por decil: candidatos sin beca (Hogares candidatos)

```js
const cdS = compSinDecil.filter((d) => d.año === anio).map((d) => ({...d, x: String(d.decil)}));
display(cdS.length ? barrasApiladas(cdS, {x: "x", serie: "macrotema", valor: "pct", crudoKey: "monto_exp",
   dominioX: deciles, subtitulo: `cada decil suma 100% (${anio})`, fuente: "Fuente: INEGI (ENIGH)"})
  : html`<p>Sin datos para ${anio}.</p>`);
```

## Desglose dentro de programas sociales y becas (Hogares con beca)

```js
const dg = desg.filter((d) => d.año === anio).map((d) => ({...d, x: "programas"}));
display(dg.length ? barrasApiladas(dg, {x: "x", serie: "programa", valor: "pct", crudoKey: "monto_exp",
   subtitulo: `% del ingreso de programas; incluye JCF (${anio})`, fuente: "Fuente: INEGI (ENIGH)"})
  : html`<p>Sin datos para ${anio}.</p>`);
```

## Desglose de programas por decil (Hogares con beca)

```js
const dgd = desgDecil.filter((d) => d.año === anio).map((d) => ({...d, x: String(d.decil)}));
display(dgd.length ? barrasApiladas(dgd, {x: "x", serie: "programa", valor: "pct", crudoKey: "monto_exp",
   dominioX: deciles, subtitulo: `cada decil suma 100% del ingreso de programas (${anio})`, fuente: "Fuente: INEGI (ENIGH)"})
  : html`<p>Sin datos para ${anio}.</p>`);
```

## Coincidencia con otros programas (Hogares con beca)

```js
display(barras(c9.map((d) => ({año: String(d.año), pct: d.pct_con_otro})), {x: "año", y: "pct",
  subtitulo: "% de hogares con beca que reciben otro programa (P101-P107)", fuente: "Fuente: INEGI (ENIGH)"}));
```

## Peso de la beca en el ingreso del hogar (Hogares con beca)

```js
const caj = cajitas.filter((d) => d.año === anio);
const totCaj = caj.reduce((s, d) => s + d.n, 0);
display(caj.length ? barras(caj.map((d) => ({caja: String(d.caja), pct: totCaj ? d.n / totCaj * 100 : 0, hog: d.n})),
  {x: "caja", y: "pct", crudoKey: "hog",
   subtitulo: `% de hogares por intervalo, 0-100 en cajas de 10 (${anio})`, fuente: "Fuente: INEGI (ENIGH)"})
  : html`<p>Sin datos para ${anio}.</p>`);
```

## Ingreso per capita comparado (Hogares candidatos)

```js
const pc = percap.filter((d) => d.año === anio);
display(pc.length ? barras(pc.map((d) => ({grupo: d.grupo, ing: d.ing_pc_real_prom, hog: d.hogares})),
  {x: "grupo", y: "ing", formato: "entero", crudoKey: "hog",
   subtitulo: `Pesos de 2024: con beca vs candidato sin beca (${anio})`, fuente: "Fuente: INEGI (ENIGH)"})
  : html`<p>Sin datos para ${anio}.</p>`);
```
