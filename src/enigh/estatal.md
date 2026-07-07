# ENIGH JCF — Estatal

La muestra de hogares con la beca es chica: el detalle por entidad es solo
referencia, no es estadisticamente confiable.

```js
import {barras} from "../components/graficas.js";
const entidad = FileAttachment("../data/enigh_c5_entidad.csv").csv({typed: true});
```

## Hogares con la beca por entidad (Hogares con integrante con beca)

Distribucion (porcentaje del total del año mas reciente).

```js
const añoMax = Math.max(...entidad.map((d) => d.año));
const delAño = entidad.filter((d) => d.año === añoMax);
const tot = delAño.reduce((s, d) => s + d.con_jcf, 0);
const pct = delAño.map((d) => ({...d, pct: tot ? d.con_jcf / tot * 100 : 0}))
  .sort((a, b) => b.pct - a.pct);
display(barras(pct, {x: "cve_ent", y: "pct",
                     titulo: `Distribucion por entidad (${añoMax})`}));
```
