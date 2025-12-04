import express from "express";
import pool from "../db.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// ============================================
//  MIDDLEWARE PARA VERIFICAR EL TOKEN JWT
// ============================================
function verificarToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token no proporcionado" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: "Token inválido o expirado" });
  }
}

// Registrar un nuevo token (pulsera) vinculado al usuario
router.post("/registrar", verificarToken, async (req, res) => {
  try {
    const { token, nombre_pulsera } = req.body;
    const usuarioId = req.usuario.id;

    // Verificar si el token ya existe
    const [existe] = await pool.query("SELECT * FROM monitoreo WHERE token = ?", [token]);
    if (existe.length > 0) {
      return res.status(400).json({ error: "Este token ya está registrado o vinculado" });
    }

    await pool.query(
      "INSERT INTO monitoreo (usuario_id, token, nombre_pulsera) VALUES (?, ?, ?)",
      [usuarioId, token, nombre_pulsera || "Mi Pulsera"]
    );

    res.json({ mensaje: "✅ Pulsera registrada exitosamente" });
  } catch (error) {
    console.error("Error al registrar monitoreo:", error);
    res.status(500).json({ error: "Error al registrar la pulsera" });
  }
});

// Obtener todas las pulseras vinculadas al usuario
router.get("/mis-pulseras", verificarToken, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    const [pulseras] = await pool.query(
      "SELECT * FROM monitoreo WHERE usuario_id = ?",
      [usuarioId]
    );

    res.json(pulseras);
  } catch (error) {
    console.error("Error al obtener monitoreos:", error);
    res.status(500).json({ error: "Error al obtener las pulseras vinculadas" });
  }
});

// Eliminar una pulsera vinculada
router.delete("/:id", verificarToken, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { id } = req.params;

    const [resultado] = await pool.query(
      "DELETE FROM monitoreo WHERE id = ? AND usuario_id = ?",
      [id, usuarioId]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: "Pulsera no encontrada o no pertenece al usuario" });
    }

    res.json({ mensaje: "🗑️ Pulsera eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar monitoreo:", error);
    res.status(500).json({ error: "Error al eliminar la pulsera" });
  }
});

export default router;
