import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";
import admin from "firebase-admin";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const serviceAccount = require("./serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const adminDb = admin.firestore();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);

let executedBy = null;
let moduleName = "general";

args.forEach(arg => {
  if (arg.startsWith("--by=")) {
    executedBy = arg.replace("--by=", "");
  }

  if (arg.startsWith("--module=")) {
    moduleName = arg.replace("--module=", "").toLowerCase();
  }
});

console.log("UID ejecutor:", executedBy);
console.log("Módulo recibido:", moduleName);

const ROOT = __dirname;
const REPORTS_DIR = path.join(ROOT, "custom-report");
const PDFS_DIR = path.join(ROOT, "custom-report", "pdfs");
const HISTORY_JSON = path.join(ROOT, "custom-report", "history.json");

if (!fs.existsSync(PDFS_DIR)) {
  fs.mkdirSync(PDFS_DIR, { recursive: true });
  console.log("Carpeta PDFs creada:", PDFS_DIR);
}

function readJSONSafe(filePath) {
  try {
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return [];
  }
}

function writeJSONSafe(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    console.log("history.json actualizado correctamente.");
  } catch (err) {
    console.error("Error al escribir history.json:", err.message);
  }
}

function extractDate() {
  return new Date().toISOString();
}

function countResults(suites) {
  let passed = 0;
  let failed = 0;
  let total = 0;

  for (const suite of suites || []) {
    if (suite.specs) {
      for (const spec of suite.specs) {
        for (const test of spec.tests || []) {
          for (const result of test.results || []) {
            total++;
            if (result.status === "passed") passed++;
            else if (["failed", "timedOut"].includes(result.status)) failed++;
          }
        }
      }
    }

    if (suite.suites) {
      const inner = countResults(suite.suites);
      passed += inner.passed;
      failed += inner.failed;
      total += inner.total;
    }
  }

  return { passed, failed, total };
}

async function generarPDF() {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const originalHtmlPath = path.join(REPORTS_DIR, "index.html");
    const htmlPath = `file://${originalHtmlPath}`;

    await page.goto(htmlPath, { waitUntil: "networkidle0" });

    const pdfName = `reporte_${Date.now()}.pdf`;
    const pdfPath = path.join(PDFS_DIR, pdfName);

    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true
    });

    await browser.close();

    console.log("PDF generado correctamente:", pdfName);

    const nuevoHtmlName = pdfName.replace(".pdf", ".html");
    const nuevoHtmlPath = path.join(REPORTS_DIR, nuevoHtmlName);

    fs.renameSync(originalHtmlPath, nuevoHtmlPath);

    console.log("HTML renombrado correctamente:", nuevoHtmlName);

    return { pdf: pdfName, html: nuevoHtmlName };
  } catch (err) {
    console.error("❌ Error generando PDF:", err);
    return null;
  }
}

(async () => {
  console.log("Iniciando guardado de resultados...");

  const history = readJSONSafe(HISTORY_JSON);
  let executedByName = "Desconocido";

  if (executedBy) {
    try {
      console.log("Buscando usuario en Firestore con UID:", executedBy);

      const userSnap = await adminDb.collection("users").doc(executedBy).get();

      if (userSnap.exists) {
        const data = userSnap.data();
        executedByName = `${data.nombre || ""} ${data.apellido || ""}`.trim();
        console.log("Usuario encontrado:", executedByName);
      } else {
        console.warn("⚠ No existe un usuario con ese UID en Firestore");
      }
    } catch (err) {
      console.warn("⚠ Error consultando usuario ejecutor:", err.message);
    }
  }

  const newRun = {
    date: extractDate(),
    total: 0,
    passed: 0,
    failed: 0,
    duration: 0,
    htmlFile: "http://localhost:5000/reports-custom/index.html",
    pdfFile: "",
    createdAt: new Date().toISOString(),
    executedBy,
    executedByName,
    module: moduleName
  };

  const jsonPath = path.join(ROOT, "playwright-report", "results.json");

  if (fs.existsSync(jsonPath)) {
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    const { passed, failed, total } = countResults(data.suites || []);
    newRun.total = total;
    newRun.passed = passed;
    newRun.failed = failed;
    newRun.duration = Math.round((data.stats?.duration / 1000) || 0);
    console.log("Datos obtenidos desde results.json");
  } else {
    console.warn("⚠ No se encontró playwright-report/results.json");
  }

  const pdfName = await generarPDF();
  if (pdfName) {
    newRun.pdfFile = `http://localhost:5000/pdfs/${pdfName.pdf}`;
    newRun.htmlFile = `http://localhost:5000/reports-custom/${pdfName.html}`;
  }

  history.push(newRun);
  writeJSONSafe(HISTORY_JSON, history);

  try {
    await adminDb.collection("reports").add({
      ...newRun,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log("Reporte guardado en Firestore.");
  } catch (err) {
    console.error("Error al subir reporte a Firestore:", err.message);
  }

  console.log("Guardado finalizado.");
  process.exit(0);
})();