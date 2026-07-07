# ENIGH JCF — Nacional

```js
import {barras, barrasApiladas} from "../components/graficas.js";
const cajitas = FileAttachment("../data/enigh_c10_cajitas.csv").csv({typed: true});
const compBeca = FileAttachment("../data/enigh_composicion_ingreso.csv").csv({typed: true});
const compSin = FileAttachment("../data/enigh_composicion_sin_beca.csv").csv({typed: true});
const persSexo = FileAttachment("../data/enigh_personas_sexo.csv").csv({typed: true});
```

## Personas con la beca por sexo (Personas con beca)

Distribucion de personas con la beca por sexo, año mas reciente, expandida por
factor.

```js
const añoP = Math.max(...persSexo.map((d) => d.año));
const conBeca = persSexo.filter((d) => d.año === añoP && d.universo === "tiene_jcf");
const totP = conBeca.reduce((s, d) => s + d.personas, 0);
const pctP = conBeca.map((d) => ({...d, pct: totP ? d.personas / totP * 100 : 0}));
display(barras(pctP, {x: "sexo_etiqueta", y: "pct",
                      titulo: `Personas con la beca por sexo (${añoP})`}));
```

## Peso de la beca en el ingreso (Hogares con integrante con beca)

Distribucion del ratio ingreso de la beca / ingreso del hogar, cajas de 10 en 10,
año mas reciente. No se filtra por edad/sexo (es un analisis de hogar).

```js
const añoMax = Math.max(...cajitas.map((d) => d.año));
const cajAño = cajitas.filter((d) => d.año === añoMax);
const totCaj = cajAño.reduce((s, d) => s + d.n, 0);
const cajPct = cajAño.map((d) => ({...d, pct: totCaj ? d.n / totCaj * 100 : 0}));
display(barras(cajPct, {x: "caja", y: "pct",
                        titulo: `Peso de la beca en el ingreso (${añoMax})`}));
```

## Composicion del ingreso: con beca (Hogares con integrante con beca)

```js
const cb = compBeca.filter((d) => d.año === Math.max(...compBeca.map((x) => x.año)));
display(barrasApiladas(cb.map((d) => ({...d, x: "con beca"})),
        {x: "x", serie: "macrotema", valor: "pct",
         titulo: "Composicion del ingreso (con beca)"}));
```

## Composicion del ingreso: candidatos sin beca (Hogares con integrante candidato)

```js
const cs = compSin.filter((d) => d.año === Math.max(...compSin.map((x) => x.año)));
display(barrasApiladas(cs.map((d) => ({...d, x: "sin beca"})),
        {x: "x", serie: "macrotema", valor: "pct",
         titulo: "Composicion del ingreso (sin beca)"}));
```
