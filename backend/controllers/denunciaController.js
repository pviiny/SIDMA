const Denuncia = require("../models/Denuncia");

const allowedStatus = ["recebida", "em_triagem", "em_campo", "resolvida", "arquivada"];
const allowedPriorities = ["baixa", "media", "alta"];

function validateEnums(data) {
    if (data.status && !allowedStatus.includes(data.status)) {
        return `Status invalido. Use: ${allowedStatus.join(", ")}`;
    }

    if (data.prioridade && !allowedPriorities.includes(data.prioridade)) {
        return `Prioridade invalida. Use: ${allowedPriorities.join(", ")}`;
    }

    return null;
}

function parseLocationText(localizacaoTexto) {
    if (!localizacaoTexto) return {};

    const match = localizacaoTexto.match(/Lat:\s*(-?\d+(?:\.\d+)?),\s*Lng:\s*(-?\d+(?:\.\d+)?)(?:\s*\(Raio:\s*(\d+)m\))?/i);

    if (!match) return {};

    return {
        latitude: Number(match[1]),
        longitude: Number(match[2]),
        raio_metros: match[3] ? Number(match[3]) : undefined
    };
}

function normalizePayload(body, responsibleUserId) {
    const locationFromText = parseLocationText(body.localizacao_texto || body.localizacaoOcorrencia);

    return {
        titulo: body.titulo || body.tituloOcorrencia,
        descricao: body.descricao || body.descricaoOcorrencia,
        status: body.status,
        prioridade: body.prioridade,
        privacidade: body.privacidade,
        denunciante_nome: body.denunciante_nome || body.nomeCompleto,
        denunciante_cpf: body.denunciante_cpf || body.cpfUsuario,
        localizacao_texto: body.localizacao_texto || body.localizacaoOcorrencia,
        latitude: body.latitude ?? locationFromText.latitude,
        longitude: body.longitude ?? locationFromText.longitude,
        raio_metros: body.raio_metros ?? locationFromText.raio_metros,
        evidencia_url: body.evidencia_url,
        usuario_responsavel_id: body.usuario_responsavel_id || responsibleUserId
    };
}

async function list(req, res, next) {
    try {
        const denuncias = await Denuncia.list(req.query);
        res.json({ denuncias });
    } catch (error) {
        next(error);
    }
}

async function show(req, res, next) {
    try {
        const denuncia = await Denuncia.findById(req.params.id);

        if (!denuncia) {
            return res.status(404).json({ error: "Denuncia nao encontrada" });
        }

        res.json({ denuncia });
    } catch (error) {
        next(error);
    }
}

async function create(req, res, next) {
    try {
        const payload = normalizePayload(req.body, req.user?.id);
        const enumError = validateEnums(payload);

        if (enumError) {
            return res.status(400).json({ error: enumError });
        }

        if (!payload.titulo || !payload.descricao || !payload.localizacao_texto) {
            return res.status(400).json({ error: "Titulo, descricao e localizacao sao obrigatorios" });
        }

        const denuncia = await Denuncia.create(payload);
        res.status(201).json({ denuncia });
    } catch (error) {
        next(error);
    }
}

async function update(req, res, next) {
    try {
        const payload = normalizePayload(req.body, req.user?.id);
        const enumError = validateEnums(payload);

        if (enumError) {
            return res.status(400).json({ error: enumError });
        }

        const denuncia = await Denuncia.update(req.params.id, payload);

        if (!denuncia) {
            return res.status(404).json({ error: "Denuncia nao encontrada" });
        }

        res.json({ denuncia });
    } catch (error) {
        next(error);
    }
}

async function remove(req, res, next) {
    try {
        const denuncia = await Denuncia.remove(req.params.id);

        if (!denuncia) {
            return res.status(404).json({ error: "Denuncia nao encontrada" });
        }

        res.json({ denuncia });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    create,
    list,
    remove,
    show,
    update
};
