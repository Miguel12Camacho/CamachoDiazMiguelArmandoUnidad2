const crypto = require('crypto');
const db = require('../config/db');

const TOKEN_VALIDEZ_MINUTOS = 30;

/**
 * Clase PasswordResetModel
 * Administra los tokens de un solo uso para la recuperación
 * de contraseña.
 */
class PasswordResetModel {
    static generarToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    static async crear(usuarioId) {
        const token = this.generarToken();
        const expiraEn = new Date(Date.now() + TOKEN_VALIDEZ_MINUTOS * 60 * 1000);

        // Invalida cualquier token previo no usado de este usuario
        await db.query(
            'UPDATE password_resets SET usado = TRUE WHERE usuario_id = $1 AND usado = FALSE',
            [usuarioId]
        );

        await db.query(
            `INSERT INTO password_resets (usuario_id, token, expira_en)
             VALUES ($1, $2, $3)`,
            [usuarioId, token, expiraEn]
        );

        return { token, expiraEn };
    }

    static async validar(token) {
        const query = `
            SELECT * FROM password_resets
            WHERE token = $1 AND usado = FALSE AND expira_en > NOW()
            LIMIT 1
        `;
        const { rows } = await db.query(query, [token]);
        return rows[0] || null;
    }

    static async marcarUsado(id) {
        await db.query('UPDATE password_resets SET usado = TRUE WHERE id = $1', [id]);
    }
}

module.exports = PasswordResetModel;
