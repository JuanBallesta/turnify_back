const db = require("../models/index.model");
const Industry = db.industries;

// Obtener todas las industrias
const getIndustries = async (req, res) => {
  try {
    const industries = await Industry.findAll();
    res.json(industries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Crear una nueva industria
const createIndustry = async (req, res) => {
  try {
    const { description } = req.body;
    const newIndustry = await Industry.create({ description });
    res.status(201).json(newIndustry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener una industria por ID
const getIndustryById = async (req, res) => {
  try {
    const { id } = req.params;
    const industry = await Industry.findByPk(id);

    if (!industry) {
      return res.status(404).json({ message: "Industria no encontrada" });
    }

    res.json(industry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar una industria
const updateIndustry = async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    const industry = await Industry.findByPk(id);

    if (!industry) {
      return res.status(404).json({ message: "Industria no encontrada" });
    }

    industry.description = description;
    await industry.save();

    res.json(industry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Eliminar una industria
const deleteIndustry = async (req, res) => {
  try {
    const { id } = req.params;
    const industry = await Industry.findByPk(id);

    if (!industry) {
      return res.status(404).json({ message: "Industria no encontrada" });
    }

    await industry.destroy();
    res.json({ message: "Industria eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getIndustries,
  createIndustry,
  getIndustryById,
  updateIndustry,
  deleteIndustry,
};
