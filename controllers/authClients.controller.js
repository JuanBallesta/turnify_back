const db = require("../models/index.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Client = db.users; // Usamos el modelo 'users' para clientes

// Se usa la clave secreta universal del archivo .env
const JWT_SECRET = process.env.JWT_SECRET;

exports.login = async (req, res) => {
  const { userName, password } = req.body;

  try {
    const client = await Client.findOne({ where: { userName } });

    if (!client) {
      return res.status(404).json({ ok: false, msg: "Usuario no encontrado" });
    }

    const passwordMatch = await bcrypt.compare(password, client.password);
    if (!passwordMatch) {
      return res.status(401).json({ ok: false, msg: "Contraseña incorrecta" });
    }

    // Generar token JWT con la clave universal, incluyendo el rol 'client'
    const token = jwt.sign(
      {
        id: client.id,
        userName: client.userName,
        email: client.email,
        role: "client", // Añadimos el rol manualmente
      },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.status(200).json({
      ok: true,
      msg: "Login de cliente exitoso",
      token,
      client: {
        id: client.id,
        name: client.name,
        lastName: client.lastName,
        email: client.email,
        userName: client.userName,
        phone: client.phone,
        notes: client.notes,
        photo: client.photo,
        role: "client", // También lo añadimos a la respuesta
      },
    });
  } catch (error) {
    console.error("Error en login de cliente:", error);
    res
      .status(500)
      .json({
        ok: false,
        msg: "Error al iniciar sesión",
        error: error.message,
      });
  }
};
