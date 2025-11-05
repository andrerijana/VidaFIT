import cron from "node-cron";
import { exec } from "child_process";
import path from "path";

// Ruta base del proyecto
const projectPath = path.resolve("./");

// Configurar horario (ejemplo: todos los días a las 12:30 p.m.)
cron.schedule("30 12 * * *", () => {
  console.log(" Ejecutando pruebas automáticas Playwright - VidaFIT...");

  // Ejecuta todos los tests
  const run = exec("npx playwright test", { cwd: projectPath });

  // Mostrar salida en tiempo real
  run.stdout.on("data", (data) => console.log(data.toString()));
  run.stderr.on("data", (data) => console.error(data.toString()));

  // Cuando termina la ejecución
  run.on("close", (code) => {
    console.log(` Ejecución de Playwright finalizada (código ${code})`);

    // Ejecutar guardado de resultados
    exec("node save-results.js", (err, stdout, stderr) => {
      if (err) {
        console.error("❌ Error guardando resultados:", err);
      } else {
        if (stderr) console.error(stderr);
        console.log(stdout);
        console.log(" Historial actualizado correctamente.");
      }
    });
  });
});

console.log(" Programador activo. Esperando la hora de ejecución...");
