import bcrypt from "bcryptjs";

// ============================================
//  CREAR HASH PARA CONTRASEÑAS
// ============================================

const password = "admin1234"; // contrasña
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(password, salt);

console.log(hash);
