const db = require("../models/index.model");
const bcrypt = require("bcrypt");
const users = db.users;

// Crear un nuevo usuario (registro)
exports.createUser = async (req, res) => {
  const { name, lastName, userName, phone, email, password } = req.body;

  if (!name || !lastName || !userName || !email || !password || !phone) {
    return res
      .status(400)
      .json({ ok: false, msg: "Todos los campos son requeridos." });
  }

  try {
    const existingUser = await users.findOne({
      where: { [db.Sequelize.Op.or]: [{ email }, { userName }] },
    });

    if (existingUser) {
      const field =
        existingUser.email === email ? "email" : "nombre de usuario";
      return res.status(409).json({
        ok: false,
        msg: `El ${field} ya está en uso.`,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await users.create({
      name,
      lastName,
      userName,
      phone,
      email,
      password: hashedPassword,
    });

    const userResponse = {
      id: newUser.id,
      name: newUser.name,
      lastName: newUser.lastName,
      userName: newUser.userName,
      email: newUser.email,
      phone: newUser.phone,
      notes: newUser.notes,
      photo: newUser.photo,
    };

    res.status(201).json({
      ok: true,
      msg: "Usuario registrado correctamente.",
      data: userResponse,
    });
  } catch (error) {
    console.error("Error al crear usuario:", error);
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
  const userIdFromParams = req.params.id;
  const authenticatedUser = req.user;

  if (Number(userIdFromParams) !== Number(authenticatedUser.id)) {
    return res
      .status(403)
      .json({ ok: false, msg: "No tienes permiso para esta acción." });
  }
  if (authenticatedUser.role !== "client") {
    return res
      .status(403)
      .json({ ok: false, msg: "Ruta no válida para este tipo de usuario." });
  }

  try {
    const userToUpdate = await users.findByPk(authenticatedUser.id);
    if (!userToUpdate)
      return res.status(404).json({ ok: false, msg: "Usuario no encontrado." });

    const { name, lastName, phone, notes } = req.body;
    userToUpdate.name = name ?? userToUpdate.name;
    userToUpdate.lastName = lastName ?? userToUpdate.lastName;
    userToUpdate.phone = phone ?? userToUpdate.phone;
    userToUpdate.notes = notes ?? userToUpdate.notes;

    await userToUpdate.save();

    const userResponse = {
      id: userToUpdate.id,
      name: userToUpdate.name,
      lastName: userToUpdate.lastName,
      userName: userToUpdate.userName,
      email: userToUpdate.email,
      phone: userToUpdate.phone,
      notes: userToUpdate.notes,
      photo: userToUpdate.photo,
      role: "client",
    };

    res
      .status(200)
      .json({ ok: true, msg: "Perfil actualizado.", user: userResponse });
  } catch (error) {
    res
      .status(500)
      .json({ ok: false, msg: "Error en el servidor.", error: error.message });
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

exports.uploadProfilePhoto = async (req, res) => {
  // LOG 1: ¿Llega la petición al controlador?
  console.log("--- Petición para subir foto recibida ---");

  // LOG 2: ¿Multer procesó el archivo?
  // Si 'req.file' es undefined, multer falló o no se configuró en la ruta.
  console.log("Objeto req.file:", req.file);
  console.log("Objeto req.user (del token):", req.user);
  console.log("Parámetros de la ruta (req.params):", req.params);

  const userId = req.params.id;

  if (!req.file) {
    console.error(
      "ERROR: No se encontró req.file. Multer no procesó el archivo."
    );
    return res
      .status(400)
      .json({ ok: false, msg: "No se ha subido ningún archivo." });
  }

  try {
    // Asumo que tienes modelos separados User y Employee
    const modelToUpdate = req.user.role === "client" ? db.User : db.Employee;

    console.log(
      `Buscando usuario con ID: ${userId} en el modelo ${modelToUpdate.name}`
    );
    const userToUpdate = await modelToUpdate.findByPk(userId);

    if (!userToUpdate) {
      console.error(`ERROR: Usuario no encontrado con ID ${userId}`);
      return res.status(404).json({ ok: false, msg: "Usuario no encontrado." });
    }

    const photoUrl = `${req.protocol}://${req.get(
      "host"
    )}/${req.file.path.replace(/\\/g, "/")}`;
    console.log("URL de la foto generada:", photoUrl);

    userToUpdate.photo = photoUrl;
    await userToUpdate.save();

    console.log("¡Foto guardada en la base de datos con éxito!");

    res.status(200).json({
      ok: true,
      msg: "Foto de perfil actualizada.",
      data: { photoUrl },
    });
  } catch (error) {
    // ESTE LOG NOS DIRÁ SI EL ERROR ESTÁ EN LA BASE DE DATOS
    console.error("<<<<< ERROR FATAL AL GUARDAR LA FOTO EN LA DB >>>>>", error);
    res.status(500).json({ ok: false, msg: "Error al guardar la foto." });
  }
};
