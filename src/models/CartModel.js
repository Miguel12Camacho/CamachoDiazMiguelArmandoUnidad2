const db = require('../config/db');

/**
 * Clase CartModel
 * Maneja el carrito de compras persistente por usuario.
 */
class CartModel {
    static async obtener(usuarioId) {
        const query = `
            SELECT ci.id AS item_id, ci.cantidad, p.*
            FROM carrito_items ci
            JOIN productos p ON p.id = ci.producto_id
            WHERE ci.usuario_id = $1
            ORDER BY ci.agregado_en ASC
        `;
        const { rows } = await db.query(query, [usuarioId]);
        return rows;
    }

    static async agregar(usuarioId, productoId, cantidad = 1) {
        const query = `
            INSERT INTO carrito_items (usuario_id, producto_id, cantidad)
            VALUES ($1, $2, $3)
            ON CONFLICT (usuario_id, producto_id)
            DO UPDATE SET cantidad = carrito_items.cantidad + EXCLUDED.cantidad
            RETURNING *
        `;
        const { rows } = await db.query(query, [usuarioId, productoId, cantidad]);
        return rows[0];
    }

    static async actualizarCantidad(usuarioId, productoId, cantidad) {
        if (cantidad <= 0) {
            return this.eliminar(usuarioId, productoId);
        }
        const { rows } = await db.query(
            `UPDATE carrito_items SET cantidad = $3
             WHERE usuario_id = $1 AND producto_id = $2 RETURNING *`,
            [usuarioId, productoId, cantidad]
        );
        return rows[0];
    }

    static async eliminar(usuarioId, productoId) {
        await db.query(
            'DELETE FROM carrito_items WHERE usuario_id = $1 AND producto_id = $2',
            [usuarioId, productoId]
        );
    }

    static async vaciar(usuarioId) {
        await db.query('DELETE FROM carrito_items WHERE usuario_id = $1', [usuarioId]);
    }
}

module.exports = CartModel;
