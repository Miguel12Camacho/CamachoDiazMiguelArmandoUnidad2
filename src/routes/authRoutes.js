const express = require('express');
const AuthController = require('../controllers/AuthController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/registro', AuthController.registrar);
router.post('/login', AuthController.login);
router.post('/logout', requireAuth, AuthController.logout);
router.post('/logout-otras-sesiones', requireAuth, AuthController.cerrarOtrasSesiones);
router.get('/sesiones', requireAuth, AuthController.listarSesiones);
router.post('/olvide-password', AuthController.solicitarRecuperacion);
router.post('/restablecer-password', AuthController.restablecerPassword);
router.get('/me', AuthController.me);

module.exports = router;
