// src/components/agregar.js
// Agrupacion de los datos del padron y calculo de la tasa de cobertura.
// Nunca se promedian tasas: se suman beneficiarios y candidatos, luego se divide.

// Suma beneficiarios y candidatos por las llaves dadas (arreglo de nombres de
// columna). Devuelve un arreglo de objetos con las llaves + los dos totales.
export function agrupar(datos, llaves) {
  const mapa = new Map();
  for (const fila of datos) {
    const clave = llaves.map((k) => fila[k]).join("||");
    if (!mapa.has(clave)) {
      const base = {};
      for (const k of llaves) base[k] = fila[k];
      base.beneficiarios = 0;
      base.candidatos = 0;
      mapa.set(clave, base);
    }
    const acc = mapa.get(clave);
    acc.beneficiarios += Number(fila.beneficiarios) || 0;
    acc.candidatos += Number(fila.candidatos) || 0;
  }
  return [...mapa.values()];
}

// Agrega la columna tasa = beneficiarios / candidatos (en porcentaje). Si no hay
// candidatos, la tasa queda null.
export function conTasa(filas) {
  return filas.map((f) => ({
    ...f,
    tasa: f.candidatos > 0 ? (f.beneficiarios / f.candidatos) * 100 : null,
  }));
}

// Filtra filas con edad y sexo presentes (para los analisis que los requieren;
// excluye 2019-2020 que no los traen).
export function conEdadSexo(datos) {
  return datos.filter((f) => f.edad !== "" && f.edad != null
                             && f.sexo !== "" && f.sexo != null);
}
