const Routes = require("express").Router();
const businessController = require("../controllers/businesses.controller");
const authenticateToken = require("../middlewares/authAdminMiddleware");

Routes.post("/", authenticateToken, businessController.createBusiness);
Routes.get("/", authenticateToken, businessController.getAllBusinesses);
Routes.get("/:id", authenticateToken, businessController.getOneBusiness);
Routes.put("/:id", authenticateToken, businessController.updateBusiness);
Routes.delete("/:id", authenticateToken, businessController.deleteBusiness);

module.exports = Routes;
