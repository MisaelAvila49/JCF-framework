# ENIGH Personas

Fuente: INEGI, ENIGH (2020, 2022, 2024). Perfil de las PERSONAS receptoras de la
beca (identificadas por la ENIGH) y de las personas candidatas. Nivel Nacional o
Estatal, desagregable por edad y sexo del receptor. Muestra chica: referencia.

```js
import { controlPanel, resolverEstado } from "./components/controlPanel.js"
import {
  barras,
  barrasApiladas,
  barrasFacetadas,
  heatmapAño,
  maxProp,
  COLOR_SEXO,
} from "./components/graficas.js"
import { mapaEntidades } from "./components/mapa.js"
const NIVELES = ["Sin escolaridad", "Primaria", "Secundaria", "Media superior", "Superior", "Posgrado"]
const ACTIV = ["Solo estudia", "Estudia y trabaja", "Solo trabaja", "Ninguna"]
const escPer = FileAttachment("./data/enigh_persona_escolaridad.csv").csv({
  typed: true,
})
const actPer = FileAttachment("./data/enigh_persona_actividad.csv").csv({
  typed: true,
})
const pcPer = FileAttachment("./data/enigh_persona_ingreso_pc.csv").csv({
  typed: true,
})
const beca = FileAttachment("./data/enigh_persona_beca.csv").csv({
  typed: true,
})
const cand = FileAttachment("./data/enigh_persona_candidato.csv").csv({
  typed: true,
})
const comp = FileAttachment("./data/enigh_persona_composicion.csv").csv({
  typed: true,
})
const compDec = FileAttachment(
  "./data/enigh_persona_composicion_decil.csv"
).csv({ typed: true })
const desg = FileAttachment("./data/enigh_persona_desglose_prog.csv").csv({
  typed: true,
})
const desgDec = FileAttachment(
  "./data/enigh_persona_desglose_prog_decil.csv"
).csv({ typed: true })
const caj = FileAttachment("./data/enigh_persona_cajitas.csv").csv({
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
const aniosEnigh = [...new Set(beca.map((d) => String(d.año)))].sort((a, b) => +a - +b)
// Aplica nivel(estado)+año+sexo+edad a un dataset por persona.
function aplicar(datos, est) {
  let f = datos
  if (est.nivel === "estatal" && est.cveEnt)
    f = f.filter((d) => String(d.cve_ent).padStart(2, "0") === est.cveEnt)
  if (est.anio) f = f.filter((d) => String(d.año) === est.anio)
  if (est.sexo && est.sexo !== "Todos") f = f.filter((d) => d.sexo === est.sexo)
  if (est.edadMin != null)
    f = f.filter((d) => +d.edad >= est.edadMin && +d.edad <= est.edadMax)
  return f
}
function etiq(est) {
  const geo = est.nivel === "estatal" && est.cveEnt
    ? " - " + (nombrePorCve.get(est.cveEnt) ?? "")
    : " - Nacional"
  return geo + (est.anio ? ` (${est.anio})` : "")
}
// Mapa (año fijo) o heatmap estados x año (todos). porAño: Map año -> (Map cve -> valor).
function mapaOHeat(porAño, geo, est, { subtitulo = "", fuente = "", etiquetaValor = "valor", titulo = "", formato = "pct" } = {}) {
  const resaltar = est.nivel === "estatal" && est.cveEnt ? est.cveEnt : null
  if (est.anio) {
    const valores = porAño.get(est.anio) ?? porAño.get(+est.anio) ?? new Map()
    return mapaEntidades(geo, valores, { titulo, subtitulo: `${subtitulo} (${est.anio})`,
      fuente, nombrePorCve, formato, etiquetaValor, resaltarCve: resaltar })
  }
  const puntos = []
  for (const [año, m] of porAño)
    for (const [cve, v] of m)
      puntos.push({ año: String(año), cve, nombre: nombrePorCve.get(cve) ?? cve, valor: v })
  return heatmapAño(puntos, { titulo, subtitulo, fuente, resaltarCve: resaltar, formato, etiquetaValor })
}
```

## Personas con la beca por edad

```js
const v1 = view(
  controlPanel({ catEnt, niveles: ["Nacional", "Estatal"], desagrega: true, anios: aniosEnigh })
)
```

```js
{
  const est = resolverEstado(v1, { catEnt, catMun: [] })
  const f = aplicar(beca, est)
  const totAño = new Map()
  for (const d of f) totAño.set(d.año, (totAño.get(d.año) ?? 0) + d.personas)
  const m = new Map()
  for (const d of f) {
    const k = d.año + "|" + d.edad
    m.set(k, (m.get(k) ?? 0) + d.personas)
  }
  const filas = [...m]
    .map(([k, v]) => {
      const [a, e] = k.split("|")
      return {
        año: a,
        edad: String(e),
        per: v,
        pct: totAño.get(+a) ? (v / totAño.get(+a)) * 100 : 0,
      }
    })
    .sort((x, y) => +x.edad - +y.edad)
  display(
    filas.length
      ? barrasFacetadas(filas, {
          x: "edad",
          y: "pct",
          faceta: "año",
          crudoKey: "per",
          titulo: "Personas con la beca por edad" + etiq(est),
          subtitulo: "% por edad, un panel por año",
          fuente: "Fuente: INEGI (ENIGH)",
        })
      : html`<p>Sin datos para la seleccion.</p>`
  )
}
```

## Personas con la beca por sexo

```js
const v2 = view(
  controlPanel({ catEnt, niveles: ["Nacional", "Estatal"], desagrega: true, anios: aniosEnigh })
)
```

```js
{
  const est = resolverEstado(v2, { catEnt, catMun: [] })
  const f = aplicar(beca, est).filter(
    (d) => d.sexo === "FEMENINO" || d.sexo === "MASCULINO"
  )
  const totAño = new Map()
  for (const d of f) totAño.set(d.año, (totAño.get(d.año) ?? 0) + d.personas)
  const m = new Map()
  for (const d of f) {
    const k = d.año + "|" + d.sexo
    m.set(k, (m.get(k) ?? 0) + d.personas)
  }
  const filas = [...m].map(([k, v]) => {
    const [a, s] = k.split("|")
    return {
      año: a,
      sexo: s,
      per: v,
      pct: totAño.get(+a) ? (v / totAño.get(+a)) * 100 : 0,
    }
  })
  display(
    filas.length
      ? barrasFacetadas(filas, {
          x: "sexo",
          y: "pct",
          faceta: "año",
          crudoKey: "per",
          titulo: "Personas con la beca por sexo" + etiq(est),
          subtitulo: "% por sexo, un panel por año",
          fuente: "Fuente: INEGI (ENIGH)",
        })
      : html`<p>Sin datos para la seleccion.</p>`
  )
}
```

## Escolaridad de la persona con la beca

```js
const vEsc = view(
  controlPanel({ catEnt, niveles: ["Nacional", "Estatal"], desagrega: true, anios: aniosEnigh })
)
```

```js
{
  const est = resolverEstado(vEsc, { catEnt, catMun: [] })
  const f = aplicar(escPer, est)
  const totAño = new Map()
  for (const d of f) totAño.set(d.año, (totAño.get(d.año) ?? 0) + d.personas)
  const m = new Map()
  for (const d of f) {
    const k = d.año + "|" + d.nivel
    m.set(k, (m.get(k) ?? 0) + d.personas)
  }
  const filas = [...m].map(([k, v]) => {
    const [a, n] = k.split("|")
    return {
      año: a,
      nivel: n,
      per: v,
      pct: totAño.get(+a) ? (v / totAño.get(+a)) * 100 : 0,
    }
  })
  display(
    filas.length
      ? barrasFacetadas(filas, {
          x: "nivel",
          y: "pct",
          faceta: "año",
          crudoKey: "per",
          dominioX: NIVELES,
          titulo: "Escolaridad de la persona con la beca" + etiq(est),
          subtitulo: "% por nivel educativo, un panel por año",
          fuente: "Fuente: INEGI (ENIGH)",
        })
      : html`<p>Sin datos para la seleccion.</p>`
  )
}
```

## Actividad de la persona con la beca

```js
const vAct = view(
  controlPanel({ catEnt, niveles: ["Nacional", "Estatal"], desagrega: true, anios: aniosEnigh })
)
```

```js
{
  const est = resolverEstado(vAct, { catEnt, catMun: [] })
  const f = aplicar(actPer, est)
  const totAño = new Map()
  for (const d of f) totAño.set(d.año, (totAño.get(d.año) ?? 0) + d.personas)
  const m = new Map()
  for (const d of f) {
    const k = d.año + "|" + d.categoria
    m.set(k, (m.get(k) ?? 0) + d.personas)
  }
  const filas = [...m].map(([k, v]) => {
    const [a, c] = k.split("|")
    return {
      año: a,
      categoria: c,
      per: v,
      pct: totAño.get(+a) ? (v / totAño.get(+a)) * 100 : 0,
    }
  })
  display(
    filas.length
      ? barrasFacetadas(filas, {
          x: "categoria",
          y: "pct",
          faceta: "año",
          crudoKey: "per",
          dominioX: ACTIV,
          titulo: "Actividad de la persona con la beca" + etiq(est),
          subtitulo: "% que estudia y/o trabaja, un panel por año",
          fuente: "Fuente: INEGI (ENIGH)",
        })
      : html`<p>Sin datos para la seleccion.</p>`
  )
}
```

## Personas con la beca por decil

```js
const v3 = view(
  controlPanel({ catEnt, niveles: ["Nacional", "Estatal"], desagrega: true, anios: aniosEnigh })
)
```

```js
{
  const est = resolverEstado(v3, { catEnt, catMun: [] })
  const f = aplicar(beca, est)
  const totAño = new Map()
  for (const d of f) totAño.set(d.año, (totAño.get(d.año) ?? 0) + d.personas)
  const m = new Map()
  for (const d of f) {
    const k = d.año + "|" + d.decil
    m.set(k, (m.get(k) ?? 0) + d.personas)
  }
  const filas = [...m]
    .map(([k, v]) => {
      const [a, dc] = k.split("|")
      return {
        año: a,
        decil: String(dc),
        per: v,
        pct: totAño.get(+a) ? (v / totAño.get(+a)) * 100 : 0,
      }
    })
    .sort((x, y) => +x.decil - +y.decil)
  display(
    filas.length
      ? barrasFacetadas(filas, {
          x: "decil",
          y: "pct",
          faceta: "año",
          crudoKey: "per",
          dominioX: deciles,
          titulo: "Personas con la beca por decil" + etiq(est),
          subtitulo: "% por decil, un panel por año",
          fuente: "Fuente: INEGI (ENIGH)",
        })
      : html`<p>Sin datos para la seleccion.</p>`
  )
}
```

## Personas candidatas por decil

```js
{
  const totAño = new Map()
  for (const d of cand) totAño.set(d.año, (totAño.get(d.año) ?? 0) + d.personas)
  const m = new Map()
  for (const d of cand) {
    const k = d.año + "|" + d.decil
    m.set(k, (m.get(k) ?? 0) + d.personas)
  }
  const filas = [...m]
    .map(([k, v]) => {
      const [a, dc] = k.split("|")
      return {
        año: a,
        decil: String(dc),
        per: v,
        pct: totAño.get(+a) ? (v / totAño.get(+a)) * 100 : 0,
      }
    })
    .sort((x, y) => +x.decil - +y.decil)
  display(
    barrasFacetadas(filas, {
      x: "decil",
      y: "pct",
      faceta: "año",
      crudoKey: "per",
      dominioX: deciles,
      titulo: "Personas candidatas por decil (nacional)",
      subtitulo: "% por decil, un panel por año",
      fuente: "Fuente: INEGI (ENIGH)",
    })
  )
}
```

## Personas con la beca por entidad

Todos los años: heatmap de entidades por año. Al fijar un año se muestra el mapa.

```js
const mapaBecaV = view(
  controlPanel({ catEnt, niveles: ["Nacional", "Estatal"], desagrega: false, anios: aniosEnigh })
)
```

```js
{
  const est = resolverEstado(mapaBecaV, { catEnt, catMun: [] })
  const porAño = new Map()
  const totAño = new Map()
  for (const d of beca) {
    const cve = String(d.cve_ent).padStart(2, "0")
    const a = String(d.año)
    if (!porAño.has(a)) porAño.set(a, new Map())
    const mp = porAño.get(a)
    mp.set(cve, (mp.get(cve) ?? 0) + d.personas)
    totAño.set(a, (totAño.get(a) ?? 0) + d.personas)
  }
  for (const [año, mp] of porAño) {
    const t = totAño.get(año) || 0
    for (const [cve, v] of mp) mp.set(cve, t ? (v / t) * 100 : 0)
  }
  display(
    mapaOHeat(porAño, await geoEnt, est, {
      titulo: "Personas con la beca por entidad",
      subtitulo: "% de personas con beca por entidad",
      fuente: "Fuente: INEGI (ENIGH)",
      etiquetaValor: "% personas",
    })
  )
}
```

## Composicion del ingreso: con beca (nacional)

Los hogares de las personas con beca. Nacional (muestra chica por entidad).

```js
display(
  barrasApiladas(
    comp.map((x) => ({ ...x, x: String(x.año) })),
    {
      x: "x",
      serie: "macrotema",
      valor: "pct",
      crudoKey: "monto_exp",
      titulo: "Composicion del ingreso de personas con beca",
      subtitulo: "% del ingreso total, una barra por año",
      fuente: "Fuente: INEGI (ENIGH)",
    }
  )
)
```

## Composicion del ingreso por decil (nacional)

```js
display(
  barrasApiladas(
    compDec.map((x) => ({ ...x, x: String(x.decil), año: String(x.año) })),
    {
      x: "x",
      serie: "macrotema",
      valor: "pct",
      crudoKey: "monto_exp",
      dominioX: deciles,
      faceta: "año",
      titulo: "Composicion por decil (personas con beca)",
      subtitulo: "cada decil suma 100%, un panel por año",
      fuente: "Fuente: INEGI (ENIGH)",
    }
  )
)
```

## Desglose dentro de programas (nacional): con beca jcf

```js
display(
  barrasApiladas(
    desg.map((x) => ({ ...x, x: String(x.año) })),
    {
      x: "x",
      serie: "programa",
      valor: "pct",
      crudoKey: "monto_exp",
      titulo: "Desglose de programas (personas con beca)",
      subtitulo: "% del ingreso de programas; incluye JCF",
      fuente: "Fuente: INEGI (ENIGH)",
    }
  )
)
```

## Desglose de programas por decil (nacional): con beca jcf

```js
display(
  barrasApiladas(
    desgDec.map((x) => ({ ...x, x: String(x.decil), año: String(x.año) })),
    {
      x: "x",
      serie: "programa",
      valor: "pct",
      crudoKey: "monto_exp",
      dominioX: deciles,
      faceta: "año",
      titulo: "Desglose de programas por decil (personas con beca)",
      subtitulo: "cada decil suma 100%, un panel por año",
      fuente: "Fuente: INEGI (ENIGH)",
    }
  )
)
```

## Peso de la beca en el ingreso del hogar (nacional)

Ratio beca / ingreso del hogar de la persona con beca, en cajas de 10.

```js
{
  const totAño = new Map()
  for (const d of caj) totAño.set(d.año, (totAño.get(d.año) ?? 0) + d.n)
  const filas = caj.map((d) => ({
    año: String(d.año),
    caja: String(d.caja),
    hog: d.n,
    pct: totAño.get(d.año) ? (d.n / totAño.get(d.año)) * 100 : 0,
  }))
  display(
    barrasFacetadas(filas, {
      x: "caja",
      y: "pct",
      faceta: "año",
      crudoKey: "hog",
      titulo: "Peso de la beca en el ingreso (personas con beca)",
      subtitulo:
        "% de personas por intervalo (0-100 en cajas de 10), un panel por año",
      fuente: "Fuente: INEGI (ENIGH)",
    })
  )
}
```

## Cobertura por decil: candidatas con beca (nacional)

% de personas candidatas de cada decil que reciben la beca.

```js
{
  const becaDec = new Map(),
    candDec = new Map()
  for (const d of beca) {
    const k = d.año + "|" + d.decil
    becaDec.set(k, (becaDec.get(k) ?? 0) + d.personas)
  }
  for (const d of cand) {
    const k = d.año + "|" + d.decil
    candDec.set(k, (candDec.get(k) ?? 0) + d.personas)
  }
  const filas = [...candDec]
    .map(([k, cn]) => {
      const [a, dc] = k.split("|")
      const bn = becaDec.get(k) ?? 0
      return {
        año: a,
        decil: String(dc),
        per: bn,
        pct: cn ? (bn / cn) * 100 : 0,
      }
    })
    .sort((x, y) => +x.decil - +y.decil)
  display(
    barrasFacetadas(filas, {
      x: "decil",
      y: "pct",
      faceta: "año",
      crudoKey: "per",
      dominioX: deciles,
      titulo: "Cobertura por decil (personas)",
      subtitulo: "% de candidatas con beca por decil, un panel por año",
      fuente: "Fuente: INEGI (ENIGH)",
    })
  )
}
```

## Ingreso per capita: con beca vs candidato

Ingreso corriente per capita del hogar (pesos reales base 2024), promedio por entidad. Nacional o estatal.

```js
const vPc = view(
  controlPanel({ catEnt, niveles: ["Nacional", "Estatal"], desagrega: false, anios: aniosEnigh })
)
```

```js
{
  const est = resolverEstado(vPc, { catEnt, catMun: [] })
  let f = pcPer
  if (est.nivel === "estatal" && est.cveEnt)
    f = f.filter((d) => String(d.cve_ent).padStart(2, "0") === est.cveEnt)
  // Promedio simple entre entidades cuando es nacional.
  const m = new Map()
  for (const d of f) {
    const k = d.año + "|" + d.grupo
    if (!m.has(k)) m.set(k, { s: 0, n: 0 })
    const a = m.get(k)
    a.s += +d.ing_pc_real_prom
    a.n += 1
  }
  const filas = [...m].map(([k, v]) => {
    const [a, g] = k.split("|")
    return { año: a, grupo: g, val: v.n ? v.s / v.n : 0 }
  })
  display(
    filas.length
      ? barrasFacetadas(filas, {
          x: "grupo",
          y: "val",
          faceta: "año",
          dominioX: ["con beca", "candidato"],
          formato: "entero",
          titulo: "Ingreso per capita: con beca vs candidato" + etiq(est),
          subtitulo: "pesos reales (base 2024), un panel por año",
          fuente: "Fuente: INEGI (ENIGH)",
        })
      : html`<p>Sin datos para la seleccion.</p>`
  )
}
```

## Ingreso per capita (con beca) por entidad

Todos los años: heatmap de entidades por año. Al fijar un año se muestra el mapa.

```js
const mapaPcV = view(
  controlPanel({ catEnt, niveles: ["Nacional", "Estatal"], desagrega: false, anios: aniosEnigh })
)
```

```js
{
  const est = resolverEstado(mapaPcV, { catEnt, catMun: [] })
  const porAño = new Map()
  for (const d of pcPer.filter((x) => x.grupo === "con beca")) {
    const cve = String(d.cve_ent).padStart(2, "0")
    const a = String(d.año)
    if (!porAño.has(a)) porAño.set(a, new Map())
    porAño.get(a).set(cve, +d.ing_pc_real_prom)
  }
  display(
    mapaOHeat(porAño, await geoEnt, est, {
      titulo: "Ingreso per capita (personas con beca)",
      subtitulo: "pesos reales (base 2024) por entidad",
      fuente: "Fuente: INEGI (ENIGH)",
      formato: "entero",
      etiquetaValor: "ing. pc",
    })
  )
}
```
