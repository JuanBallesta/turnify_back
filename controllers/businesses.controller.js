const db = require("../models/index.model");
const { Op } = require("sequelize");
const business = db.businesses;
const Offering = db.offerings;
const Employee = db.employees;

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
    const { search } = req.query;

    let whereCondition = {};
    if (search) {
      const searchTerm = `%${search}%`;
      whereCondition = {
        [Op.or]: [
          { name: { [Op.like]: searchTerm } },
          { description: { [Op.like]: searchTerm } },
          { address: { [Op.like]: searchTerm } },
          { email: { [Op.like]: searchTerm } },
        ],
      };
    }

    const { count, rows } = await business.findAndCountAll({
      where: whereCondition,
      limit: limit,
      offset: offset,
      order: [["name", "ASC"]],
      distinct: true,
    });

    res.status(200).json({
      ok: true,
      msg: "Lista de negocios obtenida.",
      data: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        businesses: rows,
      },
    });
  } catch (error) {
    console.error("Error en getAllBusinesses:", error);
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
      attributes: ["id", "name", "slug"],
      order: [["name", "ASC"]],
    });
    res.status(200).json({ ok: true, data: businesses });
  } catch (error) {
    res
      .status(500)
      .json({ ok: false, msg: "Error al obtener la lista de negocios." });
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
exports.updateBusiness = async (req, res) => {
  const { id } = req.params;
  const dataToUpdate = req.body;

  try {
    const businessToUpdate = await business.findByPk(id);
    if (!businessToUpdate) {
      return res
        .status(404)
        .json({ ok: false, msg: "Negocio no encontrado para actualizar." });
    }

    if (
      req.user.role === "administrator" &&
      Number(req.user.businessId) !== Number(id)
    ) {
      return res.status(403).json({
        ok: false,
        msg: "No tienes permiso para editar este negocio.",
      });
    }

    await businessToUpdate.update(dataToUpdate);

    res.status(200).json({
      ok: true,
      msg: "Negocio actualizado correctamente.",
      data: businessToUpdate,
    });
  } catch (error) {
    console.error("<<<<< ERROR FATAL AL ACTUALIZAR NEGOCIO >>>>>", error);
    res.status(500).json({
      ok: false,
      msg: "Error al actualizar el negocio.",
      error: error.message,
    });
  }
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

exports.uploadBusinessLogo = async (req, res) => {
  const { id } = req.params;
  if (!req.file) {
    return res
      .status(400)
      .json({ ok: false, msg: "No se subió ningún archivo." });
  }

  try {
    let businessToUpdate = await business.findByPk(id);
    if (!businessToUpdate)
      return res.status(404).json({ ok: false, msg: "Negocio no encontrado." });

    const logoUrl = `/uploads/${req.file.filename}`;
    businessToUpdate.logo = logoUrl;
    await businessToUpdate.save();

    res
      .status(200)
      .json({ ok: true, msg: "Logo actualizado.", data: { logoUrl } });
  } catch (error) {
    console.error("Error al guardar el logo del negocio:", error);
    res.status(500).json({ ok: false, msg: "Error al guardar el logo." });
  }
};

exports.getPublicBusinessBySlug = async (req, res) => {
  const { slug } = req.params;
  console.log(`[PUBLIC PROFILE] Buscando negocio con slug: ${slug}`);

  try {
    const businessList = await business.findOne({
      where: {
        slug: slug,
      },
      attributes: [
        "id",
        "name",
        "description",
        "logo",
        "address",
        "phone",
        "email",
        "website",
        "instagram",
        "facebook",
      ],
      include: [
        {
          model: Offering,
          as: "offerings",
          where: { isActive: true },
          required: false,
          attributes: [
            "id",
            "name",
            "description",
            "price",
            "durationMinutes",
            "category",
          ],
        },
        {
          model: Employee,
          as: "employees",
          where: { isActive: true },
          required: false,
          attributes: ["id", "name", "lastName", "photo"],
        },
      ],
    });

    console.log(
      "[PUBLIC PROFILE] Resultado de la búsqueda en DB:",
      businessList ? `Encontrado: ${business.name}` : "No encontrado."
    );

    if (!businessList) {
      return res
        .status(404)
        .json({ ok: false, msg: "Perfil de negocio no encontrado." });
    }

    res.status(200).json({ ok: true, data: business });
  } catch (error) {
    console.error("<<<<< ERROR FATAL EN getPublicBusinessProfile >>>>>", error);
    res.status(500).json({ ok: false, msg: "Error interno del servidor." });
  }
};
