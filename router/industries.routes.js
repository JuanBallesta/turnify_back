const Routes = require("express").Router();
const industryController = require("../controllers/industries.controller");

Routes.post("/", industryController.createIndustry);
Routes.get("/", industryController.getIndustries);
Routes.get("/:id", industryController.getIndustryById);
Routes.put("/:id", industryController.updateIndustry);
Routes.delete("/:id", industryController.deleteIndustry);

module.exports = Routes;
