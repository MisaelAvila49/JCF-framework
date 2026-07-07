# Padron JCF — Nacional

```js
import {agrupar, conTasa, conEdadSexo} from "../components/agregar.js";
import {barras, lineas} from "../components/graficas.js";
const padron = FileAttachment("../data/padron_agregado.csv").csv({typed: true});
```

## Cobertura por año (Candidatos, nacional)

Beneficiarios entre candidatos, por año.

```js
const cobAño = conTasa(agrupar(padron, ["año"]));
display(barras(cobAño, {x: "año", y: "tasa", titulo: "Tasa de cobertura por año"}));
```

## Beneficiarios por año (Beneficiarios, nacional)

```js
const benAño = agrupar(padron, ["año"]);
display(barras(benAño, {x: "año", y: "beneficiarios", formato: "entero",
                        titulo: "Beneficiarios por año"}));
```

## Cobertura por edad (Candidatos, nacional, 2021+)

De 2021 en adelante, donde el padron trae edad.

```js
const porEdad = conTasa(agrupar(conEdadSexo(padron), ["edad"]));
display(barras(porEdad.sort((a, b) => a.edad - b.edad),
               {x: "edad", y: "tasa", titulo: "Cobertura por edad"}));
```
