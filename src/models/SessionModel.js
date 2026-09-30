const db = require('../config/db');

/**
 * Clase SessionModel
 * Lleva el registro de las sesiones activas por usuario para
 * permitir el manejo de multisesiones: ver desde qué dispositivos
 * hay una sesión iniciada y poder cerrarlas de forma individual
 * o todas a la vez.
 */
class SessionModel {
    static async registrar({ usuarioId, sessionId, ip, userAgent }) {
        const query = `
            INSERT INTO sesiones_usuario (usuario_id, session_id, ip_address, user_agent)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        `;
        const { rows } = await db.query(query, [usuarioId, sessionId, ip, userAgent]);
        return rows[0];
    }

    static async listarActivas(usuarioId) {
        const query = `
            SELECT id, session_id, ip_address, user_agent, creado_en, ultima_actividad
            FROM sesiones_usuario
            WHERE usuario_id = $1 AND activa = TRUE
            ORDER BY ultima_actividad DESC
        `;
        const { rows } = await db.query(query, [usuarioId]);
        return rows;
    }

    static async actualizarActividad(sessionId) {
        await db.query(
            'UPDATE sesiones_usuario SET ultima_actividad = NOW() WHERE session_id = $1',
            [sessionId]
        );
    }

    static async cerrarPorSessionId(sessionId) {
        await db.query(
            'UPDATE sesiones_usuario SET activa = FALSE WHERE session_id = $1',
            [sessionId]
        );
        // También se elimina del store de sesiones de express (connect-pg-simple)
        await db.query('DELETE FROM session WHERE sid = $1', [sessionId]);
    }

    static async cerrarTodasMenos(usuarioId, sessionIdActual) {
        const { rows } = await db.query(
            `SELECT session_id FROM sesiones_usuario
             WHERE usuario_id = $1 AND activa = TRUE AND session_id != $2`,
            [usuarioId, sessionIdActual]
        );

        await db.query(
            `UPDATE sesiones_usuario SET activa = FALSE
             WHERE usuario_id = $1 AND session_id != $2`,
            [usuarioId, sessionIdActual]
        );

        const ids = rows.map((r) => r.session_id);
        if (ids.length > 0) {
            await db.query('DELETE FROM session WHERE sid = ANY($1::text[])', [ids]);
        }
        return ids.length;
    }
}

module.exports = SessionModel;
