# Tablero de analisis de la beca Jovenes Construyendo el Futuro

Este tablero reune los analisis de la beca JCF a partir del padron de
beneficiarios y de la ENIGH. Usa el menu para navegar por nivel geografico.

Limitaciones: la edad y el sexo del padron existen desde 2021; los candidatos
provienen del censo 2020 (proyeccion para los demas años); la ENIGH es una
muestra.

```js
import {barras} from "./components/graficas.js";
const padron = FileAttachment("./data/padron_resumen_dedup.csv").csv({typed: true});
const enigh = FileAttachment("./data/enigh_jcf_conteo.csv").csv({typed: true});
```

## Personas con la beca segun el padron (registro real)

Personas distintas con la beca cada año, deduplicadas del padron (registro
administrativo, conteo real).

```js
const padronFilas = padron.map((d) => ({año: String(d.año), personas: d.unicos}));
display(barras(padronFilas, {x: "año", y: "personas", formato: "entero", crudoKey: "personas",
  subtitulo: "Personas unicas por año", fuente: "Fuente: STPS"}));
```

## Personas con la beca segun la ENIGH (muestra expandida)

Personas que reportan ingreso de la beca, expandidas por factor. No coincide con
el padron por construccion: la ENIGH es una muestra que estima quien reporta el
ingreso.

```js
const enighFilas = enigh.map((d) => ({año: String(d.año), personas: d.personas_expandido}));
display(barras(enighFilas, {x: "año", y: "personas", formato: "entero", crudoKey: "personas",
  subtitulo: "Personas expandidas por año", fuente: "Fuente: INEGI (ENIGH)"}));
```
