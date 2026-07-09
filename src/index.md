---
title: Tablero JCF
toc: false
---

<div class="book-hero">
  <div class="book-hero-content">
    <span class="book-hero-eyebrow">Social Data Ibero · Análisis de política social</span>
    <h1 class="book-hero-title">Jóvenes Construyendo el Futuro</h1>
    <p class="book-hero-subtitle">Tablero interactivo de cobertura, perfil e ingresos de la beca</p>
    <p class="book-hero-abstract">Un recorrido por la beca JCF a partir de dos fuentes: el <strong>padrón</strong> de beneficiarios (registro administrativo, 2019–2025) y la <strong>ENIGH</strong> del INEGI (muestra de hogares). Cobertura respecto a la población candidata, perfil por edad y sexo, distribución geográfica hasta el nivel municipal, y la composición del ingreso de los hogares. Cada gráfica se filtra por nivel territorial, sexo y edad.</p>
    <div class="book-hero-ctas">
      <a class="book-cta book-cta-primary" href="./padron">Explorar el padrón</a>
      <a class="book-cta" href="./enigh-hogares">Análisis ENIGH →</a>
    </div>
  </div>
</div>

<div class="book-meta-grid">
  <div class="book-meta-field">
    <p class="book-meta-label">Autores</p>
    <ul class="book-authors">
      <li>Dr. Wilfrido A. Gómez Arias</li>
      <li>Misael Saúl Ávila López</li>
    </ul>
  </div>
  <div class="book-meta-field">
    <p class="book-meta-label">Institución</p>
    <p class="book-meta-value">Social Data Ibero</p>
    <p class="book-meta-sub">Universidad Iberoamericana · Ciudad de México</p>
  </div>
  <div class="book-meta-field">
    <p class="book-meta-label">Fuentes</p>
    <p class="book-meta-value">Padrón JCF (STPS)</p>
    <p class="book-meta-sub">Censo 2020, ENIGH y proyecciones (INEGI / CONAPO); pobreza (CONEVAL)</p>
  </div>
  <div class="book-meta-field">
    <p class="book-meta-label">Cobertura temporal</p>
    <p class="book-meta-value">2019 – 2025</p>
    <p class="book-meta-sub">Edad y sexo del padrón desde 2021; ENIGH 2020, 2022 y 2024</p>
  </div>
</div>

## Numeralia: personas con la beca según cada fuente

El padrón y la ENIGH no coinciden por construcción: el padrón es un registro
administrativo (conteo real de altas); la ENIGH es una muestra que estima quién
reporta el ingreso de la beca. Se muestran lado a lado como referencia.

```js
import {barras} from "./components/graficas.js";
const padron = FileAttachment("./data/padron_resumen_dedup.csv").csv({typed: true});
const enigh = FileAttachment("./data/enigh_jcf_conteo.csv").csv({typed: true});
```

<div class="grid grid-cols-2">
  <div>

```js
const padronFilas = padron.map((d) => ({año: String(d.año), personas: d.unicos}));
display(barras(padronFilas, {x: "año", y: "personas", formato: "entero", crudoKey: "personas",
  titulo: "Padrón (registro real)", subtitulo: "Personas únicas por año", fuente: "Fuente: STPS"}));
```

  </div>
  <div>

```js
const enighFilas = enigh.map((d) => ({año: String(d.año), personas: d.personas_expandido}));
display(barras(enighFilas, {x: "año", y: "personas", formato: "entero", crudoKey: "personas",
  titulo: "ENIGH (muestra expandida)", subtitulo: "Personas expandidas por año", fuente: "Fuente: INEGI (ENIGH)"}));
```

  </div>
</div>
