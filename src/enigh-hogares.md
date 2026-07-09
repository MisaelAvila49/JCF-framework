# ENIGH Hogares

Fuente: INEGI, ENIGH (2020, 2022, 2024). Analisis de los hogares con integrante
con beca. Nivel Nacional o Estatal (la muestra no permite municipal). No se
desagrega por edad/sexo (es analisis de hogar). Todos los años se muestran juntos.

```js
import { controlPanel, resolverEstado } from "./components/controlPanel.js"
import {
  barras,
  barrasApiladas,
  barrasFacetadas,
  barrasH,
  maxProp,
} from "./components/graficas.js"
import { mapaEntidades as mapaEnt } from "./components/mapa.js"
const cobN = FileAttachment("./data/enigh_c1_cobertura.csv").csv({
  typed: true,
})
const cobE = FileAttachment("./data/enigh_c1_cobertura_estatal.csv").csv({
  typed: true,
})
const decN = FileAttachment("./data/enigh_c3c4_decil.csv").csv({ typed: true })
const decE = FileAttachment("./data/enigh_c3c4_decil_estatal.csv").csv({
  typed: true,
})
const compN = FileAttachment("./data/enigh_composicion_ingreso.csv").csv({
  typed: true,
})
const compE = FileAttachment(
  "./data/enigh_composicion_ingreso_estatal.csv"
).csv({ typed: true })
const compSinN = FileAttachment("./data/enigh_composicion_sin_beca.csv").csv({
  typed: true,
})
const compDecN = FileAttachment("./data/enigh_composicion_por_decil.csv").csv({
  typed: true,
})
const compSinDecN = FileAttachment(
  "./data/enigh_composicion_sin_beca_por_decil.csv"
).csv({ typed: true })
const desgN = FileAttachment("./data/enigh_desglose_programas.csv").csv({
  typed: true,
})
const desgDecN = FileAttachment(
  "./data/enigh_desglose_programas_por_decil.csv"
).csv({ typed: true })
const c9 = FileAttachment("./data/enigh_c9_otro_programa.csv").csv({
  typed: true,
})
const cajN = FileAttachment("./data/enigh_c10_cajitas.csv").csv({ typed: true })
const cajE = FileAttachment("./data/enigh_c10_cajitas_estatal.csv").csv({
  typed: true,
})
const pcN = FileAttachment("./data/enigh_ingreso_percapita.csv").csv({
  typed: true,
})
const pcE = FileAttachment("./data/enigh_ingreso_percapita_estatal.csv").csv({
  typed: true,
})
const cruces = FileAttachment("./data/padron_cruces.csv").csv({ typed: true })
const geoEnt = FileAttachment("./data/mx_entidades.json").json()
```

```js
const catEnt = Array.from(
  new Map(
    cruces.map((d) => [String(d.cve_ent).padStart(2, "0"), d.nombre_ent])
  ).entries()
).map(([cve, nombre]) => ({ cve, nombre }))
const nombrePorCve = new Map(catEnt.map((e) => [e.cve, e.nombre]))
const deciles = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]
// Elige el dataset segun nivel: si estatal con estado, filtra el _estatal por cve.
function pick(est, nac, estatal) {
  if (est.nivel === "estatal" && est.cveEnt) {
    return estatal.filter(
      (d) => String(d.cve_ent).padStart(2, "0") === est.cveEnt
    )
  }
  return nac
}
function etiqueta(est) {
  return est.nivel === "estatal" && est.cveEnt
    ? " - " + (nombrePorCve.get(est.cveEnt) ?? "")
    : " - Nacional"
}
```

## Cobertura por año (Hogares con un integrante candidato)

```js
const v1 = view(
  controlPanel({ catEnt, niveles: ["Nacional", "Estatal"], desagrega: false })
)
```

```js
{
  const est = resolverEstado(v1, { catEnt, catMun: [] })
  const d = pick(est, cobN, cobE)
  display(
    barras(
      d.map((x) => ({
        año: String(x.año),
        pct: x.pct_con_jcf,
        hog: x.con_jcf,
      })),
      {
        x: "año",
        y: "pct",
        crudoKey: "hog",
        titulo: "Cobertura por año" + etiqueta(est),
        subtitulo: "% de hogares con candidato que reciben la beca",
        fuente: "Fuente: INEGI (ENIGH)",
      }
    )
  )
}
```

## Mapa de cobertura por entidad (año reciente)

```js
{
  const añoM = maxProp(cobE, "año")
  const valores = new Map(
    cobE
      .filter((d) => d.año === añoM)
      .map((d) => [String(d.cve_ent).padStart(2, "0"), +d.pct_con_jcf])
  )
  display(
    mapaEnt(await geoEnt, valores, {
      subtitulo: `% de hogares con candidato con beca (${añoM})`,
      fuente: "Fuente: INEGI (ENIGH)",
      nombrePorCve,
      formato: "pct",
      etiquetaValor: "cobertura",
    })
  )
}
```

## Cobertura por decil

```js
const v2 = view(
  controlPanel({ catEnt, niveles: ["Nacional", "Estatal"], desagrega: false })
)
```

```js
{
  const est = resolverEstado(v2, { catEnt, catMun: [] })
  const d = pick(est, decN, decE)
  const filas = d
    .map((x) => ({
      año: String(x.año),
      decil: String(x.decil),
      pct: +x.tasa_decil * 100,
      hog: x.con_jcf,
    }))
    .sort((a, b) => +a.decil - +b.decil)
  display(
    barrasFacetadas(filas, {
      x: "decil",
      y: "pct",
      faceta: "año",
      crudoKey: "hog",
      dominioX: deciles,
      titulo: "Cobertura por decil" + etiqueta(est),
      subtitulo: "% de candidatos con beca por decil, un panel por año",
      fuente: "Fuente: INEGI (ENIGH)",
    })
  )
}
```

## Reparto de la beca por decil

```js
const v3 = view(
  controlPanel({ catEnt, niveles: ["Nacional", "Estatal"], desagrega: false })
)
```

```js
{
  const est = resolverEstado(v3, { catEnt, catMun: [] })
  const d = pick(est, decN, decE)
  const filas = d
    .map((x) => ({
      año: String(x.año),
      decil: String(x.decil),
      pct: +x.reparto_jcf * 100,
      hog: x.con_jcf,
    }))
    .sort((a, b) => +a.decil - +b.decil)
  display(
    barrasFacetadas(filas, {
      x: "decil",
      y: "pct",
      faceta: "año",
      crudoKey: "hog",
      dominioX: deciles,
      titulo: "Reparto de la beca por decil" + etiqueta(est),
      subtitulo: "% de los hogares con beca en cada decil, un panel por año",
      fuente: "Fuente: INEGI (ENIGH)",
    })
  )
}
```

## Composicion del ingreso: con beca

```js
const v4 = view(
  controlPanel({ catEnt, niveles: ["Nacional", "Estatal"], desagrega: false })
)
```

```js
{
  const est = resolverEstado(v4, { catEnt, catMun: [] })
  const d = pick(est, compN, compE)
  display(
    barrasApiladas(
      d.map((x) => ({ ...x, x: String(x.año) })),
      {
        x: "x",
        serie: "macrotema",
        valor: "pct",
        crudoKey: "monto_exp",
        titulo: "Composicion del ingreso: con beca" + etiqueta(est),
        subtitulo: "% del ingreso total, una barra por año",
        fuente: "Fuente: INEGI (ENIGH)",
      }
    )
  )
}
```

## Composicion del ingreso: candidatos sin beca

```js
display(
  barrasApiladas(
    compSinN.map((x) => ({ ...x, x: String(x.año) })),
    {
      x: "x",
      serie: "macrotema",
      valor: "pct",
      crudoKey: "monto_exp",
      titulo: "Composicion del ingreso: candidatos sin beca",
      subtitulo: "% del ingreso total, una barra por año (nacional)",
      fuente: "Fuente: INEGI (ENIGH)",
    }
  )
)
```

## Composicion del ingreso por decil: con beca

```js
display(
  barrasApiladas(
    compDecN.map((x) => ({ ...x, x: String(x.decil), año: String(x.año) })),
    {
      x: "x",
      serie: "macrotema",
      valor: "pct",
      crudoKey: "monto_exp",
      dominioX: deciles,
      faceta: "año",
      titulo: "Composicion por decil: con beca",
      subtitulo: "cada decil suma 100%, un panel por año (nacional)",
      fuente: "Fuente: INEGI (ENIGH)",
    }
  )
)
```

## Composicion del ingreso por decil: candidatos sin beca

```js
display(
  barrasApiladas(
    compSinDecN.map((x) => ({ ...x, x: String(x.decil), año: String(x.año) })),
    {
      x: "x",
      serie: "macrotema",
      valor: "pct",
      crudoKey: "monto_exp",
      dominioX: deciles,
      faceta: "año",
      titulo: "Composicion por decil: candidatos sin beca",
      subtitulo: "cada decil suma 100%, un panel por año (nacional)",
      fuente: "Fuente: INEGI (ENIGH)",
    }
  )
)
```

## Coincidencia con otros programas

```js
display(
  barras(
    c9.map((x) => ({ año: String(x.año), pct: x.pct_con_otro })),
    {
      x: "año",
      y: "pct",
      titulo: "Coincidencia con otros programas",
      subtitulo: "% de hogares con beca que reciben otro programa (P101-P107)",
      fuente: "Fuente: INEGI (ENIGH)",
    }
  )
)
```

## Desglose dentro de programas sociales y becas: hogares con beca jcf

```js
display(
  barrasApiladas(
    desgN.map((x) => ({ ...x, x: String(x.año) })),
    {
      x: "x",
      serie: "programa",
      valor: "pct",
      crudoKey: "monto_exp",
      titulo: "Desglose de programas sociales y becas",
      subtitulo: "% del ingreso de programas; incluye JCF (nacional)",
      fuente: "Fuente: INEGI (ENIGH)",
    }
  )
)
```

## Desglose de programas por decil: hogares con beca jcf

```js
display(
  barrasApiladas(
    desgDecN.map((x) => ({ ...x, x: String(x.decil), año: String(x.año) })),
    {
      x: "x",
      serie: "programa",
      valor: "pct",
      crudoKey: "monto_exp",
      dominioX: deciles,
      faceta: "año",
      titulo: "Desglose de programas por decil",
      subtitulo: "cada decil suma 100% del ingreso de programas (nacional)",
      fuente: "Fuente: INEGI (ENIGH)",
    }
  )
)
```

## Peso de la beca en el ingreso del hogar

```js
const v5 = view(
  controlPanel({ catEnt, niveles: ["Nacional", "Estatal"], desagrega: false })
)
```

```js
{
  const est = resolverEstado(v5, { catEnt, catMun: [] })
  const d = pick(est, cajN, cajE)
  const totAño = new Map()
  for (const x of d) totAño.set(x.año, (totAño.get(x.año) ?? 0) + x.n)
  const filas = d.map((x) => ({
    año: String(x.año),
    caja: String(x.caja),
    hog: x.n,
    pct: totAño.get(x.año) ? (x.n / totAño.get(x.año)) * 100 : 0,
  }))
  display(
    barrasFacetadas(filas, {
      x: "caja",
      y: "pct",
      faceta: "año",
      crudoKey: "hog",
      titulo: "Peso de la beca en el ingreso del hogar" + etiqueta(est),
      subtitulo:
        "% de hogares por intervalo (0-100 en cajas de 10), un panel por año",
      fuente: "Fuente: INEGI (ENIGH)",
    })
  )
}
```

## Ingreso per capita comparado

```js
const v6 = view(
  controlPanel({ catEnt, niveles: ["Nacional", "Estatal"], desagrega: false })
)
```

```js
{
  const est = resolverEstado(v6, { catEnt, catMun: [] })
  const d = pick(est, pcN, pcE)
  display(
    barrasFacetadas(
      d.map((x) => ({
        año: String(x.año),
        grupo: x.grupo,
        ing: x.ing_pc_real_prom,
        hog: x.hogares,
      })),
      {
        x: "grupo",
        y: "ing",
        faceta: "año",
        formato: "entero",
        crudoKey: "hog",
        titulo: "Ingreso per capita comparado" + etiqueta(est),
        subtitulo:
          "Pesos de 2024: con beca vs candidato sin beca, un panel por año",
        fuente: "Fuente: INEGI (ENIGH)",
      }
    )
  )
}
```
