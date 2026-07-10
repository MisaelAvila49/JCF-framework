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
  dispersion,
  heatmapAño,
  maxProp,
} from "./components/graficas.js"
import { mapaEntidades as mapaEnt } from "./components/mapa.js"
const escJefe = FileAttachment("./data/enigh_escolaridad_jefe.csv").csv({
  typed: true,
})
const NIVELES = ["Sin escolaridad", "Primaria", "Secundaria", "Media superior", "Superior", "Posgrado"]
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
// Años disponibles en la ENIGH (para el filtro por año del controlPanel).
const aniosEnigh = [...new Set(cobE.map((d) => String(d.año)))].sort((a, b) => +a - +b)
// Elige el dataset segun nivel: si estatal con estado, filtra el _estatal por cve.
// Ademas filtra por año si el panel fijo uno (est.anio).
function pick(est, nac, estatal) {
  let d = est.nivel === "estatal" && est.cveEnt
    ? estatal.filter((x) => String(x.cve_ent).padStart(2, "0") === est.cveEnt)
    : nac
  if (est.anio) d = d.filter((x) => String(x.año) === est.anio)
  return d
}
function etiqueta(est) {
  const geo = est.nivel === "estatal" && est.cveEnt
    ? " - " + (nombrePorCve.get(est.cveEnt) ?? "")
    : " - Nacional"
  return geo + (est.anio ? ` (${est.anio})` : "")
}
// Mapa (año fijo) o heatmap estados x año (todos): reutiliza el patron del padron.
// porAño: Map año -> (Map cve -> valor). resalta el estado elegido.
function mapaOHeat(porAño, geo, est, { subtitulo = "", fuente = "", etiquetaValor = "valor", titulo = "" } = {}) {
  const resaltar = est.nivel === "estatal" && est.cveEnt ? est.cveEnt : null
  if (est.anio) {
    const valores = porAño.get(est.anio) ?? porAño.get(+est.anio) ?? new Map()
    return mapaEnt(geo, valores, { titulo, subtitulo: `${subtitulo} (${est.anio})`,
      fuente, nombrePorCve, formato: "pct", etiquetaValor, resaltarCve: resaltar })
  }
  const puntos = []
  for (const [año, m] of porAño)
    for (const [cve, v] of m)
      puntos.push({ año: String(año), cve, nombre: nombrePorCve.get(cve) ?? cve, valor: v })
  return heatmapAño(puntos, { titulo, subtitulo, fuente, resaltarCve: resaltar,
    formato: "pct", etiquetaValor })
}
```

## Cobertura por año (Hogares con un integrante candidato)

```js
const v1 = view(
  controlPanel({ catEnt, niveles: ["Nacional", "Estatal"], desagrega: false, anios: aniosEnigh })
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

## Cobertura por entidad

Todos los años: heatmap de entidades (filas) por año (columnas). Al fijar un año en
el panel se muestra el mapa geografico de ese año.

```js
const mapaCobV = view(
  controlPanel({ catEnt, niveles: ["Nacional", "Estatal"], desagrega: false, anios: aniosEnigh })
)
```

```js
{
  const est = resolverEstado(mapaCobV, { catEnt, catMun: [] })
  const porAño = new Map()
  for (const d of cobE) {
    const cve = String(d.cve_ent).padStart(2, "0")
    const a = String(d.año)
    if (!porAño.has(a)) porAño.set(a, new Map())
    porAño.get(a).set(cve, +d.pct_con_jcf)
  }
  display(
    mapaOHeat(porAño, await geoEnt, est, {
      titulo: "Cobertura por entidad",
      subtitulo: "% de hogares con candidato que reciben la beca",
      fuente: "Fuente: INEGI (ENIGH)",
      etiquetaValor: "cobertura",
    })
  )
}
```

## Cobertura por decil

```js
const v2 = view(
  controlPanel({ catEnt, niveles: ["Nacional", "Estatal"], desagrega: false, anios: aniosEnigh })
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
  controlPanel({ catEnt, niveles: ["Nacional", "Estatal"], desagrega: false, anios: aniosEnigh })
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
  controlPanel({ catEnt, niveles: ["Nacional", "Estatal"], desagrega: false, anios: aniosEnigh })
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
  controlPanel({ catEnt, niveles: ["Nacional", "Estatal"], desagrega: false, anios: aniosEnigh })
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
  controlPanel({ catEnt, niveles: ["Nacional", "Estatal"], desagrega: false, anios: aniosEnigh })
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

## Escolaridad del jefe del hogar

```js
{
  const totAño = new Map()
  for (const d of escJefe) totAño.set(d.año, (totAño.get(d.año) ?? 0) + (+d.hogares || 0))
  const filas = escJefe.map((d) => ({
    año: String(d.año),
    nivel: d.nivel,
    pct: totAño.get(d.año) ? (+d.hogares || 0) / totAño.get(d.año) * 100 : 0,
    hog: +d.hogares || 0,
  }))
  display(
    barrasFacetadas(filas, {
      x: "nivel",
      y: "pct",
      faceta: "año",
      dominioX: NIVELES,
      crudoKey: "hog",
      titulo: "Escolaridad del jefe del hogar",
      subtitulo: "% de hogares con beca por nivel del jefe, un panel por año",
      fuente: "Fuente: INEGI (ENIGH)",
    })
  )
}
```

## Pobreza vs escolaridad del jefe

```js
{
  const alto = new Set(["Media superior", "Superior", "Posgrado"])
  const porEntAño = new Map()
  for (const d of escJefe) {
    const cve = String(d.cve_ent).padStart(2, "0")
    const k = d.año + "|" + cve
    if (!porEntAño.has(k)) porEntAño.set(k, { año: String(d.año), cve, altos: 0, tot: 0 })
    const a = porEntAño.get(k)
    a.tot += +d.hogares || 0
    if (alto.has(d.nivel)) a.altos += +d.hogares || 0
  }
  const pobEnt = new Map()
  for (const d of cruces) {
    if (d.pct_pobreza === "" || d.pct_pobreza == null) continue
    const cve = String(d.cve_ent).padStart(2, "0")
    const k = d.año + "|" + cve
    if (!pobEnt.has(k)) pobEnt.set(k, { s: 0, n: 0 })
    const a = pobEnt.get(k)
    a.s += +d.pct_pobreza
    a.n += 1
  }
  const pts = [...porEntAño.values()]
    .filter((d) => d.tot > 0)
    .map((d) => {
      const p = pobEnt.get(d.año + "|" + d.cve)
      return { año: d.año, x: p ? p.s / p.n : null, valor: (d.altos / d.tot) * 100, universo: d.tot, nombre: nombrePorCve.get(d.cve) ?? d.cve }
    })
    .filter((d) => d.x != null)
  display(
    dispersion(pts, {
      x: "x",
      y: "valor",
      faceta: "año",
      etiquetaKey: "nombre",
      rKey: "universo",
      titulo: "Pobreza vs escolaridad del jefe",
      subtitulo: "Cada punto es una entidad; y = % jefes con media superior o mas",
      fuente: "Fuente: INEGI (ENIGH) / CONEVAL",
    })
  )
}
```

## Marginacion vs escolaridad del jefe

```js
{
  const alto = new Set(["Media superior", "Superior", "Posgrado"])
  const porEntAño = new Map()
  for (const d of escJefe) {
    const cve = String(d.cve_ent).padStart(2, "0")
    const k = d.año + "|" + cve
    if (!porEntAño.has(k)) porEntAño.set(k, { año: String(d.año), cve, altos: 0, tot: 0 })
    const a = porEntAño.get(k)
    a.tot += +d.hogares || 0
    if (alto.has(d.nivel)) a.altos += +d.hogares || 0
  }
  const marEnt = new Map()
  for (const d of cruces) {
    if (d.indice_marginacion === "" || d.indice_marginacion == null) continue
    const cve = String(d.cve_ent).padStart(2, "0")
    const k = d.año + "|" + cve
    if (!marEnt.has(k)) marEnt.set(k, { s: 0, n: 0 })
    const a = marEnt.get(k)
    a.s += +d.indice_marginacion
    a.n += 1
  }
  const pts = [...porEntAño.values()]
    .filter((d) => d.tot > 0)
    .map((d) => {
      const p = marEnt.get(d.año + "|" + d.cve)
      return { año: d.año, x: p ? p.s / p.n : null, valor: (d.altos / d.tot) * 100, universo: d.tot, nombre: nombrePorCve.get(d.cve) ?? d.cve }
    })
    .filter((d) => d.x != null)
  display(
    dispersion(pts, {
      x: "x",
      y: "valor",
      faceta: "año",
      etiquetaKey: "nombre",
      rKey: "universo",
      titulo: "Marginacion vs escolaridad del jefe",
      subtitulo: "Cada punto es una entidad; y = % jefes con media superior o mas",
      fuente: "Fuente: INEGI (ENIGH) / CONAPO",
    })
  )
}
```
