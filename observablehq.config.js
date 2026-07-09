// Configuracion del tablero JCF. Sin interpreters: los datos son CSV estaticos.
// Diseno Social Data Ibero (tonos rojos, fondo blanco) via custom-style.css.
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

// El framework reescribe paths a assets en header/footer/head, pero NO en `home`.
// Por eso el logo del bloque de marca del sidebar se inlina crudo.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logoOriginalSvg = fs.readFileSync(
  path.join(__dirname, "src/images/social_data_original.svg"),
  "utf-8"
);

export default {
  title: "JCF: tablero de analisis",

  // Estilo Social Data Ibero (reemplaza el tema por defecto).
  style: "custom-style.css",

  toc: true,
  search: true,

  // Bloque de marca del sidebar: logo + titulo + subtitulo.
  home: `<span class="sidebar-brand">
  <span class="sidebar-brand-logo" aria-hidden="true">${logoOriginalSvg}</span>
  <span class="sidebar-brand-text">
    <span class="sidebar-brand-title">Jovenes Construyendo el Futuro</span>
    <span class="sidebar-brand-sub">Social Data Ibero</span>
  </span>
</span>`,

  pages: [
    { name: "Padron JCF", path: "/padron" },
    { name: "ENIGH Hogares", path: "/enigh-hogares" },
    { name: "ENIGH Personas", path: "/enigh-personas" }
  ],

  head: `<link rel="icon" href="/images/social_data_original.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<meta name="author" content="Social Data Ibero">`,

  header: `<div class="book-header">
  <nav class="book-header-nav" aria-label="Navegacion principal">
    <a href="https://socialdata.ibero.mx" target="_blank" rel="noopener" class="book-header-link">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
      <span>Social Data</span>
    </a>
  </nav>
</div>`,

  root: "src",

  footer: `<div class="book-footer">
  <div class="book-footer-grid">
    <a href="https://socialdata.ibero.mx" target="_blank" rel="noopener" class="book-footer-brand" aria-label="Social Data Ibero - Universidad Iberoamericana">
      <img src="/images/social_data_gris.svg" alt="" class="book-footer-logo">
      <span class="book-footer-brand-text">
        <span class="book-footer-name">Social Data Ibero</span>
        <span class="book-footer-inst">Universidad Iberoamericana - Ciudad de Mexico</span>
      </span>
    </a>
    <div class="book-footer-col">
      <h4 class="book-footer-col-title">Fuentes</h4>
      <p class="book-footer-col-line">Padron JCF - STPS</p>
      <p class="book-footer-col-line">Censo 2020 y ENIGH - INEGI</p>
    </div>
    <div class="book-footer-col">
      <h4 class="book-footer-col-title">Tablero</h4>
      <p class="book-footer-col-line">Padron: nacional, estatal, municipal</p>
      <p class="book-footer-col-line">ENIGH: nacional, estatal</p>
    </div>
    <div class="book-footer-col">
      <h4 class="book-footer-col-title">Notas</h4>
      <p class="book-footer-col-line">Edad y sexo del padron desde 2021</p>
      <p class="book-footer-col-line book-footer-version">ENIGH es una muestra</p>
    </div>
  </div>
  <div class="book-footer-bottom">
    <span>&copy; 2026 Social Data Ibero</span>
    <span class="book-footer-tech">Construido con <a href="https://observablehq.com/framework/" target="_blank" rel="noopener">Observable Framework</a></span>
  </div>
</div>`,
};
