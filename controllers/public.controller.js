const db = require("../models/index.model");
const Business = db.businesses;
const Offering = db.offerings;
const Employee = db.employees;

exports.getPublicBusinessProfile = async (req, res) => {
  const { slug } = req.params;
  console.log(`[PUBLIC PROFILE] Buscando negocio con slug: ${slug}`);

  try {
    const business = await Business.findOne({
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
      business ? `Encontrado: ${business.name}` : "No encontrado."
    );

    if (!business) {
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
