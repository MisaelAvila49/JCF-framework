# Padron JCF — Municipal

```js
import {conTasa} from "../components/agregar.js";
import {filtrarDatos} from "../components/filtros.js";
import {dispersion} from "../components/graficas.js";
const cruces = FileAttachment("../data/padron_cruces.csv").csv({typed: true});
```

## Filtros

```js
// Select de estado con autocompletar (elige de la lista, sin errores de tipeo).
const nombresEnt = ["Todos", ...Array.from(
  new Set(cruces.map((d) => d.nombre_ent).filter((n) => n != null && n !== ""))
).sort((a, b) => a.localeCompare(b, "es"))];
```

```js
const nombreEnt = view(Inputs.select(nombresEnt, {label: "Estado", value: "Todos"}));
```

```js
// El select de municipio se acota al estado elegido: si hay estado, solo los
// municipios de ese estado; si es "Todos", todos los municipios.
const nombresMun = ["Todos", ...Array.from(new Set(
  cruces
    .filter((d) => nombreEnt === "Todos" || d.nombre_ent === nombreEnt)
    .map((d) => d.nombre_mun)
    .filter((n) => n != null && n !== "")
)).sort((a, b) => a.localeCompare(b, "es"))];
```

```js
const nombreMun = view(Inputs.select(nombresMun, {label: "Municipio", value: "Todos"}));
```

```js
const filtrado = filtrarDatos(cruces, {nombreEnt, nombreMun});
```

## Cobertura vs pobreza (Candidatos, municipal)

Cada punto es un municipio en el año mas reciente: su tasa de cobertura frente al
porcentaje de pobreza.

```js
const añoMax = Math.max(...filtrado.map((d) => d.año));
const delAño = conTasa(filtrado.filter((d) => d.año === añoMax))
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
