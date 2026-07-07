# Padron JCF — Estatal

```js
import {agrupar, conTasa} from "../components/agregar.js";
import {filtrarDatos} from "../components/filtros.js";
import {barras} from "../components/graficas.js";
const padron = FileAttachment("../data/padron_agregado.csv").csv({typed: true});
```

## Filtros

```js
// Lista de nombres de entidad para el select (autocompletar del navegador).
// El usuario escribe unas letras, elige de la lista, sin errores de tipeo.
const nombresEnt = ["Todos", ...Array.from(
  new Set(padron.map((d) => d.nombre_ent).filter((n) => n != null && n !== ""))
).sort((a, b) => a.localeCompare(b, "es"))];
```

```js
const nombreEnt = view(Inputs.select(nombresEnt, {label: "Estado", value: "Todos"}));
```

```js
const usarEdadSexo = view(Inputs.toggle({label: "Filtrar por edad y sexo", value: false}));
```

```js
const edadMin = usarEdadSexo ? view(Inputs.range([18, 29], {step: 1, value: 18, label: "Edad minima"})) : 18;
```

```js
const edadMax = usarEdadSexo ? view(Inputs.range([18, 29], {step: 1, value: 29, label: "Edad maxima"})) : 29;
```

```js
const sexo = usarEdadSexo ? view(Inputs.select(["Todos", "FEMENINO", "MASCULINO"], {label: "Sexo"})) : "Todos";
```

```js
const filtrado = filtrarDatos(padron, {usarEdadSexo, edadMin, edadMax, sexo, nombreEnt});
```

## Cobertura por entidad (Candidatos, estatal)

Tasa de cobertura por entidad en el año mas reciente (filtrada por lo elegido).

```js
const añoMax = Math.max(...filtrado.map((d) => d.año));
const delAño = filtrado.filter((d) => d.año === añoMax);
const porEnt = conTasa(agrupar(delAño, ["cve_ent", "nombre_ent"]))
  .filter((d) => d.nombre_ent != null && d.nombre_ent !== "")
  .sort((a, b) => b.tasa - a.tasa);
display(barras(porEnt, {x: "nombre_ent", y: "tasa",
                        titulo: `Cobertura por entidad (${añoMax})`}));
```
