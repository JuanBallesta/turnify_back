const Routes = require("express").Router();
const offeringController = require("../controllers/offerings.controller");
const authenticateToken = require("../middlewares/authMiddleware");
const uploadServiceMiddleware = require("../middlewares/uploadServiceMiddleware");

Routes.use(authenticateToken);
Routes.post("/", offeringController.createOffering);
Routes.get("/", offeringController.getAllOfferings);
Routes.get(
  "/:id/employees",
  offeringController.getOfferingWithAssignedEmployees
);
Routes.put("/:id/employees", offeringController.updateAssignedEmployees);
Routes.get("/:id", offeringController.getOneOffering);
Routes.put("/:id", offeringController.updateOffering);
Routes.delete("/:id", offeringController.deleteOffering);

Routes.post(
  "/:id/photo",
  uploadServiceMiddleware,
  offeringController.uploadOfferingPhoto
);
module.exports = Routes;
