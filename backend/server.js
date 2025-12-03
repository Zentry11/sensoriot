// ======================
// 📦 IMPORTS
// ======================
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import db from "./db.js";
import authRoutes from "./routes/auth.js";
import usuariosRoutes from "./routes/usuarios.js";
import monitoreoRoutes from "./routes/monitoreo.js";
import adminRoutes from "./routes/admin.js";
import twilio from "twilio";

// ======================
// ⚙️ CONFIGURACIÓN BASE
// ======================
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// ======================
// 🚀 SERVIDOR
// ======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

// ======================
// 🔐 AUTENTICACIÓN
// ======================
app.use("/api/auth", authRoutes);

// ======================
// 🧠 CONEXIÓN MYSQL
// ======================
db.getConnection()
  .then(() => console.log("✅ Conexión MySQL lista"))
  .catch((err) => console.error("❌ Error en conexión MySQL:", err));

// ====================================================================
// 📡 RECIBIR DATOS DEL ESP32 + ENVIAR WHATSAPP SOLO EN CAÍDA REAL
// ====================================================================
app.post("/api/sensor/data", async (req, res) => {
  try {
    console.log("📩 Datos recibidos del ESP32:", req.body);
    const { token, mensaje, temperatura } = req.body;

    if (!token || !mensaje) {
      return res.status(400).json({ error: "Faltan token o mensaje" });
    }

    // ----------------------------------------------------------
    // 1️⃣ Buscar o registrar pulsera
    // ----------------------------------------------------------
    const [pulseras] = await db.query(
      "SELECT id FROM pulseras WHERE token = ?",
      [token]
    );

    let pulseraId;

    if (pulseras.length > 0) {
      pulseraId = pulseras[0].id;
    } else {
      const [result] = await db.query(
        "INSERT INTO pulseras (codigo, token, estado) VALUES (?, ?, 'activa')",
        [token, token]
      );
      pulseraId = result.insertId;
      console.log(`🆕 Nueva pulsera registrada: ${token}`);
    }

    // ----------------------------------------------------------
    // 2️⃣ Guardar alerta
    // ----------------------------------------------------------
    await db.query(
      "INSERT INTO alertas (pulsera_id, mensaje, temperatura, fecha) VALUES (?, ?, ?, NOW())",
      [pulseraId, mensaje, temperatura || null]
    );

    console.log(`✅ Alerta guardada para ${token}: ${mensaje}`);

    // ----------------------------------------------------------
    // 3️⃣ Detectar si ES una caída real
    // 🚫 No detectar "brusco"
    // ✔ Solo detectar cuando el ESP32 diga "caída detectada"
    // ----------------------------------------------------------
    const esCaida =
      mensaje.toLowerCase().includes("caída detectada") ||
      mensaje.toLowerCase().includes("caida detectada");

    if (esCaida) {
      console.log("⚠️ Se detectó una caída → enviando WhatsApp...");

      // ----------------------------------------------------------
      // 4️⃣ OBTENER USUARIO Y NOMBRE DE PULSERA DESDE MONITOREO
      // ----------------------------------------------------------
      const [monitoreo] = await db.query(
        "SELECT usuario_id, nombre_pulsera FROM monitoreo WHERE token = ? LIMIT 1",
        [token]
      );

      if (monitoreo.length > 0) {
        const usuarioId = monitoreo[0].usuario_id;
        const nombrePulsera = monitoreo[0].nombre_pulsera;

        // Obtener teléfono del usuario
        const [usuarios] = await db.query(
          "SELECT telefono FROM usuarios WHERE id = ?",
          [usuarioId]
        );

        if (usuarios.length > 0) {
          const telefonoUsuario = usuarios[0].telefono;

          // ----------------------------------------------------------
          // 5️⃣ Enviar WhatsApp 
          // ----------------------------------------------------------
          await client.messages.create({
            from: "whatsapp:+14155238886", // Twilio Sandbox
            to: `whatsapp:${telefonoUsuario}`,
            body:
              `🚨 *ALERTA DE CAÍDA DETECTADA*\n\n` +
              `👤 *Pulsera:* ${nombrePulsera}\n` +
              `🆔 *Token:* ${token}\n` +
              `🌡 *Temperatura:* ${temperatura || "N/A"} °C\n` +
              `📩 *Mensaje recibido:* ${mensaje}\n\n` +
              `‼ Se requiere asistencia inmediata.`
          });

          console.log("📲 WhatsApp enviado a:", telefonoUsuario);
        }
      }
    }

    res.json({ success: true });

  } catch (error) {
    console.error("❌ Error en /api/sensor/data:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ====================================================================
// 🔍 CONSULTAR ALERTAS POR TOKEN
// ====================================================================
app.get("/api/sensor/alertas/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const [pulseraRows] = await db.query(
      "SELECT * FROM pulseras WHERE token = ?",
      [token]
    );

    if (pulseraRows.length === 0) {
      return res.status(404).json({ error: "Pulsera no encontrada" });
    }

    const pulsera = pulseraRows[0];

    const [alertas] = await db.query(
      `SELECT id AS id, mensaje, temperatura, fecha 
       FROM alertas 
       WHERE pulsera_id = ? 
       ORDER BY fecha DESC`,
      [pulsera.id]
    );

    const movimientos_bruscos = alertas.filter((a) =>
      a.mensaje.toLowerCase().includes("brusco")
    ).length;

    const historialTemperatura = alertas
      .filter((a) => a.temperatura !== null && !isNaN(a.temperatura))
      .map((a) => ({
        fecha: a.fecha,
        temperatura: parseFloat(a.temperatura),
      }))
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    res.json({
      codigo: pulsera.codigo,
      token: pulsera.token,
      movimientos_bruscos,
      historial: alertas.map((a) => ({
        id: a.id,
        mensaje: a.mensaje,
        fecha: a.fecha,
      })),
      historialTemperatura,
    });

  } catch (error) {
    console.error("❌ Error al obtener datos de la pulsera:", error);
    res.status(500).json({ error: "Error al obtener datos" });
  }
});

// ====================================================================
// 📌 Rutas extra
// ====================================================================
app.use("/api", usuariosRoutes);
app.use("/api/monitoreo", monitoreoRoutes);
app.use("/api/admin", adminRoutes);
