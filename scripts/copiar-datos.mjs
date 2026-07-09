// scripts/copiar-datos.mjs
// Copia los CSV generados por el proyecto JCF a src/data del tablero.
import {copyFile, mkdir} from "node:fs/promises";
import {existsSync} from "node:fs";
import path from "node:path";

const ORIGEN = "z:/SocialDataIbero/AnalisisSueltos/JCF/data/clean";
const DESTINO = new URL("../src/data/", import.meta.url).pathname.replace(/^\//, "");

const ARCHIVOS = [
  "padron_agregado.csv",
  "padron_cruces.csv",
  "padron_proyeccion.csv",
  "padron_proyeccion_municipal.csv",
  "padron_unicos_geo.csv",
  "padron_monto_geo.csv",
  "padron_antiguedad_geo.csv",
  "padron_monto.csv",
  "padron_antiguedad.csv",
  "padron_poblacion_censo.csv",
  "enigh_c1_cobertura_estatal.csv",
  "enigh_c3c4_decil_estatal.csv",
  "enigh_composicion_ingreso_estatal.csv",
  "enigh_composicion_por_decil_estatal.csv",
  "enigh_desglose_programas_estatal.csv",
  "enigh_desglose_programas_por_decil_estatal.csv",
  "enigh_c10_cajitas_estatal.csv",
  "enigh_ingreso_percapita_estatal.csv",
  "enigh_composicion_sin_beca_por_decil.csv",
  "enigh_persona_beca.csv",
  "enigh_persona_candidato.csv",
  "enigh_persona_composicion.csv",
  "enigh_persona_composicion_decil.csv",
  "enigh_persona_desglose_prog.csv",
  "enigh_persona_desglose_prog_decil.csv",
  "enigh_persona_cajitas.csv",
  "enigh_escolaridad_jefe.csv",
  "enigh_persona_escolaridad.csv",
  "enigh_persona_actividad.csv",
  "enigh_persona_ingreso_pc.csv",
  "enigh_personas_sexo.csv",
  "enigh_personas_edad.csv",
  "enigh_c1_cobertura.csv",
  "enigh_c3c4_decil.csv",
  "enigh_c5_entidad.csv",
  "enigh_composicion_ingreso.csv",
  "enigh_composicion_por_decil.csv",
  "enigh_composicion_sin_beca.csv",
  "enigh_desglose_programas.csv",
  "enigh_desglose_programas_por_decil.csv",
  "enigh_c9_otro_programa.csv",
  "enigh_c10_cajitas.csv",
  "enigh_ingreso_percapita.csv",
  "enigh_jcf_conteo.csv",
  "padron_resumen_dedup.csv",
];

await mkdir(DESTINO, {recursive: true});
for (const nombre of ARCHIVOS) {
  const origen = path.join(ORIGEN, nombre);
  if (existsSync(origen)) {
    await copyFile(origen, path.join(DESTINO, nombre));
    console.log("copiado:", nombre);
  } else {
    console.log("NO existe:", nombre);
  }
}
