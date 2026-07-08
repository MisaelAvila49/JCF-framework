# ENIGH JCF — Estatal

Fuente: INEGI, ENIGH. Advertencia: la muestra de hogares con la beca por entidad
es muy chica (decenas de hogares); todo este detalle es solo referencia, no es
estadisticamente confiable. Los deciles son nacionales.

```js
import {filtrarDatos} from "../components/filtros.js";
import {barras, barrasApiladas, barrasH, maxProp} from "../components/graficas.js";
const c5 = FileAttachment("../data/enigh_c5_entidad.csv").csv({typed: true});
const cob = FileAttachment("../data/enigh_c1_cobertura_estatal.csv").csv({typed: true});
const dec = FileAttachment("../data/enigh_c3c4_decil_estatal.csv").csv({typed: true});
const comp = FileAttachment("../data/enigh_composicion_ingreso_estatal.csv").csv({typed: true});
const compDec = FileAttachment("../data/enigh_composicion_por_decil_estatal.csv").csv({typed: true});
const desg = FileAttachment("../data/enigh_desglose_programas_estatal.csv").csv({typed: true});
const desgDec = FileAttachment("../data/enigh_desglose_programas_por_decil_estatal.csv").csv({typed: true});
const cajitas = FileAttachment("../data/enigh_c10_cajitas_estatal.csv").csv({typed: true});
const percap = FileAttachment("../data/enigh_ingreso_percapita_estatal.csv").csv({typed: true});
const cruces = FileAttachment("../data/padron_cruces.csv").csv({typed: true});
```

```js
// Catalogo cve_ent (2 digitos) -> nombre_ent, de padron_cruces.
const nombrePorEnt = new Map(cruces.map((d) => [String(d.cve_ent).padStart(2, "0"), d.nombre_ent]));
const nombresEnt = Array.from(new Set(nombrePorEnt.values()))
  .filter((n) => n != null && n !== "").sort((a, b) => a.localeCompare(b, "es"));
// Normaliza para comparar por nombre.
function norm(t) {
  return (t ?? "").toString().normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}
// Une la clave de 2 digitos a cada fila estatal.
function conNombre(filas) {
  return filas.map((d) => ({...d, cve2: String(d.cve_ent).padStart(2, "0"),
    nombre_ent: nombrePorEnt.get(String(d.cve_ent).padStart(2, "0")) ?? String(d.cve_ent)}));
}
const deciles = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
```

## Distribucion de hogares con la beca por entidad (año reciente)

```js
const añoMax = maxProp(c5, "año");
const distEnt = conNombre(c5.filter((d) => d.año === añoMax));
const totD = distEnt.reduce((s, d) => s + d.con_jcf, 0);
const filasD = distEnt.map((d) => ({nombre_ent: d.nombre_ent, hog: d.con_jcf,
  pct: totD ? d.con_jcf / totD * 100 : 0}));
display(barrasH(filasD, {x: "pct", y: "nombre_ent", crudoKey: "hog",
  subtitulo: `% de los hogares con beca por entidad (${añoMax})`, fuente: "Fuente: INEGI (ENIGH)"}));
```

## Estado

Escribe un estado para ver su detalle (deciles, composicion, programas, cajitas).

```js
const nombreEnt = view(Inputs.text({label: "Estado", value: "Ciudad de Mexico",
  placeholder: "escribe un estado", datalist: nombresEnt}));
```
```js
// cve_ent (2 digitos) del estado escrito (primer match por substring).
const cveSel = (() => {
  const q = norm(nombreEnt);
  if (!q) return null;
  const hit = [...nombrePorEnt.entries()].find(([, n]) => norm(n).includes(q));
  return hit ? hit[0] : null;
})();
const etiqEnt = cveSel ? nombrePorEnt.get(cveSel) : "(sin estado)";
```

## Cobertura por año (Hogares con un integrante candidato)

```js
const cobE = conNombre(cob).filter((d) => d.cve2 === cveSel);
display(barras(cobE.map((d) => ({año: String(d.año), pct: d.pct_con_jcf, hog: d.con_jcf})),
  {x: "año", y: "pct", crudoKey: "hog",
   subtitulo: `% de hogares con candidato que reciben la beca — ${etiqEnt}`,
   fuente: "Fuente: INEGI (ENIGH)"}));
```

## Cobertura por decil de ingreso (año reciente)

```js
const añoD = maxProp(dec, "año");
const decE = conNombre(dec).filter((d) => d.cve2 === cveSel && d.año === añoD)
  .map((d) => ({decil: String(d.decil), pct: (+d.tasa_decil) * 100, hog: d.con_jcf}))
  .sort((a, b) => +a.decil - +b.decil);
display(barras(decE, {x: "decil", y: "pct", crudoKey: "hog",
  subtitulo: `% de candidatos con beca por decil — ${etiqEnt} (${añoD})`,
  fuente: "Fuente: INEGI (ENIGH)"}));
```

## Reparto de la beca por decil (año reciente)

```js
const repE = conNombre(dec).filter((d) => d.cve2 === cveSel && d.año === añoD)
  .map((d) => ({decil: String(d.decil), pct: (+d.reparto_jcf) * 100, hog: d.con_jcf}))
  .sort((a, b) => +a.decil - +b.decil);
display(barras(repE, {x: "decil", y: "pct", crudoKey: "hog",
  subtitulo: `% de los hogares con beca en cada decil — ${etiqEnt} (${añoD})`,
  fuente: "Fuente: INEGI (ENIGH)"}));
```

## Composicion del ingreso (año reciente)

```js
const añoC = maxProp(comp, "año");
const compE = conNombre(comp).filter((d) => d.cve2 === cveSel && d.año === añoC)
  .map((d) => ({...d, x: "ingreso"}));
display(compE.length ? barrasApiladas(compE, {x: "x", serie: "macrotema", valor: "pct",
  crudoKey: "monto_exp", subtitulo: `% del ingreso total — ${etiqEnt} (${añoC})`,
  fuente: "Fuente: INEGI (ENIGH)"}) : html`<p>Sin hogares con beca en la muestra de ${etiqEnt}.</p>`);
```

## Composicion del ingreso por decil (año reciente)

```js
const añoCD = maxProp(compDec, "año");
const compDecE = conNombre(compDec).filter((d) => d.cve2 === cveSel && d.año === añoCD)
  .map((d) => ({...d, x: String(d.decil)}));
display(compDecE.length ? barrasApiladas(compDecE, {x: "x", serie: "macrotema", valor: "pct",
  crudoKey: "monto_exp", dominioX: deciles,
  subtitulo: `cada decil suma 100% — ${etiqEnt} (${añoCD})`, fuente: "Fuente: INEGI (ENIGH)"})
  : html`<p>Sin datos por decil para ${etiqEnt}.</p>`);
```

## Desglose dentro de programas sociales y becas (año reciente)

```js
const añoDG = maxProp(desg, "año");
const desgE = conNombre(desg).filter((d) => d.cve2 === cveSel && d.año === añoDG)
  .map((d) => ({...d, x: "programas"}));
display(desgE.length ? barrasApiladas(desgE, {x: "x", serie: "programa", valor: "pct",
  crudoKey: "monto_exp", subtitulo: `% del ingreso de programas; incluye JCF — ${etiqEnt} (${añoDG})`,
  fuente: "Fuente: INEGI (ENIGH)"}) : html`<p>Sin datos de programas para ${etiqEnt}.</p>`);
```

## Desglose de programas por decil (año reciente)

```js
const añoDD = maxProp(desgDec, "año");
const desgDecE = conNombre(desgDec).filter((d) => d.cve2 === cveSel && d.año === añoDD)
  .map((d) => ({...d, x: String(d.decil)}));
display(desgDecE.length ? barrasApiladas(desgDecE, {x: "x", serie: "programa", valor: "pct",
  crudoKey: "monto_exp", dominioX: deciles,
  subtitulo: `cada decil suma 100% del ingreso de programas — ${etiqEnt} (${añoDD})`,
  fuente: "Fuente: INEGI (ENIGH)"}) : html`<p>Sin datos por decil para ${etiqEnt}.</p>`);
```

## Peso de la beca en el ingreso del hogar (año reciente)

```js
const añoCaj = maxProp(cajitas, "año");
const cajE = conNombre(cajitas).filter((d) => d.cve2 === cveSel && d.año === añoCaj);
const totCaj = cajE.reduce((s, d) => s + d.n, 0);
display(cajE.length ? barras(cajE.map((d) => ({caja: String(d.caja),
  pct: totCaj ? d.n / totCaj * 100 : 0, hog: d.n})),
  {x: "caja", y: "pct", crudoKey: "hog",
   subtitulo: `% de hogares por intervalo, 0-100 en cajas de 10 — ${etiqEnt} (${añoCaj})`,
   fuente: "Fuente: INEGI (ENIGH)"}) : html`<p>Sin datos de cajitas para ${etiqEnt}.</p>`);
```

## Ingreso per capita comparado (año reciente)

```js
const añoPC = maxProp(percap, "año");
const pcE = conNombre(percap).filter((d) => d.cve2 === cveSel && d.año === añoPC);
display(pcE.length ? barras(pcE.map((d) => ({grupo: d.grupo, ing: d.ing_pc_real_prom, hog: d.hogares})),
  {x: "grupo", y: "ing", formato: "entero", crudoKey: "hog",
   subtitulo: `Pesos de 2024: con beca vs candidato sin beca — ${etiqEnt} (${añoPC})`,
   fuente: "Fuente: INEGI (ENIGH)"}) : html`<p>Sin datos de ingreso para ${etiqEnt}.</p>`);
```
