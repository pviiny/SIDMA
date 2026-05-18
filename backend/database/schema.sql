CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
    CREATE TYPE denuncia_status AS ENUM ('recebida', 'em_triagem', 'em_campo', 'resolvida', 'arquivada');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE denuncia_prioridade AS ENUM ('baixa', 'media', 'alta');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    credencial VARCHAR(60) NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    perfil VARCHAR(30) NOT NULL DEFAULT 'admin',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS denuncias_ambientais (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(180) NOT NULL,
    descricao TEXT NOT NULL,
    status denuncia_status NOT NULL DEFAULT 'recebida',
    prioridade denuncia_prioridade NOT NULL DEFAULT 'media',
    privacidade VARCHAR(20) NOT NULL DEFAULT 'anonimo',
    denunciante_nome VARCHAR(120),
    denunciante_cpf VARCHAR(14),
    localizacao_texto VARCHAR(255) NOT NULL,
    latitude NUMERIC(10, 6),
    longitude NUMERIC(10, 6),
    raio_metros INTEGER NOT NULL DEFAULT 100,
    evidencia_url TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    usuario_responsavel_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_denuncias_status ON denuncias_ambientais(status);
CREATE INDEX IF NOT EXISTS idx_denuncias_prioridade ON denuncias_ambientais(prioridade);
CREATE INDEX IF NOT EXISTS idx_denuncias_criado_em ON denuncias_ambientais(criado_em DESC);

INSERT INTO usuarios (nome, email, credencial, senha_hash, perfil)
VALUES (
    'Administrador SIDMA',
    'admin@sidma.local',
    'ADM-12345',
    crypt('admin123', gen_salt('bf')),
    'admin'
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO denuncias_ambientais (
    titulo,
    descricao,
    status,
    prioridade,
    privacidade,
    localizacao_texto,
    latitude,
    longitude,
    raio_metros
) VALUES
    (
        'Queimada em area urbana',
        'Foco de queimada com fumaca intensa proximo a residencias.',
        'em_triagem',
        'alta',
        'anonimo',
        'Rua das Seringueiras - Raio 300m',
        -3.083410,
        -60.018920,
        300
    ),
    (
        'Descarte irregular de entulho',
        'Materiais de construcao descartados em via publica.',
        'recebida',
        'media',
        'identificado',
        'Av. Brasil - Raio 120m',
        -3.101240,
        -60.025430,
        120
    ),
    (
        'Lixo proximo a igarape',
        'Residuos domesticos acumulados perto do curso de agua.',
        'em_campo',
        'baixa',
        'anonimo',
        'Comunidade Nova Esperanca - Raio 80m',
        -3.070120,
        -60.050320,
        80
    ),
    (
        'Supressao vegetal suspeita',
        'Area com vegetacao removida recentemente e marcas de maquinario.',
        'recebida',
        'alta',
        'anonimo',
        'Ramal do Taruma - Raio 500m',
        -3.025400,
        -60.068110,
        500
    )
ON CONFLICT DO NOTHING;
