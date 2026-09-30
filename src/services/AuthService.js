const UserModel = require('../models/UserModel');
const SessionModel = require('../models/SessionModel');
const PasswordResetModel = require('../models/PasswordResetModel');
const EmailService = require('./EmailService');

/**
 * Clase AuthService
 * Contiene la lógica de negocio de autenticación, independiente
 * de Express. Los controladores llaman a estos métodos.
 */
class AuthService {
    static USUARIO_PUBLICO(usuario) {
        return {
            id: usuario.id,
            nombre: usuario.nombre,
            apellidos: usuario.apellidos,
            username: usuario.username,
            email: usuario.email,
            tipoUsuario: usuario.tipo_usuario
        };
    }

    static validarPassword(password) {
        return typeof password === 'string' && password.length >= 6;
    }

    static validarEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    static async registrar({ nombre, apellidos, username, email, password, tipoUsuario }) {
        if (!nombre || !apellidos || !username || !email || !password) {
            throw { status: 400, message: 'Todos los campos son obligatorios.' };
        }
        if (!this.validarEmail(email)) {
            throw { status: 400, message: 'El correo electrónico no es válido.' };
        }
        if (!this.validarPassword(password)) {
            throw { status: 400, message: 'La contraseña debe tener al menos 6 caracteres.' };
        }
        const tipo = ['cliente', 'admin'].includes(tipoUsuario) ? tipoUsuario : 'cliente';

        const yaExiste = await UserModel.existeUsernameOEmail(username, email);
        if (yaExiste) {
            throw { status: 409, message: 'El usuario o correo ya está registrado.' };
        }

        const usuario = await UserModel.crear({ nombre, apellidos, username, email, password, tipoUsuario: tipo });
        return this.USUARIO_PUBLICO(usuario);
    }

    static async login({ identificador, password }) {
        if (!identificador || !password) {
            throw { status: 400, message: 'Usuario/correo y contraseña son obligatorios.' };
        }

        const usuario = await UserModel.buscarPorUsernameOEmail(identificador);
        if (!usuario) {
            throw { status: 401, message: 'Credenciales incorrectas.' };
        }

        const passwordValida = await UserModel.verificarPassword(password, usuario.password_hash);
        if (!passwordValida) {
            throw { status: 401, message: 'Credenciales incorrectas.' };
        }

        return this.USUARIO_PUBLICO(usuario);
    }

    static async registrarSesion({ usuarioId, sessionId, ip, userAgent }) {
        return SessionModel.registrar({ usuarioId, sessionId, ip, userAgent });
    }

    static async iniciarRecuperacion(email, appUrl) {
        const usuario = await UserModel.buscarPorEmail(email);
        // Por seguridad, no revelamos si el correo existe o no.
        if (!usuario) {
            return { enviado: true };
        }

        const { token } = await PasswordResetModel.crear(usuario.id);
        const enlace = `${appUrl}/reset-password.html?token=${token}`;
        await EmailService.enviarRecuperacionPassword(usuario.email, enlace);
        return { enviado: true };
    }

    static async restablecerPassword(token, nuevaPassword) {
        if (!this.validarPassword(nuevaPassword)) {
            throw { status: 400, message: 'La contraseña debe tener al menos 6 caracteres.' };
        }
        const registro = await PasswordResetModel.validar(token);
        if (!registro) {
            throw { status: 400, message: 'El enlace de recuperación es inválido o ha expirado.' };
        }

        await UserModel.actualizarPassword(registro.usuario_id, nuevaPassword);
        await PasswordResetModel.marcarUsado(registro.id);
        return { actualizado: true };
    }
}

module.exports = AuthService;
