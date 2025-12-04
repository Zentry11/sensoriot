import express from "express";
import bcrypt from "bcryptjs";
import pool from "../db.js"; 
import jwt from "jsonwebtoken";

const router = express.Router();

// ============================================
//  MIDDLEWARE PARA VERIFICAR EL TOKEN
// ============================================
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Token no proporcionado" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Token inválido" });
    req.user = decoded;
    next();
  });
};

//  Ruta: obtener usuario por ID
router.get("/usuarios/:id", verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, nombres, apellidos, telefono, correo FROM usuarios WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener usuario" });
  }
});

// Ruta: actualizar datos de usuario
router.put("/usuarios/:id", verifyToken, async (req, res) => {
  try {
    const { nombres, apellidos, telefono, correo, password } = req.body;

    // Buscar el usuario
    const [userRows] = await pool.query("SELECT * FROM usuarios WHERE id = ?", [req.params.id]);
    if (userRows.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });

    let updateQuery = "UPDATE usuarios SET nombres = ?, apellidos = ?, telefono = ?, correo = ?";
    let updateParams = [nombres, apellidos, telefono, correo];

    // Si hay una nueva contraseña, la encriptamos
    if (password) {
      const hashed = await bcrypt.hash(password, 8);
      updateQuery += ", contraseña = ?";
      updateParams.push(hashed);
    }

    updateQuery += " WHERE id = ?";
    updateParams.push(req.params.id);

    await pool.query(updateQuery, updateParams);

    res.json({ mensaje: "Datos actualizados correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
});

export default router;
