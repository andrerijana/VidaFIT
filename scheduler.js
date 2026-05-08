import cron from "node-cron";
import { exec } from "child_process";
import path from "path";

const projectPath = path.resolve("./");

function runTests(moduleName = "login") {
  console.log(`Ejecutando pruebas automáticas Playwright - VidaFIT [${moduleName}]...`);

  const commandMap = {
    login: "npx playwright test login"
  };

  const testCommand = commandMap[moduleName] || commandMap.login;
  const run = exec(testCommand, { cwd: projectPath });

  run.stdout.on("data", data => console.log(data.toString()));
  run.stderr.on("data", data => console.error(data.toString()));

  run.on("close", code => {
    console.log(`Ejecución de Playwright finalizada (código ${code})`);

    exec(`node save-results.js --module=${moduleName}`, { cwd: projectPath }, (err, stdout, stderr) => {
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

cron.schedule("00 05 * * *", () => {
  console.log("Iniciando ejecución programada...");
  runTests("login");
});

console.log("Programador activo. Esperando hora de ejecución...");