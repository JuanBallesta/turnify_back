const db = require("../models/index.model");
const offering = db.offerings; // asumí que el modelo se llama offerings

// Crear un nuevo offering
exports.createOffering = (req, res) => {
  const { name, description, price, durationMinutes } = req.body;

  offering
    .create({
      name,
      description,
      price,
      durationMinutes,
    })
    .then((newOffering) => {
      res.status(201).json({
        ok: true,
        msg: "Offering creado.",
        status: 201,
        data: newOffering,
      });
    })
    .catch((error) => {
      res.status(500).json({
        ok: false,
        msg: "Error al crear el offering.",
        status: 500,
        data: error,
      });
    });
};

// Obtener todos los offerings
exports.getAllOfferings = (req, res) => {
  offering
    .findAll()
    .then((offerings) => {
      res.status(200).json({
        ok: true,
        msg: "Lista de offerings.",
        status: 200,
        data: offerings,
      });
    })
    .catch((error) => {
      res.status(500).json({
        ok: false,
        msg: "Error al obtener los offerings.",
        status: 500,
        data: error,
      });
    });
};

// Obtener un offering por ID
exports.getOneOffering = (req, res) => {
  const id = req.params.id;

  offering
    .findOne({ where: { id } })
    .then((offeringData) => {
      if (!offeringData) {
        return res.status(404).json({
          ok: false,
          msg: "Offering no encontrado.",
          status: 404,
        });
      }
      res.status(200).json({
        ok: true,
        msg: "Offering encontrado.",
        status: 200,
        data: offeringData,
      });
    })
    .catch((error) => {
      res.status(500).json({
        ok: false,
        msg: "Error al obtener el offering.",
        status: 500,
        data: error,
      });
    });
};

// Actualizar un offering
exports.updateOffering = (req, res) => {
  const id = req.params.id;
  const { name, description, price, durationMinutes } = req.body;

  offering
    .update(
      { name, description, price, durationMinutes },
      { where: { id }, returning: true }
    )
    .then(([affectedCount, affectedRows]) => {
      if (affectedCount === 0) {
        return res.status(404).json({
          ok: false,
          msg: "Offering no encontrado.",
          status: 404,
        });
      }
      res.status(200).json({
        ok: true,
        msg: "Offering actualizado.",
        status: 200,
        data: affectedRows[0],
      });
    })
    .catch((error) => {
      res.status(500).json({
        ok: false,
        msg: "Error al actualizar el offering.",
        status: 500,
        data: error,
      });
    });
};

// Eliminar un offering
exports.deleteOffering = (req, res) => {
  const id = req.params.id;

  offering
    .destroy({ where: { id } })
    .then((rowsDeleted) => {
      if (rowsDeleted > 0) {
        res.status(200).json({
          ok: true,
          msg: "Offering eliminado.",
          status: 200,
          data: rowsDeleted,
        });
      } else {
        res.status(404).json({
          ok: false,
          msg: "Offering no encontrado.",
          status: 404,
          data: null,
        });
      }
    })
    .catch((error) => {
      res.status(500).json({
        ok: false,
        msg: "Error al eliminar el offering.",
        status: 500,
        data: error,
      });
    });
};
