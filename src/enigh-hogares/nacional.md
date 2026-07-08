# ENIGH Hogares — Nacional

Fuente: INEGI, ENIGH (2020, 2022, 2024). La muestra de hogares con la beca es
chica. Los deciles son nacionales.

```js
import {barras, barrasApiladas, barrasFacetadas, maxProp} from "../components/graficas.js";
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

Todas las graficas muestran los tres años (2020, 2022, 2024): las series por año
en un solo eje, y las de decil / composicion en paneles lado a lado.

## Cobertura por año (Hogares con un integrante candidato)

```js
display(barras(c1.map((d) => ({año: String(d.año), pct: d.pct_con_jcf, hog: d.con_jcf})),
  {x: "año", y: "pct", crudoKey: "hog",
   subtitulo: "% de hogares con candidato que reciben la beca", fuente: "Fuente: INEGI (ENIGH)"}));
```

## Cobertura por decil de ingreso (3 años)

```js
const covDec = dec.map((d) => ({año: String(d.año), decil: String(d.decil),
  pct: d.tasa_decil * 100, hog: d.con_jcf})).sort((a, b) => +a.decil - +b.decil);
display(barrasFacetadas(covDec, {x: "decil", y: "pct", faceta: "año", crudoKey: "hog",
  titulo: "Cobertura por decil (Hogares con un integrante candidato)",
  subtitulo: "% de candidatos con beca por decil, un panel por año", fuente: "Fuente: INEGI (ENIGH)"}));
```

## Reparto de la beca por decil (3 años)

```js
const repDec = dec.map((d) => ({año: String(d.año), decil: String(d.decil),
  pct: d.reparto_jcf * 100, hog: d.con_jcf})).sort((a, b) => +a.decil - +b.decil);
display(barrasFacetadas(repDec, {x: "decil", y: "pct", faceta: "año", crudoKey: "hog",
  titulo: "Reparto de la beca por decil (Hogares con un integrante con beca)",
  subtitulo: "% de los hogares con beca en cada decil, un panel por año", fuente: "Fuente: INEGI (ENIGH)"}));
```

## Personas con la beca por sexo (3 años)

```js
const totSexoAño = new Map();
for (const d of persSexo.filter((x) => x.universo === "tiene_jcf")) totSexoAño.set(d.año, (totSexoAño.get(d.año) ?? 0) + d.personas);
const sexoFilas = persSexo.filter((d) => d.universo === "tiene_jcf")
  .map((d) => ({año: String(d.año), sexo: d.sexo_etiqueta, per: d.personas,
    pct: totSexoAño.get(d.año) ? d.personas / totSexoAño.get(d.año) * 100 : 0}));
display(barrasFacetadas(sexoFilas, {x: "sexo", y: "pct", faceta: "año", crudoKey: "per",
  titulo: "Personas con la beca por sexo (Personas con beca, nacional)",
  subtitulo: "% por sexo, un panel por año", fuente: "Fuente: INEGI (ENIGH)"}));
```

## Personas con la beca por edad (3 años)

```js
const totEdadAño = new Map();
for (const d of persEdad.filter((x) => x.universo === "tiene_jcf")) totEdadAño.set(d.año, (totEdadAño.get(d.año) ?? 0) + d.personas);
const edadFilas = persEdad.filter((d) => d.universo === "tiene_jcf")
  .map((d) => ({año: String(d.año), edad: String(d.edad_num), per: d.personas,
    pct: totEdadAño.get(d.año) ? d.personas / totEdadAño.get(d.año) * 100 : 0}))
  .sort((a, b) => +a.edad - +b.edad);
display(barrasFacetadas(edadFilas, {x: "edad", y: "pct", faceta: "año", crudoKey: "per",
  titulo: "Personas con la beca por edad (Personas con beca, nacional)",
  subtitulo: "% por edad, un panel por año", fuente: "Fuente: INEGI (ENIGH)"}));
```

## Composicion del ingreso: con beca (Hogares con beca, 3 años)

```js
const cb = compBeca.map((d) => ({...d, x: String(d.año)}));
display(barrasApiladas(cb, {x: "x", serie: "macrotema", valor: "pct", crudoKey: "monto_exp",
   subtitulo: "% del ingreso total, una barra por año", fuente: "Fuente: INEGI (ENIGH)"}));
```

## Composicion del ingreso: candidatos sin beca (Hogares candidatos, 3 años)

```js
const cs = compSin.map((d) => ({...d, x: String(d.año)}));
display(barrasApiladas(cs, {x: "x", serie: "macrotema", valor: "pct", crudoKey: "monto_exp",
   subtitulo: "% del ingreso total, una barra por año", fuente: "Fuente: INEGI (ENIGH)"}));
```

## Composicion del ingreso por decil: con beca (Hogares con beca, 3 años)

```js
const cdB = compDecil.map((d) => ({...d, x: String(d.decil), año: String(d.año)}));
display(barrasApiladas(cdB, {x: "x", serie: "macrotema", valor: "pct", crudoKey: "monto_exp",
   dominioX: deciles, faceta: "año", subtitulo: "cada decil suma 100%, un panel por año", fuente: "Fuente: INEGI (ENIGH)"}));
```

## Composicion del ingreso por decil: candidatos sin beca (Hogares candidatos, 3 años)

```js
const cdS = compSinDecil.map((d) => ({...d, x: String(d.decil), año: String(d.año)}));
display(barrasApiladas(cdS, {x: "x", serie: "macrotema", valor: "pct", crudoKey: "monto_exp",
   dominioX: deciles, faceta: "año", subtitulo: "cada decil suma 100%, un panel por año", fuente: "Fuente: INEGI (ENIGH)"}));
```

## Desglose dentro de programas sociales y becas (Hogares con beca, 3 años)

```js
const dg = desg.map((d) => ({...d, x: String(d.año)}));
display(barrasApiladas(dg, {x: "x", serie: "programa", valor: "pct", crudoKey: "monto_exp",
   subtitulo: "% del ingreso de programas; incluye JCF, una barra por año", fuente: "Fuente: INEGI (ENIGH)"}));
```

## Desglose de programas por decil (Hogares con beca, 3 años)

```js
const dgd = desgDecil.map((d) => ({...d, x: String(d.decil), año: String(d.año)}));
display(barrasApiladas(dgd, {x: "x", serie: "programa", valor: "pct", crudoKey: "monto_exp",
   dominioX: deciles, faceta: "año", subtitulo: "cada decil suma 100% del ingreso de programas, un panel por año", fuente: "Fuente: INEGI (ENIGH)"}));
```

## Coincidencia con otros programas (Hogares con beca)

```js
display(barras(c9.map((d) => ({año: String(d.año), pct: d.pct_con_otro})), {x: "año", y: "pct",
  subtitulo: "% de hogares con beca que reciben otro programa (P101-P107)", fuente: "Fuente: INEGI (ENIGH)"}));
```

## Peso de la beca en el ingreso del hogar (Hogares con beca, 3 años)

```js
const totCajAño = new Map();
for (const d of cajitas) totCajAño.set(d.año, (totCajAño.get(d.año) ?? 0) + d.n);
const cajFilas = cajitas.map((d) => ({año: String(d.año), caja: String(d.caja), hog: d.n,
  pct: totCajAño.get(d.año) ? d.n / totCajAño.get(d.año) * 100 : 0}));
display(barrasFacetadas(cajFilas, {x: "caja", y: "pct", faceta: "año", crudoKey: "hog",
  titulo: "Peso de la beca en el ingreso del hogar (Hogares con beca)",
  subtitulo: "% de hogares por intervalo (0-100 en cajas de 10), un panel por año", fuente: "Fuente: INEGI (ENIGH)"}));
```

## Ingreso per capita comparado (Hogares candidatos, 3 años)

```js
const pcFilas = percap.map((d) => ({año: String(d.año), grupo: d.grupo, ing: d.ing_pc_real_prom, hog: d.hogares}));
display(barrasFacetadas(pcFilas, {x: "grupo", y: "ing", faceta: "año", formato: "entero", crudoKey: "hog",
  titulo: "Ingreso per capita comparado (Hogares candidatos)",
  subtitulo: "Pesos de 2024: con beca vs candidato sin beca, un panel por año", fuente: "Fuente: INEGI (ENIGH)"}));
```
