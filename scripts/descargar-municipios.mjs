// scripts/descargar-municipios.mjs
// Descarga el geojson de municipios por estado (repo PhantomInsights) a
// src/data/municipios/<cve_ent>.json. Se corre una vez (o en npm run datos).
import {mkdir, writeFile} from "node:fs/promises";
import {existsSync} from "node:fs";

const DEST = new URL("../src/data/municipios/", import.meta.url).pathname.replace(/^\//, "");
// Nombre de archivo del repo por cve_ent (nombres oficiales del repo).
const ESTADOS = {
  "01": "Aguascalientes", "02": "Baja California", "03": "Baja California Sur",
  "04": "Campeche", "05": "Coahuila de Zaragoza", "06": "Colima", "07": "Chiapas",
  "08": "Chihuahua", "09": "Ciudad de México", "10": "Durango", "11": "Guanajuato",
  "12": "Guerrero", "13": "Hidalgo", "14": "Jalisco", "15": "México",
  "16": "Michoacán de Ocampo", "17": "Morelos", "18": "Nayarit", "19": "Nuevo León",
  "20": "Oaxaca", "21": "Puebla", "22": "Querétaro", "23": "Quintana Roo",
  "24": "San Luis Potosí", "25": "Sinaloa", "26": "Sonora", "27": "Tabasco",
  "28": "Tamaulipas", "29": "Tlaxcala", "30": "Veracruz de Ignacio de la Llave",
  "31": "Yucatán", "32": "Zacatecas",
};
const BASE = "https://raw.githubusercontent.com/PhantomInsights/mexico-geojson/main/2020/states/";

await mkdir(DEST, {recursive: true});
for (const [cve, nombre] of Object.entries(ESTADOS)) {
  const destino = DEST + cve + ".json";
  if (existsSync(destino)) { console.log("ya existe:", cve); continue; }
  const url = BASE + encodeURIComponent(nombre) + ".json";
  const r = await fetch(url);
  if (!r.ok) { console.log("ERROR", cve, nombre, r.status); continue; }
  await writeFile(destino, await r.text());
  console.log("descargado:", cve, nombre);
}
