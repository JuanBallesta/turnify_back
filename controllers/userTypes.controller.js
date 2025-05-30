const db = require("../models/index.model");
const userType = db.userTypes;

// Crear un nuevo tipo de usuario
exports.createUserType = (req, res) => {
  const { name } = req.body;

  userType
    .create({ name })
    .then((newUserType) => {
      res.status(201).json({
        ok: true,
        msg: "Tipo de usuario creado.",
        status: 201,
        data: newUserType,
      });
    })
    .catch((error) => {
      res.status(500).json({
        ok: false,
        msg: "Error al crear tipo de usuario.",
        status: 500,
        data: error,
      });
    });
};

// Obtener todos los tipos de usuario
exports.getAllUserTypes = (req, res) => {
  userType
    .findAll()
    .then((userTypes) => {
      res.status(200).json({
        ok: true,
        msg: "Lista de tipos de usuario.",
        status: 200,
        data: userTypes,
      });
    })
    .catch((error) => {
      res.status(500).json({
        ok: false,
        msg: "Error al obtener tipos de usuario.",
        status: 500,
        data: error,
      });
    });
};

// Obtener un tipo de usuario por ID
exports.getOneUserType = (req, res) => {
  const id = req.params.id;

  userType
    .findOne({ where: { id } })
    .then((userTypeData) => {
      if (!userTypeData) {
        return res.status(404).json({
          ok: false,
          msg: "Tipo de usuario no encontrado.",
          status: 404,
        });
      }

      res.status(200).json({
        ok: true,
        msg: "Tipo de usuario encontrado.",
        status: 200,
        data: userTypeData,
      });
    })
    .catch((error) => {
      res.status(500).json({
        ok: false,
        msg: "Error al obtener tipo de usuario.",
        status: 500,
        data: error,
      });
    });
};

// Actualizar un tipo de usuario
exports.updateUserType = (req, res) => {
  const id = req.params.id;
  const { name } = req.body;

  userType
    .update({ name }, { where: { id }, returning: true })
    .then(([affectedCount, affectedRows]) => {
      if (affectedCount === 0) {
        return res.status(404).json({
          ok: false,
          msg: "Tipo de usuario no encontrado.",
          status: 404,
        });
      }

      res.status(200).json({
        ok: true,
        msg: "Tipo de usuario actualizado.",
        status: 200,
        data: affectedRows[0],
      });
    })
    .catch((error) => {
      res.status(500).json({
        ok: false,
        msg: "Error al actualizar tipo de usuario.",
        status: 500,
        data: error,
      });
    });
};

// Eliminar un tipo de usuario
exports.deleteUserType = (req, res) => {
  const id = req.params.id;

  userType
    .destroy({ where: { id } })
    .then((rowsDeleted) => {
      if (rowsDeleted === 0) {
        return res.status(404).json({
          ok: false,
          msg: "Tipo de usuario no encontrado.",
          status: 404,
        });
      }

      res.status(200).json({
        ok: true,
        msg: "Tipo de usuario eliminado.",
        status: 200,
        data: rowsDeleted,
      });
    })
    .catch((error) => {
      res.status(500).json({
        ok: false,
        msg: "Error al eliminar tipo de usuario.",
        status: 500,
        data: error,
      });
    });
};
