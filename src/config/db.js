const { Pool } = require('pg');
require('dotenv').config();

/**
 * Clase Database
 * Implementa el patrón Singleton para mantener un único pool
 * de conexiones a PostgreSQL durante toda la vida de la aplicación.
 */
class Database {
    static #instance = null;

    constructor() {
        if (Database.#instance) {
            return Database.#instance;
        }

        this.pool = new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT) || 5432,
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'tienda_auth',
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000
        });

        this.pool.on('error', (err) => {
            console.error('❌ Error inesperado en el pool de PostgreSQL:', err.message);
        });

        Database.#instance = this;
    }

    /**
     * Ejecuta una consulta SQL parametrizada.
     * @param {string} text
     * @param {Array} params
     */
    async query(text, params = []) {
        return this.pool.query(text, params);
    }

    /**
     * Obtiene un cliente dedicado del pool (útil para transacciones).
     */
    async getClient() {
        return this.pool.connect();
    }

    /**
     * Verifica que la conexión a la base de datos funcione.
     */
    async testConnection() {
        try {
            const client = await this.pool.connect();
            const { rows } = await client.query('SELECT NOW()');
            client.release();
            console.log(`✅ Conexión a PostgreSQL establecida (${rows[0].now})`);
            return true;
        } catch (err) {
            console.error('❌ No se pudo conectar a PostgreSQL:', err.message);
            return false;
        }
    }
}

// Se exporta una única instancia (Singleton) lista para usarse en toda la app
module.exports = new Database();
