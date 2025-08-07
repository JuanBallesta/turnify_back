const bcrypt = require("bcrypt");

// Pon la nueva contraseña que elegiste aquí
const newPasswordInPlainText = "NuevaClaveSegura2024!";
const saltRounds = 10;

bcrypt.hash(newPasswordInPlainText, saltRounds, (err, hash) => {
  if (err) {
    console.error("Error al generar el hash:", err);
    return;
  }
  console.log("--- NUEVO HASH GENERADO ---");
  console.log(
    "Copia y pega este hash completo en la columna 'password' de la base de datos:"
  );
  console.log(hash);
  console.log("----------------------------");
});
