import express from "express";
import pool from "../db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const router = express.Router();

// ============================================
//  MIDDLEWARE PARA VERIFICAR TOKEN
// ============================================
function verificarToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token no proporcionado" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Token inválido o expirado" });
  }
}

// ============================================
//  RUTA DE ESTADÍSTICAS (ADMIN DASHBOARD)
// ============================================
router.get("/estadisticas", verificarToken, async (req, res) => {
  try {
    if (req.usuario.rol !== "admin") {
      return res.status(403).json({ error: "Acceso denegado" });
    }

    const [usuarios] = await pool.query("SELECT COUNT(*) AS total FROM usuarios");
    const [pulseras] = await pool.query("SELECT COUNT(*) AS total FROM pulseras");
    const [monitoreos] = await pool.query("SELECT COUNT(*) AS total FROM monitoreo");
    const [alertas] = await pool.query("SELECT COUNT(*) AS total FROM alertas");

    res.json({
      usuarios: usuarios[0].total,
      pulseras: pulseras[0].total,
      monitoreos: monitoreos[0].total,
      alertas: alertas[0].total,
    });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
});

// ============================================
//  PULSERAS ACTIVAS VS INACTIVAS
// ============================================
router.get("/estadisticas/pulseras", verificarToken, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT estado, COUNT(*) AS total FROM pulseras GROUP BY estado");
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener estadísticas de pulseras:", error);
    res.status(500).json({ error: "Error al obtener estadísticas de pulseras" });
  }
});

// ============================================
//  MONITOREOS POR DIA
// ============================================
router.get("/estadisticas/monitoreos", verificarToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT DATE(fecha_registro) AS fecha, COUNT(*) AS total
      FROM monitoreo
      GROUP BY DATE(fecha_registro)
      ORDER BY fecha DESC
      LIMIT 10
    `);
    res.json(rows.reverse());
  } catch (error) {
    console.error("Error al obtener monitoreos por día:", error);
    res.status(500).json({ error: "Error al obtener monitoreos por día" });
  }
});

// ============================================
//  USUARIOS REGISTRADOS POR MES (COMPATIBLE CON ONLY_FULL_GROUP_BY)
// ============================================
router.get("/estadisticas/usuarios", verificarToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        MIN(DATE_FORMAT(fecha_registro, '%b')) AS mes,
        COUNT(*) AS total
      FROM usuarios
      GROUP BY YEAR(fecha_registro), MONTH(fecha_registro)
      ORDER BY YEAR(fecha_registro), MONTH(fecha_registro)
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener usuarios por mes:", error);
    res.status(500).json({ error: "Error al obtener usuarios por mes" });
  }
});

// ============================================
//  ALERTAS POR TIPO
// ============================================
router.get("/estadisticas/alertas", verificarToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        CASE 
          WHEN mensaje LIKE '%caída%' THEN 'Caídas detectadas'
          WHEN mensaje LIKE '%movimiento%' THEN 'Movimiento normal'
          ELSE 'Otras alertas'
        END AS tipo,
        COUNT(*) AS total
      FROM alertas
      GROUP BY tipo
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener alertas por tipo:", error);
    res.status(500).json({ error: "Error al obtener alertas por tipo" });
  }
});

// ============================================
// CRUD DE PULSERAS
// ============================================
router.get("/pulseras", verificarToken, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM pulseras ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    console.error("❌ Error al obtener pulseras:", err);
    res.status(500).json({ error: "Error al obtener pulseras" });
  }
});

router.post("/pulseras", verificarToken, async (req, res) => {
  try {
    const { codigo, token, estado } = req.body;
    if (!codigo || !token || !estado) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    await pool.query(
      "INSERT INTO pulseras (codigo, token, estado) VALUES (?, ?, ?)",
      [codigo, token, estado]
    );
    res.json({ mensaje: "✅ Pulsera registrada exitosamente" });
  } catch (err) {
    console.error("❌ Error al registrar pulsera:", err);
    res.status(500).json({ error: "Error al registrar pulsera" });
  }
});

router.put("/pulseras/:id", verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo, token, estado } = req.body;
    const [result] = await pool.query(
      "UPDATE pulseras SET codigo=?, token=?, estado=? WHERE id=?",
      [codigo, token, estado, id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Pulsera no encontrada" });

    res.json({ mensaje: "✅ Pulsera actualizada correctamente" });
  } catch (err) {
    console.error("❌ Error al actualizar pulsera:", err);
    res.status(500).json({ error: "Error al actualizar pulsera" });
  }
});

router.delete("/pulseras/:id", verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM pulseras WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Pulsera no encontrada" });
    res.json({ mensaje: "🗑️ Pulsera eliminada correctamente" });
  } catch (err) {
    console.error("❌ Error al eliminar pulsera:", err);
    res.status(500).json({ error: "Error al eliminar pulsera" });
  }
});

// ============================================
// CRUD DE USUARIOS
// ============================================
router.get("/usuarios", verificarToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, nombres, apellidos, telefono, correo, rol, fecha_registro FROM usuarios ORDER BY id DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error("❌ Error al obtener usuarios:", error);
    res.status(500).json({ mensaje: "Error al obtener usuarios" });
  }
});

router.post("/usuarios", verificarToken, async (req, res) => {
  try {
    const { nombres, apellidos, telefono, correo, rol, contraseña } = req.body;

    if (!nombres || !apellidos || !telefono || !correo || !rol || !contraseña) {
      return res.status(400).json({ mensaje: "Faltan datos obligatorios" });
    }

    const hashedPassword = await bcrypt.hash(contraseña, 10);

    await pool.query(
      "INSERT INTO usuarios (nombres, apellidos, telefono, correo, contraseña, rol, fecha_registro) VALUES (?, ?, ?, ?, ?, ?, NOW())",
      [nombres, apellidos, telefono, correo, hashedPassword, rol]
    );

    res.json({ mensaje: "✅ Usuario registrado correctamente" });
  } catch (error) {
    console.error("❌ Error al registrar usuario:", error);
    res.status(500).json({ mensaje: "Error al registrar usuario" });
  }
});

router.put("/usuarios/:id", verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombres, apellidos, telefono, correo, rol } = req.body;

    await pool.query(
      "UPDATE usuarios SET nombres=?, apellidos=?, telefono=?, correo=?, rol=? WHERE id=?",
      [nombres, apellidos, telefono, correo, rol, id]
    );

    res.json({ mensaje: "✅ Usuario actualizado correctamente" });
  } catch (error) {
    console.error("❌ Error al actualizar usuario:", error);
    res.status(500).json({ mensaje: "Error al actualizar usuario" });
  }
});

router.delete("/usuarios/:id", verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM usuarios WHERE id = ?", [id]);
    res.json({ mensaje: "🗑️ Usuario eliminado correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar usuario:", error);
    res.status(500).json({ mensaje: "Error al eliminar usuario" });
  }
});

export default router;
