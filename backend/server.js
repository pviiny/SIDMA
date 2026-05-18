require("dotenv").config();

const app = require("./app");
const { testConnection } = require("./database/connection");

const PORT = process.env.PORT || 3000;

async function startServer() {
    await testConnection();

    app.listen(PORT, () => {
        console.log(`SIDMA API rodando em http://localhost:${PORT}`);
    });
}

startServer().catch((error) => {
    console.error("Falha ao iniciar o servidor SIDMA:", error.message);
    process.exit(1);
});
