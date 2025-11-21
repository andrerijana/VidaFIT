// server.js
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from "util";
import admin from "firebase-admin";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============== FIREBASE ADMIN (SERVIDOR) ===============
const require = createRequire(import.meta.url);
const serviceAccount = require("./serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const adminAuth = admin.auth();
const adminDb = admin.firestore();

const app = express();
const execAsync = promisify(exec);

// ===============================
// CONFIGURACIÓN BÁSICA
// ===============================
app.use(cors({
  origin: "http://127.0.0.1:5500",
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type", "X-User-Role"]
}));

app.use(express.json());

// ===============================
// SERVIR EL REPORTE PERSONALIZADO
// ===============================
const customReportDir = path.join(__dirname, "custom-report");

if (!fs.existsSync(customReportDir)) {
  console.warn(`[AVISO] La carpeta custom-report no existe: ${customReportDir}`);
} else {
  console.log(`[OK] Sirviendo reporte personalizado desde: ${customReportDir}`);
}

app.use("/reports-custom", express.static(customReportDir));

// ===============================
// SERVIR VIDEOS PARA EL REPORTE
// ===============================
const videosDir = path.join(__dirname, "custom-report", "videos");

if (!fs.existsSync(videosDir)) {
  console.warn(`[AVISO] La carpeta de videos no existe: ${videosDir}`);
} else {
  console.log(`[OK] Sirviendo videos desde: ${videosDir}`);
}

app.use("/videos", express.static(videosDir));

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
        console.log(
          `[${new Date().toLocaleTimeString()}] Finalizó correctamente: ${label || cmd}\n`
        );
      } else {
        console.warn(
          `[${new Date().toLocaleTimeString()}] Comando finalizado con errores (${code}): ${label || cmd}`
        );
      }
      resolve(code);
    });
  });
}

// ===============================
// ENDPOINTS ADMIN USUARIOS
// ===============================

// Crear usuario (admin)
// =======================================================
//  NUEVA VERSIÓN REAL DE CREAR USUARIO (ADMIN)
// =======================================================
app.post("/admin/create-user", async (req, res) => {
  try {
    const roleHeader = (req.headers["x-user-role"] || "").toString().toLowerCase();

    if (roleHeader !== "admin") {
      return res.status(403).json({
        ok: false,
        message: "Permiso denegado. Solo administradores pueden crear usuarios."
      });
    }

    const { nombre, apellido, correo, password, role } = req.body || {};

    // --------------------------
    // VALIDACIONES DE CAMPOS
 
    if (!nombre || !apellido || !correo || !password) {
      return res.status(400).json({
        ok: false,
        message: "Todos los campos son obligatorios."
      });
    }

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      return res.status(400).json({
        ok: false,
        message: "Correo inválido."
      });
    }

    // Validación de contraseña segura
    const passValid =
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!passValid) {
      return res.status(400).json({
        ok: false,
        message:
          "La contraseña debe tener mínimo 8 caracteres, mayúscula, minúscula, número y caracter especial."
      });
    }

    const finalRole = role === "admin" ? "admin" : "qa";

    // --------------------------
    // VALIDAR SI EL CORREO YA EXISTE EN AUTH
  
    let emailExists = false;
    try {
      await adminAuth.getUserByEmail(correo);
      emailExists = true;
    } catch (err) {
      emailExists = false; // No existe → OK
    }

    if (emailExists) {
      return res.status(400).json({
        ok: false,
        message: "El correo ya está registrado."
      });
    }

    // --------------------------
  
    const userRecord = await adminAuth.createUser({
      email: correo,
      password,
      displayName: `${nombre} ${apellido}`,
      disabled: false
    });

    console.log(`[ADMIN] Usuario creado: ${userRecord.uid} (${correo})`);

    // --------------------------
    // GUARDAR EN FIRESTORE
   
    await adminDb.collection("users").doc(userRecord.uid).set({
      nombre,
      apellido,
      correo,
      role: finalRole,
      status: "active",
      createdAt: new Date().toISOString(),
      uid: userRecord.uid
    });

    return res.json({
      ok: true,
      message: "Usuario creado correctamente.",
      uid: userRecord.uid
    });

  } catch (err) {
    console.error("❌ Error creando usuario:", err);
    return res.status(500).json({
      ok: false,
      message: err.message || "Error interno creando usuario."
    });
  }
});


// Listar usuarios (admin)
app.get("/admin/list-users", async (req, res) => {
  try {
    const roleHeader = (req.headers["x-user-role"] || "").toString().toLowerCase();
    if (roleHeader !== "admin") {
      return res.status(403).json({ ok: false, message: "Solo admin puede listar usuarios." });
    }

    const snap = await adminDb.collection("users").get();
    const users = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({ ok: true, users });
  } catch (err) {
    console.error("Error listando usuarios:", err);
    res.status(500).json({ ok: false, message: err.message || "Error interno" });
  }
});

// Actualizar rol (admin)
app.post("/admin/update-user-role", async (req, res) => {
  try {
    const roleHeader = (req.headers["x-user-role"] || "").toString().toLowerCase();
    if (roleHeader !== "admin") {
      return res.status(403).json({ ok: false, message: "Solo admin puede cambiar roles." });
    }

    const { uid, role } = req.body || {};
    if (!uid || !role) {
      return res.status(400).json({ ok: false, message: "uid y role son requeridos." });
    }

    const finalRole = role === "admin" ? "admin" : "qa";

    await adminDb.collection("users").doc(uid).update({
      role: finalRole
    });

    res.json({ ok: true, message: "Rol actualizado correctamente." });
  } catch (err) {
    console.error("Error actualizando rol:", err);
    res.status(500).json({ ok: false, message: err.message || "Error interno" });
  }
});

// Actualizar estado (suspender / reactivar)
app.post("/admin/update-user-status", async (req, res) => {
  try {
    const roleHeader = (req.headers["x-user-role"] || "").toString().toLowerCase();
    if (roleHeader !== "admin") {
      return res.status(403).json({ ok: false, message: "Solo admin puede cambiar estado." });
    }

    const { uid, status } = req.body || {};
    if (!uid || !status) {
      return res.status(400).json({ ok: false, message: "uid y status son requeridos." });
    }

    const disabled = status === "suspended";

    // Actualizar en Auth
    await adminAuth.updateUser(uid, { disabled });

    // Actualizar en Firestore
    await adminDb.collection("users").doc(uid).update({
      status
    });

    res.json({ ok: true, message: "Estado actualizado correctamente." });
  } catch (err) {
    console.error("Error actualizando estado de usuario:", err);
    res.status(500).json({ ok: false, message: err.message || "Error interno" });
  }
});

// Eliminar usuario
app.delete("/admin/delete-user", async (req, res) => {
  try {
    const roleHeader = (req.headers["x-user-role"] || "").toString().toLowerCase();
    if (roleHeader !== "admin") {
      return res.status(403).json({ ok: false, message: "Solo admin puede eliminar usuarios." });
    }

    const { uid } = req.body || {};
    if (!uid) {
      return res.status(400).json({ ok: false, message: "uid es requerido." });
    }

    // Borrar en Auth
    await adminAuth.deleteUser(uid);
    // Borrar en Firestore
    await adminDb.collection("users").doc(uid).delete();

    res.json({ ok: true, message: "Usuario eliminado correctamente." });
  } catch (err) {
    console.error("Error eliminando usuario:", err);
    res.status(500).json({ ok: false, message: err.message || "Error interno" });
  }
});

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

    res.json({
      ok: true,
      message: "Ejecución iniciada. Los resultados aparecerán en el panel al finalizar."
    });

    (async () => {
      try {
        const code = await run("npx playwright test login.spec.js", "Ejecución de pruebas (Solo Login)");
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
