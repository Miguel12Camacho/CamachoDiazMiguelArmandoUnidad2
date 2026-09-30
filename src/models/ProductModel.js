const db = require('../config/db');

/**
 * Clase ProductModel
 * Acceso a datos del catálogo de la tienda virtual.
 */
class ProductModel {
    static async listarTodos() {
        const { rows } = await db.query(
            'SELECT * FROM productos ORDER BY id ASC'
        );
        return rows;
    }

    static async buscarPorId(id) {
        const { rows } = await db.query('SELECT * FROM productos WHERE id = $1', [id]);
        return rows[0] || null;
    }

    static async buscarPorCategoria(categoria) {
        const { rows } = await db.query(
            'SELECT * FROM productos WHERE categoria = $1 ORDER BY id ASC',
            [categoria]
        );
        return rows;
    }
}

module.exports = ProductModel;
