const db = require("../models/index.model");
const bcrypt = require("bcrypt");
const users = db.users;

// Crear un nuevo usuario (registro)
exports.createUser = async (req, res) => {
  const { name, lastName, userName, phone, email, notes, password, photo } =
    req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await users.create({
      name,
      lastName,
      userName,
      phone,
      email,
      notes,
      password: hashedPassword,
      photo,
    });

    res.status(201).json({
      ok: true,
      msg: "Usuario registrado correctamente.",
      data: newUser,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      msg: "Error al crear el usuario.",
      error: error.message || error,
    });
  }
};

// Obtener todos los usuarios
exports.getAllUsers = async (req, res) => {
  try {
    const userList = await users.findAll();
    res.status(200).json({
      ok: true,
      msg: "Lista de usuarios.",
      data: userList,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      msg: "Error al obtener los usuarios.",
      error: error.message || error,
    });
  }
};

// Obtener un usuario por ID
exports.getOneUser = async (req, res) => {
  const id = req.params.id;

  try {
    const user = await users.findByPk(id);

    if (!user) {
      return res.status(404).json({
        ok: false,
        msg: "Usuario no encontrado.",
      });
    }

    res.status(200).json({
      ok: true,
      msg: "Usuario encontrado.",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      msg: "Error al obtener el usuario.",
      error: error.message || error,
    });
  }
};

// Actualizar un usuario
exports.updateUser = async (req, res) => {
  const id = req.params.id;
  const { name, lastName, userName, phone, email, notes, photo } = req.body;

  try {
    const user = await users.findByPk(id);

    if (!user) {
      return res.status(404).json({
        ok: false,
        msg: "Usuario no encontrado.",
      });
    }

    await user.update({
      name,
      lastName,
      userName,
      phone,
      email,
      notes,
      photo,
    });

    res.status(200).json({
      ok: true,
      msg: "Usuario actualizado.",
      data: User,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      msg: "Error al actualizar el usuario.",
      error: error.message || error,
    });
  }
};

// Eliminar un usuario
exports.deleteUser = async (req, res) => {
  const id = req.params.id;

  try {
    const deleted = await users.destroy({ where: { id } });

    if (!deleted) {
      return res.status(404).json({
        ok: false,
        msg: "Usuario no encontrado.",
      });
    }

    res.status(200).json({
      ok: true,
      msg: "Usuario eliminado.",
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      msg: "Error al eliminar el usuario.",
      error: error.message || error,
    });
  }
};
