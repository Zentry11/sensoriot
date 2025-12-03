import bcrypt from "bcryptjs";

const password = "admin1234"; // contraseña deseada
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(password, salt);

console.log(hash);
