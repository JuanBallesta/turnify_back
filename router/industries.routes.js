const Routes = require("express").Router();
const industryController = require("../controllers/industries.controller");
const authenticateToken = require("../middlewares/authAdminMiddleware");

Routes.post("/", authenticateToken, industryController.createIndustry);
Routes.get("/", authenticateToken, industryController.getIndustries);
Routes.get("/:id", authenticateToken, industryController.getIndustryById);
Routes.put("/:id", authenticateToken, industryController.updateIndustry);
Routes.delete("/:id", authenticateToken, industryController.deleteIndustry);

module.exports = Routes;
