const db = require("../models/index.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const users = db.users;

const JWT_SECRET = process.env.JWT_SECRET || "clave_secreta_super_segura";

exports.login = async (req, res) => {
  const { userName, password } = req.body;

  try {
    // Buscar cliente por userName
    const client = await users.findOne({ where: { userName } });

    if (!client) {
      return res.status(404).json({ ok: false, msg: "Cliente no encontrado" });
    }

    // Comparar password
    const passwordMatch = await bcrypt.compare(password, client.password);

    if (!passwordMatch) {
      return res.status(401).json({ ok: false, msg: "Contraseña incorrecta" });
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        id: client.id,
        userName: client.userName,
        email: client.email,
      },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.status(200).json({
      ok: true,
      msg: "Login exitoso",
      token,
      client: {
        id: client.id,
        name: client.name,
        lastName: client.lastName,
        userName: client.userName,
        email: client.email,
        phone: client.phone,
        notes: client.notes,
        photo: client.photo,
      },
    });
  } catch (error) {
    console.error("Error en login cliente:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al iniciar sesión",
      error: error.message || error,
    });
  }
};
