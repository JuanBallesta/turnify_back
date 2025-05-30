const Routes = require("express").Router();
const businessController = require("../controllers/businesses.controller");

Routes.post("/", businessController.createBusiness);
Routes.get("/", businessController.getAllBusinesses);
Routes.get("/:id", businessController.getOneBusiness);
Routes.put("/:id", businessController.updateBusiness);
Routes.delete("/:id", businessController.deleteBusiness);

module.exports = Routes;
