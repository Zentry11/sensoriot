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

// ======================
// 🔐 CONFIGURACIÓN CORS PARA PRODUCCIÓN
// ======================
const corsOptions = {
  origin: function (origin, callback) {
    // Lista de orígenes permitidos
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://sensoriot.onrender.com',
      'https://sensoriot-frontend.onrender.com',
      'https://sensoriot-backend.onrender.com',
      process.env.FRONTEND_URL // Variable de entorno en Render
    ];
    
    // Permitir peticiones sin origen (como Postman o servidor a servidor)
    if (!origin) {
      return callback(null, true);
    }
    
    // Verificar si el origen está en la lista permitida
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ Origen bloqueado por CORS:', origin);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['Content-Length', 'Authorization'],
  maxAge: 86400 // 24 horas
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Habilitar pre-flight para todas las rutas

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ======================
// 🚀 INICIALIZAR TWILIO
// ======================
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// ======================
// 🔍 RUTA DE PRUEBA/HEALTH CHECK
// ======================
app.get("/", (req, res) => {
  res.json({ 
    message: "🚀 API SensorIoT funcionando", 
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    service: "sensoriot-backend",
    time: new Date().toISOString()
  });
});

// ======================
// 🔐 RUTAS DE AUTENTICACIÓN
// ======================
app.use("/api/auth", authRoutes);

// ======================
// 📡 RUTA PARA DATOS DEL ESP32
// ======================
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
    // ----------------------------------------------------------
    const esCaida =
      mensaje.toLowerCase().includes("caída detectada") ||
      mensaje.toLowerCase().includes("caida detectada");

    if (esCaida) {
      console.log("⚠️ Se detectó una caída → enviando WhatsApp...");

      // ----------------------------------------------------------
      // 4️⃣ OBTENER USUARIO Y NOMBRE DE PULSERA
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

// ======================
// 🔍 CONSULTAR ALERTAS POR TOKEN
// ======================
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

// ======================
// 📌 OTRAS RUTAS
// ======================
app.use("/api", usuariosRoutes);
app.use("/api/monitoreo", monitoreoRoutes);
app.use("/api/admin", adminRoutes);

// ======================
// 🚀 INICIAR SERVIDOR
// ======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});