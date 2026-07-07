# Tablero de analisis de la beca Jovenes Construyendo el Futuro

Este tablero reune los analisis de la beca JCF a partir del padron de
beneficiarios y de la ENIGH. Usa el menu para navegar por nivel geografico.

Limitaciones: la edad y el sexo del padron existen desde 2021; los candidatos
provienen del censo 2020; la ENIGH es una muestra.

## Numeralia: cobertura segun padron vs ENIGH (total de personas)

Personas con la beca segun el padron (registro real) y segun la ENIGH (muestra
expandida). No son iguales por construccion: el padron cuenta altas del año; la
ENIGH estima quien reporta el ingreso de la beca.

```js
import * as Plot from "npm:@observablehq/plot";
const padron = FileAttachment("./data/padron_resumen_dedup.csv").csv({typed: true});
const enigh = FileAttachment("./data/enigh_jcf_conteo.csv").csv({typed: true});
```

```js
// Une padron (unicos) y ENIGH (expandido) por año.
const porAño = padron
  .map((p) => {
    const e = enigh.find((x) => x.año === p.año);
    return {año: p.año, padron: p.unicos, enigh: e ? e.personas_expandido : null};
  })
  .filter((d) => d.enigh != null);
```

```js
display(Plot.plot({
  title: "Personas con la beca: padron vs ENIGH",
  marginBottom: 40,
  color: {legend: true},
  x: {label: "año"},
  y: {label: "personas", grid: true},
  marks: [
    Plot.barY(porAño.flatMap((d) => [
      {año: d.año, fuente: "padron", personas: d.padron},
      {año: d.año, fuente: "ENIGH", personas: d.enigh},
    ]), {x: "fuente", y: "personas", fill: "fuente", fx: "año"}),
    Plot.ruleY([0]),
  ],
}));
```
