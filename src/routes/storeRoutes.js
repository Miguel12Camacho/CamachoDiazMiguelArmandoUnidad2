const express = require('express');
const StoreController = require('../controllers/StoreController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Todas las rutas de la tienda requieren sesión iniciada
router.use(requireAuth);

router.get('/productos', StoreController.listarProductos);
router.get('/carrito', StoreController.obtenerCarrito);
router.post('/carrito', StoreController.agregarAlCarrito);
router.put('/carrito', StoreController.actualizarCantidad);
router.delete('/carrito/:productoId', StoreController.eliminarDelCarrito);
router.post('/checkout', StoreController.checkout);

module.exports = router;
