import cron from "node-cron";
import { exec } from "child_process";
import path from "path";

const projectPath = path.resolve("./");

function runTests() {
  console.log("Ejecutando pruebas automáticas Playwright - VidaFIT...");

  const run = exec("npx playwright test", { cwd: projectPath });

  run.stdout.on("data", data => console.log(data.toString()));
  run.stderr.on("data", data => console.error(data.toString()));

  run.on("close", code => {
    console.log(`Ejecución de Playwright finalizada (código ${code})`);

    // Ejecutar guardado de resultados
    exec("node save-results.js", { cwd: projectPath }, (err, stdout, stderr) => {
      if (err) {
        console.error("Error guardando resultados:", err);
      } else {
        if (stderr) console.error(stderr);
        console.log(stdout);
        console.log("Historial actualizado correctamente.");
      }
    });
  });
}

// Programación diaria a las 5 AM
cron.schedule("0 5 * * *", () => {
  console.log("Iniciando ejecución programada...");
  runTests();
});

console.log("Programador activo. Esperando hora de ejecución...");
