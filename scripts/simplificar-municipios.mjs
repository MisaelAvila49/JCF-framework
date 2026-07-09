// scripts/simplificar-municipios.mjs
// Simplifica los geojson municipales (reduce precision de coordenadas) para bajar
// el peso del build sin diferencia visible. Usa mapshaper via npx. Reemplaza cada
// archivo en src/data/municipios/ por su version ligera.
import {readdirSync, statSync} from "node:fs";
import {execFileSync} from "node:child_process";
import path from "node:path";

const DIR = new URL("../src/data/municipios/", import.meta.url).pathname.replace(/^\//, "");
const archivos = readdirSync(DIR).filter((f) => f.endsWith(".json"));

for (const f of archivos) {
  const ruta = path.join(DIR, f);
  const antes = statSync(ruta).size;
  // -simplify conserva la forma; precision redondea; gj2008 preserva la
  // orientacion de los anillos (RFC7946 la invierte y rompe Plot.geo).
  execFileSync("npx", ["-y", "mapshaper", ruta,
    "-simplify", "5%", "keep-shapes",
    "-o", "force", "precision=0.0001", "gj2008", ruta],
    {stdio: "inherit", shell: true});
  const despues = statSync(ruta).size;
  console.log(f, (antes / 1024 / 1024).toFixed(1) + "MB ->", (despues / 1024 / 1024).toFixed(2) + "MB");
}
