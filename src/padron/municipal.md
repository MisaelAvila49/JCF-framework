# Padron JCF — Municipal

```js
import {conTasa} from "../components/agregar.js";
import {dispersion} from "../components/graficas.js";
const cruces = FileAttachment("../data/padron_cruces.csv").csv({typed: true});
```

## Cobertura vs pobreza (Candidatos, municipal)

Cada punto es un municipio en el año mas reciente: su tasa de cobertura frente al
porcentaje de pobreza.

```js
const añoMax = Math.max(...cruces.map((d) => d.año));
const delAño = conTasa(cruces.filter((d) => d.año === añoMax))
  .filter((d) => d.tasa != null && d.pct_pobreza != null);
display(dispersion(delAño, {x: "pct_pobreza", y: "tasa",
                            titulo: `Cobertura vs pobreza (${añoMax})`}));
```

## Cobertura vs marginacion (Candidatos, municipal)

```js
const conMarg = delAño.filter((d) => d.indice_marginacion != null);
display(dispersion(conMarg, {x: "indice_marginacion", y: "tasa",
                             titulo: `Cobertura vs marginacion (${añoMax})`}));
```
