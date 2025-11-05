import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

// Directorios
const pdfDir = "./custom-report/pdfs";
const reportsDir = "./custom-report/reports";
const historyPath = "./custom-report/history.json";
const resultsPath = "./playwright-report/results.json";

// Crear carpetas si no existen
if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

// Leer historial existente
let history = [];
if (fs.existsSync(historyPath)) {
  try {
    history = JSON.parse(fs.readFileSync(historyPath, "utf-8"));
  } catch (err) {
    console.error("Error leyendo history.json:", err);
  }
}

// Leer resultados de Playwright
let stats = null;
if (fs.existsSync(resultsPath)) {
  try {
    const raw = JSON.parse(fs.readFileSync(resultsPath, "utf-8"));
    stats = raw.stats;
  } catch (err) {
    console.error("Error leyendo results.json:", err);
  }
}

const newResult = {
  date: new Date().toLocaleString(),
  total: stats ? stats.expected + stats.unexpected : 0,
  passed: stats ? stats.expected : 0,
  failed: stats ? stats.unexpected : 0,
  duration: stats ? Math.round(stats.duration / 1000) : 0,
  pdfFile: "",
  htmlFile: ""
};

// Crear nombres únicos de archivos
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const pdfName = `reporte_${timestamp}.pdf`;
const htmlName = `reporte_${timestamp}.html`;
const pdfPath = path.join(pdfDir, pdfName);
const htmlPath = path.join(reportsDir, htmlName);

newResult.pdfFile = `./pdfs/${pdfName}`;
newResult.htmlFile = `./reports/${htmlName}`;

// Generar PDF e HTML únicos
(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();

    // Cargar el reporte original
    const reportPath = `file://${path.resolve("./custom-report/index.html")}`;
    await page.goto(reportPath, { waitUntil: "networkidle0" });

    // Guardar HTML único
    const htmlContent = await page.content();
    fs.writeFileSync(htmlPath, htmlContent);

    // Generar PDF único
    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true
    });

    await browser.close();

    console.log("HTML y PDF generados correctamente.");

  } catch (err) {
    console.error("Error al generar reportes:", err);
  }

  // Guardar historial
  history.push(newResult);
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
  console.log("Historial actualizado correctamente.");
})();
