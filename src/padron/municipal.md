# Padron JCF — Municipal

```js
import {agrupar, conTasa} from "../components/agregar.js";
import {filtrarDatos} from "../components/filtros.js";
import {barrasH, dispersion} from "../components/graficas.js";
const padron = FileAttachment("../data/padron_agregado.csv").csv({typed: true});
const cruces = FileAttachment("../data/padron_cruces.csv").csv({typed: true});
```

## Filtros

```js
const nombreEnt = view(Inputs.text({label: "Estado contiene", placeholder: "ej. Ciudad de Mexico"}));
```
```js
const nombreMun = view(Inputs.text({label: "Municipio contiene", placeholder: "ej. Coyoacan"}));
```
```js
const padronF = filtrarDatos(padron, {nombreEnt, nombreMun});
```

## Cobertura por municipio (Candidatos, municipal, año reciente)

```js
const añoMax = Math.max(...padronF.map((d) => d.año));
const porMun = conTasa(agrupar(padronF.filter((d) => d.año === añoMax), ["cve_mun", "nombre_mun"]))
  .filter((d) => d.nombre_mun != null && d.nombre_mun !== "" && d.tasa != null)
  .sort((a, b) => b.tasa - a.tasa)
  .slice(0, 25)
  .map((d) => ({nombre_mun: d.nombre_mun, tasa: d.tasa}));
display(barrasH(porMun, {x: "tasa", y: "nombre_mun",
  titulo: `Cobertura por municipio (Candidatos, municipal, ${añoMax})`,
  subtitulo: "% de candidatos con beca (top 25 del filtro)", fuente: "Fuente: STPS"}));
```

## Perfil por sexo del municipio (Beneficiarios, municipal, año reciente)

```js
const añoS = Math.max(...padronF.map((d) => d.año));
const sxm = padronF.filter((d) => d.año === añoS && d.sexo !== "" && d.sexo != null
  && d.nombre_mun != null && d.nombre_mun !== "");
const porMunSexo = new Map();
for (const d of sxm) {
  const k = d.nombre_mun + "||" + d.sexo;
  porMunSexo.set(k, (porMunSexo.get(k) ?? 0) + (+d.beneficiarios || 0));
}
const totMun = new Map();
for (const [k, v] of porMunSexo) {
  const mun = k.split("||")[0];
  totMun.set(mun, (totMun.get(mun) ?? 0) + v);
}
const pctMuj = [...totMun.keys()].map((mun) => {
  const fem = porMunSexo.get(mun + "||FEMENINO") ?? 0;
  return {nombre_mun: mun, pct: totMun.get(mun) ? fem / totMun.get(mun) * 100 : 0};
}).sort((a, b) => b.pct - a.pct).slice(0, 25);
display(barrasH(pctMuj, {x: "pct", y: "nombre_mun",
  titulo: `Porcentaje de mujeres por municipio (Beneficiarios, municipal, ${añoS})`,
  subtitulo: "% de mujeres entre los beneficiarios (top 25 del filtro)", fuente: "Fuente: STPS"}));
```

## Cobertura vs pobreza (Candidatos, municipal, 2020)

Cada punto es un municipio. El filtro de estado/municipio acota los puntos.

```js
const crucesF = filtrarDatos(cruces, {nombreEnt, nombreMun});
const delAño = conTasa(crucesF.filter((d) => d.año === 2020))
  .filter((d) => d.tasa != null && d.pct_pobreza != null);
display(dispersion(delAño, {x: "pct_pobreza", y: "tasa",
  titulo: "Cobertura vs pobreza (Candidatos, municipal, 2020)",
  subtitulo: "Cada punto es un municipio", fuente: "Fuente: STPS / CONEVAL"}));
```

## Cobertura vs marginacion (Candidatos, municipal, 2020)

```js
const conMarg = delAño.filter((d) => d.indice_marginacion != null);
display(dispersion(conMarg, {x: "indice_marginacion", y: "tasa",
  titulo: "Cobertura vs marginacion (Candidatos, municipal, 2020)",
  subtitulo: "Cada punto es un municipio", fuente: "Fuente: STPS / CONAPO"}));
```
