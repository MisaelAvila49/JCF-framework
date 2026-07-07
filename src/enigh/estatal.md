# ENIGH JCF — Estatal

La muestra de hogares con la beca es chica: el detalle por entidad es solo
referencia, no es estadisticamente confiable.

```js
import {barras} from "../components/graficas.js";
const entidad = FileAttachment("../data/enigh_c5_entidad.csv").csv({typed: true});
const cruces = FileAttachment("../data/padron_cruces.csv").csv({typed: true});
```

```js
// Catalogo cve_ent -> nombre_ent, tomado de padron_cruces (unico por entidad).
const nombrePorEnt = new Map(cruces.map((d) => [String(d.cve_ent).padStart(2, "0"), d.nombre_ent]));
```

## Filtros

```js
// Nombres de entidad para el select (autocompletar, elige de la lista).
const nombresEnt = ["Todos", ...Array.from(new Set(nombrePorEnt.values()))
  .filter((n) => n != null && n !== "").sort((a, b) => a.localeCompare(b, "es"))];
```

```js
const nombreEnt = view(Inputs.select(nombresEnt, {label: "Estado", value: "Todos"}));
```

## Hogares con la beca por entidad (Hogares con integrante con beca)

Distribucion (porcentaje del total del año mas reciente).

```js
const añoMax = Math.max(...entidad.map((d) => d.año));
let delAño = entidad
  .filter((d) => d.año === añoMax)
  .map((d) => ({...d, nombre_ent: nombrePorEnt.get(String(d.cve_ent).padStart(2, "0")) ?? String(d.cve_ent)}));
if (nombreEnt !== "Todos") delAño = delAño.filter((d) => d.nombre_ent === nombreEnt);
const tot = delAño.reduce((s, d) => s + d.con_jcf, 0);
const pct = delAño.map((d) => ({...d, pct: tot ? d.con_jcf / tot * 100 : 0}))
  .sort((a, b) => b.pct - a.pct);
display(barras(pct, {x: "nombre_ent", y: "pct",
                     titulo: `Distribucion por entidad (${añoMax})`}));
```
