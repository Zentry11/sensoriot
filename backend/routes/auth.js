import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db.js";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// Registro
router.post("/register", async (req, res) => {
  try {
    const { nombres, apellidos, telefono, correo, contraseña } = req.body;

    const [existe] = await pool.query("SELECT * FROM usuarios WHERE correo = ?", [correo]);
    if (existe.length > 0) return res.status(400).json({ error: "Correo ya registrado" });

    const hashed = await bcrypt.hash(contraseña, 8);

    await pool.query(
      "INSERT INTO usuarios (nombres, apellidos, telefono, correo, contraseña, rol) VALUES (?, ?, ?, ?, ?, 'usuario')",
      [nombres, apellidos, telefono, correo, hashed]
    );

    res.json({ mensaje: "Usuario registrado correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { correo, contraseña } = req.body;

    const [rows] = await pool.query("SELECT * FROM usuarios WHERE correo = ?", [correo]);
    if (rows.length === 0) return res.status(400).json({ error: "Usuario no encontrado" });

    const usuario = rows[0];
    const esValido = await bcrypt.compare(contraseña, usuario.contraseña);
    if (!esValido) return res.status(401).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign({ id: usuario.id, rol: usuario.rol }, process.env.JWT_SECRET, { expiresIn: "4h" });

    res.json({
      mensaje: "Login exitoso",
      token,
      usuario: {
        id: usuario.id,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        rol: usuario.rol
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
});

export default router;
