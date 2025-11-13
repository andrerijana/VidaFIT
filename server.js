// server.js
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from "util";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const execAsync = promisify(exec);

// ===============================
// CONFIGURACIÓN BÁSICA
// ===============================
app.use(cors({
  origin: "http://127.0.0.1:5500", // origen del dashboard
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "X-User-Role"]
}));

app.use(express.json());

// ===============================
// FUNCIÓN PARA EJECUTAR COMANDOS
// ===============================
async function run(cmd, label = "") {
  console.log(`[${new Date().toLocaleTimeString()}] Iniciando: ${label || cmd}`);

  return new Promise((resolve) => {
    const child = exec(cmd, {
      shell: true,
      windowsHide: true,
      maxBuffer: 1024 * 1024 * 10
    });

    child.stdout.on("data", (data) => process.stdout.write(data));
    child.stderr.on("data", (data) => process.stderr.write(data));

    child.on("exit", (code) => {
      if (code === 0) {
        console.log(`[${new Date().toLocaleTimeString()}] Finalizó correctamente: ${label || cmd}\n`);
      } else {
        console.warn(`[${new Date().toLocaleTimeString()}] Comando finalizado con errores (${code}): ${label || cmd}`);
      }
      resolve(code);
    });
  });
}

// ===============================
// SERVIR ARCHIVOS DE REPORTES
// ===============================
const reportsDir = path.join(__dirname, "custom-report", "reports");
const pdfsDir = path.join(__dirname, "custom-report", "pdfs");

if (!fs.existsSync(reportsDir)) {
  console.warn(`[AVISO] La carpeta de reportes no existe: ${reportsDir}`);
} else {
  console.log(`[OK] Sirviendo reportes HTML desde: ${reportsDir}`);
}

if (!fs.existsSync(pdfsDir)) {
  console.warn(`[AVISO] La carpeta de PDFs no existe: ${pdfsDir}`);
} else {
  console.log(`[OK] Sirviendo archivos PDF desde: ${pdfsDir}`);
}

app.use("/reports", express.static(reportsDir));
app.use("/pdfs", express.static(pdfsDir));

// ===============================
// ENDPOINT: EJECUTAR PRUEBAS MANUALMENTE
// ===============================
app.post("/run-tests", async (req, res) => {
  try {
    const { by } = req.body || {};
    const roleHeader = req.headers["x-user-role"] || "unknown";

    if (roleHeader.toLowerCase() !== "qa") {
      console.warn(`[${new Date().toLocaleTimeString()}] Acceso denegado: rol ${roleHeader}`);
      return res.status(403).json({
        ok: false,
        message: "Permiso denegado. Solo usuarios con rol QA pueden ejecutar pruebas."
      });
    }

    console.log(`[${new Date().toLocaleTimeString()}] Solicitud recibida por UID: ${by || "desconocido"} (rol ${roleHeader})`);

    // Responder inmediatamente al dashboard
    res.json({
      ok: true,
      message: "Ejecución iniciada. Los resultados aparecerán en el panel al finalizar."
    });

    // Ejecución en segundo plano
    (async () => {
      try {
        const code = await run("npx playwright test", "Ejecución de pruebas Playwright");
        if (code !== 0) {
          console.warn(`[${new Date().toLocaleTimeString()}] Algunos tests fallaron (código ${code}). Continuando con guardado...`);
        }

        await run("node save-results.js", "Guardado de resultados en Firestore");
        console.log(`[${new Date().toLocaleTimeString()}] Ejecución manual completada correctamente.`);
      } catch (err) {
        console.error(`[${new Date().toLocaleTimeString()}] Error interno en ejecución manual:`, err.message || err);
      }
    })();

  } catch (err) {
    console.error(`[${new Date().toLocaleTimeString()}] Error general:`, err.message || err);
    res.status(500).json({
      ok: false,
      message: "No se pudo iniciar la ejecución de pruebas.",
      error: err.message || "Error desconocido"
    });
  }
});

// ===============================
// INICIO DEL SERVIDOR
// ===============================
const PORT = 5000;
app.listen(PORT, () => {
  console.log("=========================================");
  console.log(`Servidor QA corriendo en: http://localhost:${PORT}`);
  console.log("Esperando solicitudes desde el dashboard...");
  console.log("=========================================\n");
});
