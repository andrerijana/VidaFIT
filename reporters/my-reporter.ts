// reporters/my-reporter.ts
import type {
  FullConfig,
  Reporter,
  Suite,
  TestCase,
  TestResult
} from '@playwright/test/reporter';
import { mkdirSync, writeFileSync, copyFileSync } from 'fs';
import { dirname, join } from 'path';


type StepLike = {
  title: string;
  duration: number; // ms
  error?: string;
  steps?: StepLike[];
};

type TestItem = {
  title: string;
  file: string;
  project?: string;
  status: 'passed' | 'failed' | 'skipped' | 'timedOut' | 'interrupted' | 'flaky';
  duration: number; // ms
  error?: string;
  steps?: StepLike[];
  videoPath?: string;
};

class MyCustomHtmlReporter implements Reporter {
  private results: TestItem[] = [];
  private startTime = Date.now();
  private outputFile = 'custom-report/index.html';
  private passed = 0;
  private failed = 0;

  onBegin(config: FullConfig, suite: Suite) {
    // Puedes personalizar la salida con env vars, etc.
    // Ej: this.outputFile = process.env.MY_REPORT_OUT || this.outputFile;
  }

onTestEnd(test: TestCase, result: TestResult) {
  const status =
    (result.status as TestItem['status']) ||
    (result.error ? 'failed' : 'passed');

  if (status === 'passed') this.passed++;
  else if (status === 'failed' || status === 'timedOut' || status === 'interrupted') {
    this.failed++;
  }

  // Buscar el attachment de video que Playwright genera
  const videoAttachment = result.attachments.find(
    a =>
      (a.name && a.name.toLowerCase().includes('video')) ||
      (a.contentType && a.contentType.includes('video')) ||
      (a.path && a.path.endsWith('.webm'))
  );

  // Pasos (si usas test.step)
  // @ts-ignore
  const steps = (result.steps as any[] | undefined)?.map(s => this.serializeStep(s));

  // ==========================
  //  COPIAR VIDEO A /custom-report/videos
  // ==========================
  let finalVideoPath: string | undefined = undefined;

  if (videoAttachment?.path) {
    try {
      const videosDir = join(process.cwd(), "custom-report", "videos");
      mkdirSync(videosDir, { recursive: true });

      // Nombre amigable para el archivo de video
      const safeTitle = test.title.replace(/[^\w\d_-]+/g, "_").slice(0, 40);
      const videoFileName = `video_${safeTitle}_${Date.now()}.webm`;
      const destPath = join(videosDir, videoFileName);

      // Copiar el archivo desde la ruta temporal de Playwright
      copyFileSync(videoAttachment.path, destPath);

      // Ruta relativa que usará el HTML (index.html está en custom-report)
      finalVideoPath = `videos/${videoFileName}`;
      console.log("Video copiado a:", finalVideoPath);
    } catch (e) {
      console.error("Error copiando video:", e);
    }
  }

  this.results.push({
    title: test.title,
    file: test.location?.file || '',
    project: test.parent?.project()?.name,
    status,
    duration: result.duration,
    error: result.error ? (result.error.message || String(result.error)) : undefined,
    steps,
    videoPath: finalVideoPath // 👈 AHORA apunta a custom-report/videos/...
  });
}


  private serializeStep(s: any): StepLike {
    const childSteps = (s.steps || []).map((c: any) => this.serializeStep(c));
    return {
      title: s.title || 'step',
      duration: typeof s.duration === 'number' ? s.duration : 0,
      error: s.error ? (s.error.message || String(s.error)) : undefined,
      steps: childSteps
    };
  }

  async onEnd() {
    const total = this.results.length;
    const durationSec = ((Date.now() - this.startTime) / 1000).toFixed(1);

    const data = {
      meta: {
        generatedAt: new Date().toISOString(),
        durationSec,
        total,
        passed: this.passed,
        failed: this.failed
      },
      tests: this.results
    };

    const html = this.renderHtml(data);
    mkdirSync(dirname(this.outputFile), { recursive: true });
 writeFileSync(this.outputFile, html, 'utf-8');
// Abrir automáticamente el reporte en navegador
import('child_process').then(({ exec }) => {
  const path = this.outputFile.replace(/\//g, '\\'); // para Windows
  exec(`start ${path}`);  // Windows: usa 'start'
  // Si estuvieras en Mac/Linux sería:
  // exec(`open ${this.outputFile}`);
});

console.log(`\n🟢 Custom report generado y abierto en: ${this.outputFile}\n`);

  }

  private renderHtml(payload: any) {
    const json = JSON.stringify(payload).replace(/</g, '\\u003c'); // evita HTML injection
    return /* html */ `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>QA Reporte - VidaFIT</title>
  <style>
      .chart-card {
      background: var(--panel);
      border-radius: 20px;
      padding: 16px;
      margin: 16px 0 24px;
      display: flex;
      justify-content: center; /* 👈 gráfico centrado */
    }
      .qa-owner {
  margin-top: 10px;
  margin-bottom: 20px;
  font-size: 15px;
  font-weight: 500;
  color: var(--ink);
}
    :root { --bg:#0b1020; --panel:#121832; --ink:#e9eefc; --muted:#9fb0e3; --ok:#2fd285; --ko:#ff5d6a; --card:#0f142a; }
    html,body { margin:0; background:var(--bg); color:var(--ink); font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji"; }
    .wrap { max-width: 1200px; margin: 24px auto; padding: 0 16px; }
    .header { display:flex; gap:16px; align-items:center; margin-bottom: 20px; }
    .pill { background:var(--panel); padding:8px 12px; border-radius:999px; color:var(--muted); font-size:14px; }
    .stats { display:flex; gap:12px; flex-wrap: wrap; }
    .stat { background:var(--panel); border-radius:16px; padding:12px 16px; }
    .stat b { font-size:20px; }
    .chart-card { background:var(--panel); border-radius:20px; padding:16px; margin: 16px 0 24px; }
    .grid { display:grid; grid-template-columns: repeat(12, 1fr); gap: 16px; }
    .test-card { grid-column: span 12; background:var(--card); border-radius:16px; padding:14px 16px; border:1px solid #1a2347; }
    .row { display:flex; gap:10px; align-items:center; flex-wrap: wrap; }
    .badge { border-radius:10px; padding:4px 8px; font-size:12px; }
    .passed { background: color-mix(in oklab, var(--ok) 20%, transparent); color: var(--ok); border:1px solid var(--ok); }
    .failed { background: color-mix(in oklab, var(--ko) 15%, transparent); color: var(--ko); border:1px solid var(--ko); }
    .muted { color:var(--muted); font-size:12px; }
    .title { font-weight:600; }
    details { margin-top:8px; }
    summary { cursor:pointer; color:var(--muted); }
    .step { margin: 6px 0 6px 12px; padding-left:8px; border-left:2px solid #29335b; }
    .video { margin-top: 10px; border-radius: 12px; border:1px solid #1a2347; overflow:hidden; }
    code { background:#0b1229; padding:2px 6px; border-radius:8px; }
    .tiny { font-size: 11px; color:#8aa2e2; }
  </style>
</head>
<body>
  <div class="wrap">
 <div class="header">
  <h1 style="margin:0;">QA Reporte - VidaFIT</h1>
  <span class="pill">Generado: <span id="genAt"></span></span>
  <span class="pill">Duración total: <span id="dur"></span> s</span>
  <div class="stats">
    <span class="stat">Total: <b id="total"></b></span>
    <span class="stat">Passed: <b id="passed" style="color:var(--ok)"></b></span>
    <span class="stat">Failed: <b id="failed" style="color:var(--ko)"></b></span>
  </div>
</div>

<!-- 👇 Nuevo bloque bien separado -->
<div class="qa-owner">
  QA Especialista: <b>Andrea Rijana</b>
</div>
    <div class="chart-card">
      <canvas id="bar" height="100"></canvas>
    </div>

    <div id="tests" class="grid"></div>
  </div>

<script>
// Datos embebidos:
const REPORT_DATA = ${json};

function el(tag, attrs={}, children=[]) {
  const n = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v]) => {
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else n.setAttribute(k, v);
  });
  [].concat(children).forEach(c => c && n.appendChild(c));
  return n;
}

function renderMeta() {
  document.getElementById('genAt').textContent = new Date(REPORT_DATA.meta.generatedAt).toLocaleString();
  document.getElementById('dur').textContent = REPORT_DATA.meta.durationSec;
  document.getElementById('total').textContent = REPORT_DATA.meta.total;
  document.getElementById('passed').textContent = REPORT_DATA.meta.passed;
  document.getElementById('failed').textContent = REPORT_DATA.meta.failed;
}

function renderChart() {
  // Mini bar chart sin librerías (canvas API):
  const canvas = document.getElementById('bar');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const pad = 20;
  const vals = [REPORT_DATA.meta.passed, REPORT_DATA.meta.failed];
  const max = Math.max(1, ...vals);
  const labels = ['Passed', 'Failed'];

  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = '#9fb0e3';
  ctx.font = '12px system-ui';

  const barW = (W - pad*2) / (vals.length * 2);
  vals.forEach((v, i) => {
    const h = Math.round((H - pad*2) * (v / max));
    const x = pad + i * barW * 2 + barW * 0.5;
    const y = H - pad - h;
    ctx.fillStyle = i === 0 ? '#2fd285' : '#ff5d6a';
    ctx.fillRect(x, y, barW, h);
    ctx.fillStyle = '#9fb0e3';
    ctx.fillText(labels[i], x, H - pad + 12);
    ctx.fillText(String(v), x, y - 4);
  });
}

function renderSteps(step, container) {
  const div = el('div', { class: 'step' }, [
    el('div', { class: 'row' }, [
      el('span', { class: 'title', text: step.title || 'step' }),
      el('span', { class: 'tiny' , text: step.duration ? '· ' + step.duration + ' ms' : '' }),
      step.error ? el('span', { class: 'badge failed', text: 'error' }) : null
    ])
  ]);
  container.appendChild(div);
  (step.steps || []).forEach(s => renderSteps(s, container));
}

function renderTests() {
  const root = document.getElementById('tests');
  REPORT_DATA.tests.forEach(t => {
    const statusBadge = el('span', { class: 'badge ' + (t.status === 'passed' ? 'passed' : 'failed'), text: t.status });
    const head = el('div', { class: 'row' }, [
      el('div', { class: 'title', text: t.title }),
      statusBadge,
      el('span', { class: 'muted', text: t.project ? '· ' + t.project : '' }),
      el('span', { class: 'muted', text: '· ' + (t.duration||0) + ' ms' })
    ]);

    const meta = el('div', { class: 'muted' }, [
      el('span', { text: t.file || '' })
    ]);

    const card = el('div', { class: 'test-card' }, [head, meta]);

    if (t.error) {
      card.appendChild(el('div', { }, [
        el('details', {}, [
          el('summary', { text: 'Ver error' }),
          el('pre', {}, [document.createTextNode(t.error)])
        ])
      ]));
    }

    if (t.steps && t.steps.length) {
      const det = el('details', {}, [
        el('summary', { text: 'Ver pasos' })
      ]);
      const cont = el('div');
      t.steps.forEach(s => renderSteps(s, cont));
      det.appendChild(cont);
      card.appendChild(det);
    }

    if (t.videoPath && (t.status !== 'passed')) {
      // Incrusta el video WebM solo en fallos
      const video = el('video', { class: 'video', controls: '', src: t.videoPath });
      card.appendChild(video);
    }

    root.appendChild(card);
  });
}

renderMeta();
renderChart();
renderTests();
</script>
</body>
</html>`;
  }
}

export default MyCustomHtmlReporter;