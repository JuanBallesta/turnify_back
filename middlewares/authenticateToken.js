const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) {
    return res
      .status(401)
      .json({ ok: false, msg: "No se proporcionó token de autenticación." });
  }

  jwt.verify(token, JWT_SECRET, (err, userPayload) => {
    if (err) {
      console.error("Fallo en la verificación del token:", err.message);
      return res
        .status(403)
        .json({ ok: false, msg: "Token inválido o expirado." });
    }

    req.user = userPayload;
    next();
  });
};

module.exports = authenticateToken;
