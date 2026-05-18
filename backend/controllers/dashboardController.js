const Denuncia = require("../models/Denuncia");

async function overview(_req, res, next) {
    try {
        const [resumo, porStatus, ultimosSeteDias, locaisCriticos, recentes] = await Promise.all([
            Denuncia.summary(),
            Denuncia.byStatus(),
            Denuncia.lastSevenDays(),
            Denuncia.criticalLocations(),
            Denuncia.list({})
        ]);

        res.json({
            resumo,
            porStatus,
            ultimosSeteDias,
            locaisCriticos,
            recentes: recentes.slice(0, 6)
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    overview
};
