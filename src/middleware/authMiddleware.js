const SessionModel = require('../models/SessionModel');

/**
 * Middleware requireAuth
 * Protege rutas que requieren que exista una sesión activa.
 */
async function requireAuth(req, res, next) {
    if (!req.session || !req.session.usuario) {
        return res.status(401).json({ error: 'No has iniciado sesión.' });
    }
    // Actualiza el "último visto" de esta sesión (soporte multisesión)
    SessionModel.actualizarActividad(req.sessionID).catch(() => {});
    next();
}

/**
 * Middleware requireAdmin
 * Protege rutas exclusivas para usuarios tipo "admin".
 */
function requireAdmin(req, res, next) {
    if (!req.session || !req.session.usuario) {
        return res.status(401).json({ error: 'No has iniciado sesión.' });
    }
    if (req.session.usuario.tipoUsuario !== 'admin') {
        return res.status(403).json({ error: 'No tienes permisos para acceder a este recurso.' });
    }
    next();
}

/**
 * Middleware para proteger el acceso directo a páginas HTML
 * (por ejemplo /tienda). Si no hay sesión, redirige al login.
 */
function requireAuthPage(req, res, next) {
    if (!req.session || !req.session.usuario) {
        return res.redirect('/?auth=requerido');
    }
    next();
}

module.exports = { requireAuth, requireAdmin, requireAuthPage };
