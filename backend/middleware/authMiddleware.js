const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function requireAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization || "";
        const [, token] = authHeader.split(" ");

        if (!token) {
            return res.status(401).json({ error: "Token de autenticacao ausente" });
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET || "sidma-dev-secret");
        const user = await User.findById(payload.sub);

        if (!user) {
            return res.status(401).json({ error: "Usuario nao autorizado" });
        }

        req.user = user;
        next();
    } catch (_error) {
        return res.status(401).json({ error: "Token invalido ou expirado" });
    }
}

module.exports = {
    requireAuth
};
