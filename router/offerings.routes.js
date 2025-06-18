const Routes = require("express").Router();
const offeringController = require("../controllers/offerings.controller");
const authenticateToken = require("../middlewares/authAdminMiddleware");

Routes.post("/", authenticateToken, offeringController.createOffering);
Routes.get("/", authenticateToken, offeringController.getAllOfferings);
Routes.get("/:id", authenticateToken, offeringController.getOneOffering);
Routes.put("/:id", authenticateToken, offeringController.updateOffering);
Routes.delete("/:id", authenticateToken, offeringController.deleteOffering);
authenticateToken, (module.exports = Routes);
