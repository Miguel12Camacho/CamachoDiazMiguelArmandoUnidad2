const bcrypt = require('bcryptjs');
const db = require('../config/db');

const SALT_ROUNDS = 12;

/**
 * Clase UserModel
 * Encapsula toda la lógica de acceso a datos relacionada
 * con la tabla "usuarios".
 */
class UserModel {
    static async crear({ nombre, apellidos, username, email, password, tipoUsuario = 'cliente' }) {
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        const query = `
            INSERT INTO usuarios (nombre, apellidos, username, email, password_hash, tipo_usuario)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, nombre, apellidos, username, email, tipo_usuario, creado_en
        `;
        const values = [nombre, apellidos, username, email, passwordHash, tipoUsuario];
        const { rows } = await db.query(query, values);
        return rows[0];
    }

    static async buscarPorUsernameOEmail(identificador) {
        const query = `
            SELECT * FROM usuarios
            WHERE (username = $1 OR email = $1) AND activo = TRUE
            LIMIT 1
        `;
        const { rows } = await db.query(query, [identificador]);
        return rows[0] || null;
    }

    static async buscarPorEmail(email) {
        const { rows } = await db.query(
            'SELECT * FROM usuarios WHERE email = $1 AND activo = TRUE LIMIT 1',
            [email]
        );
        return rows[0] || null;
    }

    static async buscarPorId(id) {
        const { rows } = await db.query(
            `SELECT id, nombre, apellidos, username, email, tipo_usuario, creado_en
             FROM usuarios WHERE id = $1`,
            [id]
        );
        return rows[0] || null;
    }

    static async existeUsernameOEmail(username, email) {
        const { rows } = await db.query(
            'SELECT id FROM usuarios WHERE username = $1 OR email = $2 LIMIT 1',
            [username, email]
        );
        return rows.length > 0;
    }

    static async actualizarPassword(usuarioId, nuevaPasswordPlano) {
        const passwordHash = await bcrypt.hash(nuevaPasswordPlano, SALT_ROUNDS);
        await db.query(
            'UPDATE usuarios SET password_hash = $1 WHERE id = $2',
            [passwordHash, usuarioId]
        );
    }

    static async verificarPassword(passwordPlano, passwordHash) {
        return bcrypt.compare(passwordPlano, passwordHash);
    }
}

module.exports = UserModel;
