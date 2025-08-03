const Routes = require("express").Router();
const businessController = require("../controllers/businesses.controller");
const authenticateToken = require("../middlewares/authMiddleware");
const authenticateAdminToken = require("../middlewares/authAdminMiddleware");
const uploadMiddleware = require("../middlewares/uploadMiddleware");

Routes.get(
  "/all",
  authenticateToken,
  businessController.getAllBusinessesForSelect
);

Routes.get("/", authenticateAdminToken, businessController.getAllBusinesses);

Routes.post("/", authenticateAdminToken, businessController.createBusiness);
Routes.put("/:id", authenticateAdminToken, businessController.updateBusiness);
Routes.delete(
  "/:id",
  authenticateAdminToken,
  businessController.deleteBusiness
);

Routes.get("/:id", businessController.getOneBusiness);
Routes.post(
  "/:id/logo",
  authenticateToken,
  uploadMiddleware,
  businessController.uploadBusinessLogo
);

module.exports = Routes;
