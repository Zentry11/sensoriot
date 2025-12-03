/*import express from "express";
import db from "../db.js";

const router = express.Router();

// 📍 Asociar o monitorear una pulsera
app.post("/api/pulseras/asociar", async (req, res) => {
  const { codigo, usuario_id } = req.body;

  if (!codigo || !usuario_id) {
    return res.status(400).json({ message: "Faltan datos" });
  }

  try {
    // 1️⃣ Verificamos si la pulsera existe
    const [pulseraRows] = await db.query(
      "SELECT * FROM pulseras WHERE codigo = ?",
      [codigo]
    );

    if (pulseraRows.length === 0) {
      return res.status(404).json({ message: "La pulsera no existe" });
    }

    const pulsera = pulseraRows[0];

    // 2️⃣ Si no tiene dueño, la asignamos al usuario
    if (!pulsera.usuario_id) {
      await db.query(
        "UPDATE pulseras SET usuario_id = ?, estado = 'Activa' WHERE id_pulsera = ?",
        [usuario_id, pulsera.id_pulsera]
      );

      return res.json({ message: "Pulsera asignada correctamente" });
    }

    // 3️⃣ Si la pulsera ya tiene dueño y no es el mismo usuario, lo agregamos como monitor
    if (pulsera.usuario_id !== usuario_id) {
      // Verificamos si ya la está monitoreando
      const [monitoreoExistente] = await db.query(
        "SELECT * FROM monitoreos WHERE usuario_id = ? AND id_pulsera = ?",
        [usuario_id, pulsera.id_pulsera]
      );

      if (monitoreoExistente.length > 0) {
        return res
          .status(400)
          .json({ message: "Ya estás monitoreando esta pulsera" });
      }

      // Insertamos en la tabla monitoreos
      await db.query(
        "INSERT INTO monitoreos (usuario_id, id_pulsera) VALUES (?, ?)",
        [usuario_id, pulsera.id_pulsera]
      );

      return res.json({
        message: "Pulsera agregada como monitoreada",
      });
    }

    // 4️⃣ Si el usuario ya es dueño
    return res.status(400).json({
      message: "La pulsera ya está asignada a este usuario",
    });
  } catch (error) {
    console.error("Error al asociar pulsera:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
});

export default router;
*/