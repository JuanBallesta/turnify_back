const Routes = require("express").Router();
const businessController = require("../controllers/businesses.controller");

// Importamos AMBOS middlewares
const authenticateToken = require("../middlewares/authMiddleware"); // General, para cualquier usuario logueado
const authenticateAdminToken = require("../middlewares/authAdminMiddleware"); // Restrictivo, para admins/superusers

// --- RUTAS ---

// GET /api/businesses/all - Debe ser accesible para CLIENTES y todos los demás
Routes.get(
  "/all",
  authenticateToken, // <-- ¡LA SOLUCIÓN! Usar el middleware general
  businessController.getAllBusinessesForSelect
);

// GET /api/businesses (Paginado) - Esta es para el panel de admin, así que es restrictiva
Routes.get("/", authenticateAdminToken, businessController.getAllBusinesses);

// Las operaciones de escritura (Crear, Actualizar, Eliminar) deben ser restrictivas
Routes.post("/", authenticateAdminToken, businessController.createBusiness);
Routes.put("/:id", authenticateAdminToken, businessController.updateBusiness);
Routes.delete(
  "/:id",
  authenticateAdminToken,
  businessController.deleteBusiness
);

// Ver detalles de un negocio puede ser para cualquier usuario logueado
Routes.get("/:id", authenticateToken, businessController.getOneBusiness);

module.exports = Routes;
