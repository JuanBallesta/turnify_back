const Routes = require("express").Router();
const offeringController = require("../controllers/offerings.controller");

Routes.post("/", offeringController.createOffering);
Routes.get("/", offeringController.getAllOfferings);
Routes.get("/:id", offeringController.getOneOffering);
Routes.put("/:id", offeringController.updateOffering);
Routes.delete("/:id", offeringController.deleteOffering);

module.exports = Routes;
