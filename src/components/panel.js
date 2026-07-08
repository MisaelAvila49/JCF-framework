// src/components/panel.js
// Utilidades para el panel de filtros de cada pagina. Los inputs se declaran en
// la pagina (Observable exige view() ahi); aqui van helpers puros reutilizables.

// Traduce la etiqueta del select de desglose al modo interno.
export function modoDesde(txt) {
  return txt === "Por sexo" ? "sexo" : txt === "Por edad" ? "edad" : "ninguno";
}

// Sufijo para el subtitulo segun el modo activo.
export function sufijoFiltro(modo) {
  if (modo === "sexo") return " (Filtrada por sexo)";
  if (modo === "edad") return " (Filtrada por edad)";
  return "";
}

// Lista ordenada de nombres unicos de una columna (para datalist).
export function nombresUnicos(datos, col) {
  return Array.from(new Set(datos.map((d) => d[col])
    .filter((n) => n != null && n !== ""))).sort((a, b) => a.localeCompare(b, "es"));
}
