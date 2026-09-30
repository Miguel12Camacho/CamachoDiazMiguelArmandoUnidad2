const ProductModel = require('../models/ProductModel');
const CartModel = require('../models/CartModel');

/**
 * Clase StoreController
 * Expone el catálogo de productos y el carrito de compras.
 * Todas las rutas aquí ya pasan por el middleware requireAuth.
 */
class StoreController {
    static async listarProductos(req, res) {
        try {
            const productos = await ProductModel.listarTodos();
            return res.status(200).json({ productos });
        } catch (err) {
            return res.status(500).json({ error: 'No se pudo obtener el catálogo.' });
        }
    }

    static async obtenerCarrito(req, res) {
        try {
            const items = await CartModel.obtener(req.session.usuario.id);
            return res.status(200).json({ items });
        } catch (err) {
            return res.status(500).json({ error: 'No se pudo obtener el carrito.' });
        }
    }

    static async agregarAlCarrito(req, res) {
        try {
            const { productoId, cantidad } = req.body;
            if (!productoId) {
                return res.status(400).json({ error: 'productoId es obligatorio.' });
            }
            const producto = await ProductModel.buscarPorId(productoId);
            if (!producto) {
                return res.status(404).json({ error: 'Producto no encontrado.' });
            }
            const item = await CartModel.agregar(req.session.usuario.id, productoId, cantidad || 1);
            return res.status(200).json({ mensaje: 'Producto agregado al carrito.', item });
        } catch (err) {
            return res.status(500).json({ error: 'No se pudo agregar el producto al carrito.' });
        }
    }

    static async actualizarCantidad(req, res) {
        try {
            const { productoId, cantidad } = req.body;
            const item = await CartModel.actualizarCantidad(req.session.usuario.id, productoId, cantidad);
            return res.status(200).json({ mensaje: 'Carrito actualizado.', item });
        } catch (err) {
            return res.status(500).json({ error: 'No se pudo actualizar el carrito.' });
        }
    }

    static async eliminarDelCarrito(req, res) {
        try {
            const { productoId } = req.params;
            await CartModel.eliminar(req.session.usuario.id, productoId);
            return res.status(200).json({ mensaje: 'Producto eliminado del carrito.' });
        } catch (err) {
            return res.status(500).json({ error: 'No se pudo eliminar el producto.' });
        }
    }

    static async checkout(req, res) {
        try {
            const items = await CartModel.obtener(req.session.usuario.id);
            if (items.length === 0) {
                return res.status(400).json({ error: 'El carrito está vacío.' });
            }
            const total = items.reduce((acc, it) => acc + Number(it.precio) * it.cantidad, 0);
            await CartModel.vaciar(req.session.usuario.id);
            return res.status(200).json({
                mensaje: '¡Compra realizada con éxito!',
                folio: `ORD-${Date.now()}`,
                total: total.toFixed(2)
            });
        } catch (err) {
            return res.status(500).json({ error: 'No se pudo procesar la compra.' });
        }
    }
}

module.exports = StoreController;
