const Routes = require("express").Router();
const businessController = require("../controllers/businesses.controller");

// --- ¡LA SOLUCIÓN! ---
// Importamos AMBOS middlewares para usarlos donde corresponda.
const authenticateToken = require("../middlewares/authMiddleware"); // El general
const authenticateAdminToken = require("../middlewares/authAdminMiddleware"); // El restrictivo

// --- RUTAS ---

// POST /api/businesses - Crear un negocio (SOLO ADMINS/SUPERUSERS)
Routes.post("/", authenticateAdminToken, businessController.createBusiness);

// GET /api/businesses/all - Obtener todos los negocios para filtros (CUALQUIER USUARIO LOGUEADO)
Routes.get(
  "/all",
  authenticateToken,
  businessController.getAllBusinessesForSelect
);

// GET /api/businesses (Paginado) - Para el panel de superuser (SOLO SUPERUSERS)
// (Asumiendo que tu authAdminMiddleware también maneja el caso de superuser)
Routes.get("/", authenticateAdminToken, businessController.getAllBusinesses);

// GET /api/businesses/:id - Ver detalles de un negocio (CUALQUIER USUARIO LOGUEADO)
Routes.get("/:id", authenticateToken, businessController.getOneBusiness);

// PUT /api/businesses/:id - Actualizar (SOLO ADMINS/SUPERUSERS)
Routes.put("/:id", authenticateAdminToken, businessController.updateBusiness);

// DELETE /api/businesses/:id - Eliminar (SOLO ADMINS/SUPERUSERS)
Routes.delete(
  "/:id",
  authenticateAdminToken,
  businessController.deleteBusiness
);

module.exports = Routes;
