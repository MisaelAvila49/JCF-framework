# Padron JCF — Estatal

```js
import {agrupar, conTasa} from "../components/agregar.js";
import {barras} from "../components/graficas.js";
const padron = FileAttachment("../data/padron_agregado.csv").csv({typed: true});
```

## Cobertura por entidad (Candidatos, estatal)

Tasa de cobertura por entidad en el año mas reciente.

```js
const añoMax = Math.max(...padron.map((d) => d.año));
const delAño = padron.filter((d) => d.año === añoMax);
const porEnt = conTasa(agrupar(delAño, ["cve_ent", "nombre_ent"]))
  .filter((d) => d.nombre_ent != null && d.nombre_ent !== "")
  .sort((a, b) => b.tasa - a.tasa);
display(barras(porEnt, {x: "nombre_ent", y: "tasa",
                        titulo: `Cobertura por entidad (${añoMax})`}));
```
