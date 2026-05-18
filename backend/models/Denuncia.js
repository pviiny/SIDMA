const db = require("../database/connection");

const fields = `
    id,
    titulo,
    descricao,
    status,
    prioridade,
    privacidade,
    denunciante_nome,
    denunciante_cpf,
    localizacao_texto,
    latitude,
    longitude,
    raio_metros,
    evidencia_url,
    criado_em,
    atualizado_em,
    usuario_responsavel_id
`;

function normalizeFilters(filters = {}) {
    const where = [];
    const values = [];

    if (filters.status) {
        values.push(filters.status);
        where.push(`status = $${values.length}::denuncia_status`);
    }

    if (filters.prioridade) {
        values.push(filters.prioridade);
        where.push(`prioridade = $${values.length}::denuncia_prioridade`);
    }

    if (filters.busca) {
        values.push(`%${filters.busca}%`);
        where.push(`(titulo ILIKE $${values.length} OR descricao ILIKE $${values.length} OR localizacao_texto ILIKE $${values.length})`);
    }

    return {
        clause: where.length ? `WHERE ${where.join(" AND ")}` : "",
        values
    };
}

async function list(filters) {
    const { clause, values } = normalizeFilters(filters);
    const result = await db.query(
        `SELECT ${fields}
         FROM denuncias_ambientais
         ${clause}
         ORDER BY criado_em DESC`,
        values
    );

    return result.rows;
}

async function findById(id) {
    const result = await db.query(
        `SELECT ${fields} FROM denuncias_ambientais WHERE id = $1`,
        [id]
    );

    return result.rows[0];
}

async function create(data) {
    const result = await db.query(
        `INSERT INTO denuncias_ambientais (
            titulo,
            descricao,
            status,
            prioridade,
            privacidade,
            denunciante_nome,
            denunciante_cpf,
            localizacao_texto,
            latitude,
            longitude,
            raio_metros,
            evidencia_url,
            usuario_responsavel_id
         )
         VALUES (
            $1, 
            $2, 
            COALESCE($3, 'recebida')::denuncia_status, 
            COALESCE($4, 'media')::denuncia_prioridade, 
            $5, 
            $6, 
            $7, 
            $8, 
            $9, 
            $10, 
            COALESCE($11, 100), 
            $12, 
            $13
         )
         RETURNING ${fields}`,
        [
            data.titulo,
            data.descricao,
            data.status,
            data.prioridade,
            data.privacidade,
            data.denunciante_nome,
            data.denunciante_cpf,
            data.localizacao_texto,
            data.latitude,
            data.longitude,
            data.raio_metros,
            data.evidencia_url,
            data.usuario_responsavel_id
        ]
    );

    return result.rows[0];
}

async function update(id, data) {
    const result = await db.query(
        `UPDATE denuncias_ambientais
         SET
            titulo = COALESCE($2, titulo),
            descricao = COALESCE($3, descricao),
            status = COALESCE($4::denuncia_status, status),
            prioridade = COALESCE($5::denuncia_prioridade, prioridade),
            privacidade = COALESCE($6, privacidade),
            denunciante_nome = COALESCE($7, denunciante_nome),
            denunciante_cpf = COALESCE($8, denunciante_cpf),
            localizacao_texto = COALESCE($9, localizacao_texto),
            latitude = COALESCE($10, latitude),
            longitude = COALESCE($11, longitude),
            raio_metros = COALESCE($12, raio_metros),
            evidencia_url = COALESCE($13, evidencia_url),
            usuario_responsavel_id = COALESCE($14, usuario_responsavel_id),
            atualizado_em = NOW()
         WHERE id = $1
         RETURNING ${fields}`,
        [
            id,
            data.titulo,
            data.descricao,
            data.status,
            data.prioridade,
            data.privacidade,
            data.denunciante_nome,
            data.denunciante_cpf,
            data.localizacao_texto,
            data.latitude,
            data.longitude,
            data.raio_metros,
            data.evidencia_url,
            data.usuario_responsavel_id
        ]
    );

    return result.rows[0];
}

async function remove(id) {
    const result = await db.query(
        `DELETE FROM denuncias_ambientais WHERE id = $1 RETURNING ${fields}`,
        [id]
    );

    return result.rows[0];
}

async function summary() {
    const result = await db.query(`
        SELECT
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE status IN ('recebida', 'em_triagem', 'em_campo'))::int AS abertas,
            COUNT(*) FILTER (WHERE prioridade = 'alta')::int AS alta_prioridade,
            COUNT(*) FILTER (WHERE status = 'resolvida')::int AS resolvidas,
            COUNT(*) FILTER (WHERE (criado_em AT TIME ZONE 'America/Manaus')::date = (NOW() AT TIME ZONE 'America/Manaus')::date)::int AS novas_hoje,
            COUNT(DISTINCT localizacao_texto)::int AS areas_monitoradas
        FROM denuncias_ambientais
    `);

    return result.rows[0];
}

async function byStatus() {
    const result = await db.query(`
        SELECT status, COUNT(*)::int AS total
        FROM denuncias_ambientais
        GROUP BY status
    `);

    return result.rows;
}

// ==========================================================================
// FUNÇÃO CORRIGIDA 100%: RETORNA OS ÚLTIMOS 7 DIAS DINÂMICOS E PROPORCIONAIS
// ==========================================================================
async function lastSevenDays() {
    const result = await db.query(`
        WITH dias AS (
            SELECT (generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day'))::date AS dia_puro
        )
        SELECT
            TO_CHAR(dias.dia_puro, 'YYYY-MM-DD') AS dia,
            COUNT(d.id)::int AS total
        FROM dias
        LEFT JOIN denuncias_ambientais d 
            ON (d.criado_em AT TIME ZONE 'America/Manaus')::date = dias.dia_puro
        GROUP BY dias.dia_puro
        ORDER BY dias.dia_puro ASC
    `);

    return result.rows;
}

async function criticalLocations() {
    const result = await db.query(`
        SELECT
            localizacao_texto,
            latitude,
            longitude,
            COUNT(*)::int AS total
        FROM denuncias_ambientais
        GROUP BY localizacao_texto, latitude, longitude
        ORDER BY total DESC, localizacao_texto ASC
        LIMIT 5
    `);

    return result.rows;
}

module.exports = {
    byStatus,
    create,
    criticalLocations,
    findById,
    lastSevenDays,
    list,
    remove,
    summary,
    update
};