// src/components/desglose.js
// Desglose comparativo de una serie por año: sin desglose, por sexo o por edad.
// Funcion pura. En modo sexo/edad recorta las filas sin ese dato (2019-2020 del
// padron), eliminando barras vacias.

// Suma beneficiarios y candidatos por año y por la llave de serie dada.
function agruparPorAñoSerie(datos, serieKey) {
  const mapa = new Map();
  for (const f of datos) {
    const serie = String(f[serieKey]);
    const clave = f.año + "||" + serie;
    if (!mapa.has(clave)) {
      mapa.set(clave, {año: f.año, serie, beneficiarios: 0, candidatos: 0});
    }
    const acc = mapa.get(clave);
    acc.beneficiarios += Number(f.beneficiarios) || 0;
    acc.candidatos += Number(f.candidatos) || 0;
  }
  return [...mapa.values()];
}

export function desglosar(datos, {modo = "ninguno", edadMin = 18, edadMax = 29} = {}) {
  if (modo === "sexo") {
    // Solo FEMENINO/MASCULINO; se omite "SD" (sin dato, residual) y vacio.
    const conSexo = datos.filter((f) => f.sexo === "FEMENINO" || f.sexo === "MASCULINO");
    return agruparPorAñoSerie(conSexo, "sexo");
  }
  if (modo === "edad") {
    const conEdad = datos.filter((f) => f.edad !== "" && f.edad != null
      && Number(f.edad) >= edadMin && Number(f.edad) <= edadMax);
    return agruparPorAñoSerie(conEdad, "edad");
  }
  // ninguno: serie = año (una barra por año).
  const porAño = agruparPorAñoSerie(datos, "año");
  return porAño.map((d) => ({...d, serie: String(d.año)}));
}
