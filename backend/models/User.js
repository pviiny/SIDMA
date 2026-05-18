const db = require("../database/connection");

const publicFields = `
    id,
    nome,
    email,
    credencial,
    perfil,
    ativo,
    criado_em,
    atualizado_em
`;

async function findByCredential(credential) {
    const result = await db.query(
        `SELECT * FROM usuarios WHERE (credencial = $1 OR email = $1) AND ativo = TRUE LIMIT 1`,
        [credential]
    );

    return result.rows[0];
}

async function findById(id) {
    const result = await db.query(
        `SELECT ${publicFields} FROM usuarios WHERE id = $1 AND ativo = TRUE LIMIT 1`,
        [id]
    );

    return result.rows[0];
}

async function listAll() {
    const result = await db.query(
        `SELECT ${publicFields} FROM usuarios ORDER BY nome ASC`
    );

    return result.rows;
}

async function create({ nome, email, credencial, senhaHash, perfil = "admin" }) {
    const result = await db.query(
        `INSERT INTO usuarios (nome, email, credencial, senha_hash, perfil)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING ${publicFields}`,
        [nome, email, credencial, senhaHash, perfil]
    );

    return result.rows[0];
}

module.exports = {
    create,
    findByCredential,
    findById,
    listAll
};
