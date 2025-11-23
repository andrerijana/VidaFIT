// save-results.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import puppeteer from "puppeteer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== RUTAS =====
const ROOT = __dirname;
const REPORTS_DIR = path.join(ROOT, "custom-report");
const PDFS_DIR = path.join(ROOT, "custom-report", "pdfs");
const HISTORY_JSON = path.join(ROOT, "custom-report", "history.json");

// Crear carpeta PDFs si no existe
if (!fs.existsSync(PDFS_DIR)) {
  fs.mkdirSync(PDFS_DIR, { recursive: true });
  console.log("Carpeta PDFs creada:", PDFS_DIR);
}

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

function extractDate() {
  return new Date().toISOString();
}

// Contar tests desde results.json
function countResults(suites) {
  let passed = 0, failed = 0, total = 0;
  for (const s of suites || []) {
    if (s.specs) {
      for (const spec of s.specs) {
        for (const test of spec.tests || []) {
          for (const result of test.results || []) {
            total++;
            if (result.status === "passed") passed++;
            else if (["failed", "timedOut"].includes(result.status)) failed++;
          }
        }
      }
    }
    if (s.suites) {
      const inner = countResults(s.suites);
      passed += inner.passed;
      failed += inner.failed;
      total += inner.total;
    }
  }
  return { passed, failed, total };
}

// ===== GENERAR PDF =====
async function generarPDF() {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Ruta del HTML original
    const originalHtmlPath = path.join(REPORTS_DIR, "index.html");
    const htmlPath = `file://${originalHtmlPath}`;

    await page.goto(htmlPath, { waitUntil: "networkidle0" });

    // Generar nombre del PDF
    const pdfName = `reporte_${Date.now()}.pdf`;
    const pdfPath = path.join(PDFS_DIR, pdfName);

    // Crear PDF desde Puppeteer
    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    console.log("PDF generado correctamente:", pdfName);

    // Renombrar index.html -> reporte_xxx.html
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


// ===== MAIN =====
(async () => {
  console.log("Iniciando guardado de resultados...");

  const history = readJSONSafe(HISTORY_JSON);

  const newRun = {
    date: extractDate(),
    total: 0,
    passed: 0,
    failed: 0,
    duration: 0,
    htmlFile: `http://localhost:5000/reports-custom/index.html`,
    pdfFile: "",
    createdAt: new Date().toISOString()
  };

  // ===== LEER results.json =====
  const jsonPath = path.join(ROOT, "playwright-report", "results.json");

  if (fs.existsSync(jsonPath)) {
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    const { passed, failed, total } = countResults(data.suites || []);
    newRun.total = total;
    newRun.passed = passed;
    newRun.failed = failed;
    newRun.duration = Math.round((data.stats?.duration / 1000) || 0);
    console.log("Datos obtenidos desde results.json");
  }

  // ===== GENERAR NUEVO PDF =====
  const pdfName = await generarPDF();
  if (pdfName) {
    newRun.pdfFile = `http://localhost:5000/pdfs/${pdfName.pdf}`;    
    newRun.htmlFile = `http://localhost:5000/reports-custom/${pdfName.html}`;
  }

  // ===== Guardar en history.json =====
  history.push(newRun);
  writeJSONSafe(HISTORY_JSON, history);

  // ===== Guardar en Firestore =====
  try {
    await addDoc(collection(db, "reports"), {
      ...newRun,
      createdAt: serverTimestamp()
    });
    console.log("Reporte guardado en Firestore.");
  } catch (err) {
    console.error("Error al subir reporte a Firestore:", err.message);
  }

  console.log("Guardado finalizado.");
  process.exit(0);
})();
