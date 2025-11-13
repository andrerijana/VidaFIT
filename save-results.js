// save-results.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== RUTAS =====
const ROOT = __dirname;
const REPORTS_DIR = path.join(ROOT, "custom-report");
const PDFS_DIR = path.join(ROOT, "custom-report", "pdfs");
const HISTORY_JSON = path.join(ROOT, "custom-report", "history.json");

// ===== FIREBASE CONFIG =====
const firebaseConfig = {
  apiKey: "AIzaSyBqRF7sgFP-1JP9QIyOJ3b4Z3tnFLDgQ5Y",
  authDomain: "app-gestion-de-pruebas.firebaseapp.com",
  projectId: "app-gestion-de-pruebas",
  storageBucket: "app-gestion-de-pruebas.firebasestorage.app",
  messagingSenderId: "580009585775",
  appId: "1:580009585775:web:e086fb73d1381cb4edb19a",
  measurementId: "G-ED9KFV6FZ5"
};

initializeApp(firebaseConfig);
const db = getFirestore();

// ===== UTILIDADES =====
function getLastFile(dir, regex) {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter(f => regex.test(f));
  if (!files.length) return null;
  const withTime = files.map(f => ({
    name: f,
    mtime: fs.statSync(path.join(dir, f)).mtimeMs
  }));
  withTime.sort((a, b) => b.mtime - a.mtime);
  return withTime[0].name;
}

function readJSONSafe(p) {
  try {
    if (!fs.existsSync(p)) return [];
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return [];
  }
}

function writeJSONSafe(p, data) {
  try {
    fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8");
    console.log("history.json actualizado correctamente.");
  } catch (err) {
    console.error("Error al escribir history.json:", err.message);
  }
}

function extractDateFromFilename(filename) {
  try {
    const match = filename.match(/reporte_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)/);
    if (match && match[1]) {
      const fixed = match[1].replace(/T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z/, "T$1:$2:$3.$4Z");
      return new Date(fixed).toISOString();
    }
  } catch (e) {
    console.warn("No se pudo parsear fecha:", e.message);
  }
  return new Date().toISOString();
}

// ===== FUNCIÓN RECURSIVA PARA CONTAR TESTS =====
function countResults(suites) {
  let passed = 0;
  let failed = 0;
  let total = 0;

  for (const suite of suites || []) {
    if (suite.specs && suite.specs.length > 0) {
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

    if (suite.suites && suite.suites.length > 0) {
      const inner = countResults(suite.suites);
      passed += inner.passed;
      failed += inner.failed;
      total += inner.total;
    }
  }

  return { passed, failed, total };
}

// ===== PROCESO PRINCIPAL =====
(async () => {
  console.log("Iniciando guardado de resultados...");

  let lastHtml = getLastFile(REPORTS_DIR, /^reporte_.*\.html$/i);

  if (!lastHtml && fs.existsSync(path.join(REPORTS_DIR, "index.html"))) {
    lastHtml = "index.html";
    console.log("Usando index.html como reporte principal generado por MyCustomHtmlReporter");
  }

  if (!lastHtml) {
    console.error("No se encontró archivo HTML en:", REPORTS_DIR);
    process.exit(1);
  }

  const lastPdf = getLastFile(PDFS_DIR, /^reporte_.*\.pdf$/i);
  const history = readJSONSafe(HISTORY_JSON);

  const reportDate = extractDateFromFilename(lastHtml);
  const newRun = {
    date: reportDate,
    total: 0,
    passed: 0,
    failed: 0,
    duration: 0,
    htmlFile: `http://localhost:5000/reports/${lastHtml.split("/").pop()}`,
    pdfFile: lastPdf ? `http://localhost:5000/pdfs/${lastPdf}` : "",
    createdAt: new Date().toISOString()
  };

  const jsonPath = path.join(ROOT, "playwright-report", "results.json");
  if (fs.existsSync(jsonPath)) {
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    const { passed, failed, total } = countResults(data.suites || []);
    newRun.total = total;
    newRun.passed = passed;
    newRun.failed = failed;
    newRun.duration = Math.round((data.stats?.duration / 1000) || 0);
    console.log("Datos obtenidos desde playwright-report/results.json");
  } else {
    console.warn("No se encontró results.json, usando valores por defecto (0).");
  }

  history.push(newRun);
  writeJSONSafe(HISTORY_JSON, history);

  try {
    await addDoc(collection(db, "reports"), {
      ...newRun,
      createdAt: serverTimestamp()
    });
    console.log("Reporte guardado en Firestore y en history.json correctamente.");
  } catch (err) {
    console.error("Error al subir reporte a Firestore:", err.message);
  }

  console.log("Guardado finalizado.\n");
  process.exit(0);
})();
