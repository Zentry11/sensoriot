/*
import express from "express";
import db from "../db.js";

const router = express.Router();

//  Ruta para recibir datos del ESP32
router.post("/data", async (req, res) => {
  try {
    const { token, mensaje } = req.body;

    if (!token || !mensaje)
      return res.status(400).json({ error: "Faltan datos" });

    const [pulsera] = await db.query(
      "SELECT id_pulsera FROM pulseras WHERE codigo = ?",
      [token]
    );

    if (!pulsera.length)
      return res.status(404).json({ error: "Pulsera no encontrada" });

    const pulsera_id = pulsera[0].id_pulsera;

    let incremento = 0;
    if (mensaje.toLowerCase().includes("brusco")) incremento = 1;

    await db.query(
      "INSERT INTO alertas (pulsera_id, mensaje, contador_movimientos_bruscos) VALUES (?, ?, ?)",
      [pulsera_id, mensaje, incremento]
    );

    //  MODIFICADO: emitir evento en tiempo real
    const io = req.app.get("io");
    io.emit("nuevaAlerta", { token, mensaje });

    res.json({ success: true, message: "Dato recibido correctamente" });
  } catch (error) {
    console.error(" Error en /data:", error);
    res.status(500).json({ error: "Error al procesar datos del sensor" });
  }
});

//  Ruta para obtener alertas por código de pulsera
router.get("/alertas/:codigo", async (req, res) => {
  try {
    const { codigo } = req.params;

    const [pulsera] = await db.query(
      "SELECT id_pulsera FROM pulseras WHERE codigo = ?",
      [codigo]
    );

    if (!pulsera.length)
      return res.status(404).json({ error: "Pulsera no encontrada" });

    const pulsera_id = pulsera[0].id_pulsera;

    const [alertas] = await db.query(
      "SELECT id, mensaje, fecha FROM alertas WHERE pulsera_id = ? ORDER BY fecha DESC",
      [pulsera_id]
    );

    const [contador] = await db.query(
      "SELECT SUM(contador_movimientos_bruscos) AS total_movimientos FROM alertas WHERE pulsera_id = ?",
      [pulsera_id]
    );

    res.json({
      codigo,
      movimientos_bruscos: contador[0].total_movimientos || 0,
      historial: alertas,
    });
  } catch (error) {
    console.error(" Error en /alertas:", error);
    res.status(500).json({ error: "Error al obtener alertas" });
  }
});

export default router; */

