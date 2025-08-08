const Routes = require("express").Router();
const aiController = require("../controllers/aiController");

// Definimos una ruta POST para /ask
// Se espera que la pregunta venga en el body de la petición como JSON: { "question": "Tu pregunta aquí" }
Routes.post("/ask", aiController.askQuestion);

module.exports = Routes;
