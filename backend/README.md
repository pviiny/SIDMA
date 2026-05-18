# Backend SIDMA

## Instalar dependencias

```bash
npm install
```

## Configurar ambiente

Copie `.env.example` para `.env` e ajuste as credenciais do PostgreSQL:

```bash
copy .env.example .env
```

## Criar banco

Crie o banco `sidma` no PostgreSQL e execute:

```bash
psql -U postgres -d sidma -f backend/database/schema.sql
```

O script cria:

- tabela `usuarios`
- tabela `denuncias_ambientais`
- enums de status e prioridade
- usuario administrador inicial
- registros de exemplo para a dashboard

Credencial inicial:

- credencial: `ADM-12345`
- senha: `admin123`

## Rodar API e frontend

```bash
npm run dev
```

ou:

```bash
npm start
```

Acesse:

- site: `http://localhost:3000`
- login: `http://localhost:3000/login.html`
- dashboard: `http://localhost:3000/dashboard.html`
- healthcheck: `http://localhost:3000/api/health`

## Principais rotas

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/auth/usuarios`
- `POST /api/auth/usuarios`
- `GET /api/denuncias`
- `GET /api/denuncias/:id`
- `POST /api/denuncias`
- `PUT /api/denuncias/:id`
- `DELETE /api/denuncias/:id`
- `GET /api/dashboard/overview`
