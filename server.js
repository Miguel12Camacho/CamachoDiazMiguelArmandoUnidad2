require('dotenv').config();
const app = require('./src/app');
const db = require('./src/config/db');

const PORT = process.env.PORT || 3000;

(async () => {
    await db.testConnection();

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
        console.log(`   Login/Registro:  http://localhost:${PORT}/`);
        console.log(`   Tienda virtual:  http://localhost:${PORT}/tienda (requiere sesión)`);
    });
})();
