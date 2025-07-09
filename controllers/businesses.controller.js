const db = require("../models/index.model");
const business = db.businesses;

// Crear un nuevo negocio.
exports.createBusiness = (req, res) => {
  const { name, address, description, email, phone, logo } = req.body;

  business
    .create({
      name: name,
      address: address,
      phone: phone,
      email: email,
      description: description,
      logo: logo,
    })
    .then((register) => {
      res.status(201).json({
        ok: true,
        msg: "Negocio creado.",
        status: 201,
        data: register,
      });
    })
    .catch((error) => {
      res.status(500).json({
        ok: false,
        msg: "Error al crear el negocio.",
        status: 500,
        data: error,
      });
    });
};

// Obtener todos los negocios.
exports.getAllBusinesses = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 6;
    const offset = (page - 1) * limit;

    const { count, rows } = await business.findAndCountAll({
      limit: limit,
      offset: offset,
      order: [["name", "ASC"]],
    });

    res.status(200).json({
      ok: true,
      msg: "Lista de negocios paginada.",
      data: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        businesses: rows,
      },
    });
  } catch (error) {
    console.error("Error al obtener los negocios:", error);
    res.status(500).json({
      ok: false,
      msg: "Error interno del servidor.",
      error: error.message,
    });
  }
};

exports.getAllBusinessesForSelect = async (req, res) => {
  try {
    const businesses = await business.findAll({
      attributes: ["id", "name"],
      order: [["name", "ASC"]],
    });
    res.status(200).json({
      ok: true,
      msg: "Lista completa de negocios.",
      data: businesses,
    });
  } catch (error) {
    console.error("Error en getAllBusinessesForSelect:", error);
    res.status(500).json({ ok: false, msg: "Error interno del servidor." });
  }
};

// Obtener un negocio.
exports.getOneBusiness = (req, res) => {
  const id = req.params.id;
  business
    .findOne({
      where: { id: id },
    })
    .then((businessData) => {
      if (!businessData) {
        return res.status(404).json({
          ok: false,
          msg: "Negocio no encontrado.",
          status: 404,
        });
      }
      res.status(200).json({
        ok: true,
        msg: "Negocio encontrado.",
        status: 200,
        data: businessData,
      });
    })
    .catch((error) => {
      res.status(500).json({
        ok: false,
        msg: "Error al obtener el negocio.",
        status: 500,
        data: error,
      });
    });
};

// Actualizar un negocio.
exports.updateBusiness = (req, res) => {
  const id = req.params.id;
  const { name, address, phone, email, description, logo } = req.body;

  business
    .update(
      {
        name: name,
        address: address,
        phone: phone,
        email: email,
        description: description,
        logo: logo,
      },
      {
        where: { id: id },
        returning: true,
      }
    )
    .then(([affectedCount, affectedRows]) => {
      if (affectedCount === 0) {
        return res.status(404).json({
          ok: false,
          msg: "Negocio no encontrado.",
          status: 404,
        });
      }
      res.status(200).json({
        ok: true,
        msg: "Negocio actualizado.",
        status: 200,
        data: affectedRows[0],
      });
    })
    .catch((error) => {
      res.status(500).json({
        ok: false,
        msg: "Error al actualizar el negocio.",
        status: 500,
        data: error,
      });
    });
};

// Eliminar un negocio.
exports.deleteBusiness = (req, res) => {
  const id = req.params.id;

  business
    .destroy({ where: { id: id } })
    .then((rowsDeleted) => {
      if (rowsDeleted > 0) {
        res.status(200).json({
          ok: true,
          msg: "Negocio eliminado.",
          status: 200,
          data: rowsDeleted,
        });
      } else {
        res.status(404).json({
          ok: false,
          msg: "Negocio no encontrado.",
          status: 404,
          data: null,
        });
      }
    })
    .catch((error) => {
      res.status(500).json({
        ok: false,
        msg: "Error al eliminar el negocio.",
        status: 500,
        data: error,
      });
    });
};
