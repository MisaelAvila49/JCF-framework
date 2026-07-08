# ENIGH JCF — Estatal

Fuente: INEGI, ENIGH. Advertencia: la muestra de hogares con la beca por entidad
es muy chica; el detalle es solo referencia, no es estadisticamente confiable.

```js
import {filtrarDatos} from "../components/filtros.js";
import {barrasH} from "../components/graficas.js";
const entidad = FileAttachment("../data/enigh_c5_entidad.csv").csv({typed: true});
const cruces = FileAttachment("../data/padron_cruces.csv").csv({typed: true});
```

```js
// Catalogo cve_ent -> nombre_ent, de padron_cruces (unico por entidad).
const nombrePorEnt = new Map(cruces.map((d) => [String(d.cve_ent).padStart(2, "0"), d.nombre_ent]));
```

## Filtro

```js
const nombreEnt = view(Inputs.text({label: "Estado contiene", placeholder: "ej. Jalisco"}));
```

## Distribucion de hogares con la beca por entidad (Hogares con un integrante con beca, año reciente)

```js
const añoMax = Math.max(...entidad.map((d) => d.año));
let delAño = entidad.filter((d) => d.año === añoMax)
  .map((d) => ({...d, nombre_ent: nombrePorEnt.get(String(d.cve_ent).padStart(2, "0")) ?? String(d.cve_ent)}));
delAño = filtrarDatos(delAño, {nombreEnt});
const tot = delAño.reduce((s, d) => s + d.con_jcf, 0);
const filas = delAño.map((d) => ({nombre_ent: d.nombre_ent, pct: tot ? d.con_jcf / tot * 100 : 0}));
display(barrasH(filas, {x: "pct", y: "nombre_ent",
  titulo: `Distribucion por entidad (Hogares con un integrante con beca, ${añoMax})`,
  subtitulo: "% de los hogares con beca (muestra chica)", fuente: "Fuente: INEGI (ENIGH)"}));
```
