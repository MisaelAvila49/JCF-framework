# Padron JCF — Nacional

```js
import {agrupar, conTasa} from "../components/agregar.js";
import {filtrarDatos} from "../components/filtros.js";
import {barras} from "../components/graficas.js";
const padron = FileAttachment("../data/padron_agregado.csv").csv({typed: true});
```

## Filtros

```js
const usarEdadSexo = view(Inputs.toggle({label: "Filtrar por edad y sexo", value: false}));
```

```js
// Los controles de edad y sexo solo se muestran si el checkbox esta activo.
const edadMin = usarEdadSexo
  ? view(Inputs.range([18, 29], {step: 1, value: 18, label: "Edad minima"}))
  : 18;
```

```js
const edadMax = usarEdadSexo
  ? view(Inputs.range([18, 29], {step: 1, value: 29, label: "Edad maxima"}))
  : 29;
```

```js
const sexo = usarEdadSexo
  ? view(Inputs.select(["Todos", "FEMENINO", "MASCULINO"], {label: "Sexo"}))
  : "Todos";
```

```js
const filtrado = filtrarDatos(padron, {usarEdadSexo, edadMin, edadMax, sexo});
```

## Cobertura por año (Candidatos, nacional)

```js
display(barras(conTasa(agrupar(filtrado, ["año"])),
               {x: "año", y: "tasa", titulo: "Tasa de cobertura por año"}));
```

## Beneficiarios por año (Beneficiarios, nacional)

```js
display(barras(agrupar(filtrado, ["año"]),
               {x: "año", y: "beneficiarios", formato: "entero",
                titulo: "Beneficiarios por año"}));
```
