const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function signToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            perfil: user.perfil
        },
        process.env.JWT_SECRET || "sidma-dev-secret",
        { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
    );
}

async function login(req, res, next) {
    try {
        const { credencial, senha } = req.body;

        if (!credencial || !senha) {
            return res.status(400).json({ error: "Credencial e senha sao obrigatorias" });
        }

        const user = await User.findByCredential(credencial);

        if (!user) {
            return res.status(401).json({ error: "Credenciais invalidas" });
        }

        const passwordMatches = await bcrypt.compare(senha, user.senha_hash);

        if (!passwordMatches) {
            return res.status(401).json({ error: "Credenciais invalidas" });
        }

        const token = signToken(user);

        res.json({
            token,
            usuario: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                credencial: user.credencial,
                perfil: user.perfil
            }
        });
    } catch (error) {
        next(error);
    }
}

async function me(req, res) {
    res.json({ usuario: req.user });
}

async function createAdmin(req, res, next) {
    try {
        const { nome, email, credencial, senha } = req.body;

        if (!nome || !email || !credencial || !senha) {
            return res.status(400).json({ error: "Nome, email, credencial e senha sao obrigatorios" });
        }

        const senhaHash = await bcrypt.hash(senha, 10);
        const user = await User.create({
            nome,
            email,
            credencial,
            senhaHash,
            perfil: "admin"
        });

        res.status(201).json({ usuario: user });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({ error: "Email ou credencial ja cadastrados" });
        }

        next(error);
    }
}

async function listUsers(_req, res, next) {
    try {
        const users = await User.listAll();
        res.json({ usuarios: users });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createAdmin,
    listUsers,
    login,
    me
};
