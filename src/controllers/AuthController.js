const AuthService = require('../services/AuthService');
const SessionModel = require('../models/SessionModel');

/**
 * Clase AuthController
 * Traduce peticiones HTTP a llamadas del AuthService y
 * construye las respuestas JSON.
 */
class AuthController {
    static async registrar(req, res) {
        try {
            const usuario = await AuthService.registrar(req.body);
            return res.status(201).json({ mensaje: 'Cuenta creada correctamente.', usuario });
        } catch (err) {
            return res.status(err.status || 500).json({ error: err.message || 'Error al registrar usuario.' });
        }
    }

    static async login(req, res) {
        try {
            const { identificador, password } = req.body;
            const usuario = await AuthService.login({ identificador, password });

            // Regenerar la sesión evita "session fixation"
            req.session.regenerate(async (err) => {
                if (err) {
                    return res.status(500).json({ error: 'No se pudo iniciar sesión.' });
                }

                req.session.usuario = usuario;

                await AuthService.registrarSesion({
                    usuarioId: usuario.id,
                    sessionId: req.sessionID,
                    ip: req.ip,
                    userAgent: req.headers['user-agent'] || 'desconocido'
                });

                req.session.save(() => {
                    const destino = usuario.tipoUsuario === 'admin' ? '/tienda?panel=admin' : '/tienda';
                    return res.status(200).json({ mensaje: 'Inicio de sesión exitoso.', usuario, redirect: destino });
                });
            });
        } catch (err) {
            return res.status(err.status || 500).json({ error: err.message || 'Error al iniciar sesión.' });
        }
    }

    static async logout(req, res) {
        const sessionId = req.sessionID;
        req.session.destroy(async (err) => {
            if (sessionId) {
                await SessionModel.cerrarPorSessionId(sessionId).catch(() => {});
            }
            if (err) {
                return res.status(500).json({ error: 'No se pudo cerrar la sesión.' });
            }
            res.clearCookie('connect.sid');
            return res.status(200).json({ mensaje: 'Sesión cerrada correctamente.' });
        });
    }

    static async cerrarOtrasSesiones(req, res) {
        try {
            const cerradas = await SessionModel.cerrarTodasMenos(req.session.usuario.id, req.sessionID);
            return res.status(200).json({ mensaje: `Se cerraron ${cerradas} sesión(es) activas.` });
        } catch (err) {
            return res.status(500).json({ error: 'No se pudieron cerrar las demás sesiones.' });
        }
    }

    static async listarSesiones(req, res) {
        try {
            const sesiones = await SessionModel.listarActivas(req.session.usuario.id);
            const actuales = sesiones.map((s) => ({
                ...s,
                esActual: s.session_id === req.sessionID
            }));
            return res.status(200).json({ sesiones: actuales });
        } catch (err) {
            return res.status(500).json({ error: 'No se pudieron obtener las sesiones activas.' });
        }
    }

    static async solicitarRecuperacion(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ error: 'El correo es obligatorio.' });
            }
            const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
            await AuthService.iniciarRecuperacion(email, appUrl);
            return res.status(200).json({
                mensaje: 'Si el correo está registrado, recibirás un enlace de recuperación en breve.'
            });
        } catch (err) {
            return res.status(err.status || 500).json({ error: err.message || 'Error al procesar la solicitud.' });
        }
    }

    static async restablecerPassword(req, res) {
        try {
            const { token, password } = req.body;
            if (!token) {
                return res.status(400).json({ error: 'Token no proporcionado.' });
            }
            await AuthService.restablecerPassword(token, password);
            return res.status(200).json({ mensaje: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' });
        } catch (err) {
            return res.status(err.status || 500).json({ error: err.message || 'Error al restablecer la contraseña.' });
        }
    }

    static me(req, res) {
        if (!req.session.usuario) {
            return res.status(401).json({ error: 'No autenticado.' });
        }
        return res.status(200).json({ usuario: req.session.usuario });
    }
}

module.exports = AuthController;
