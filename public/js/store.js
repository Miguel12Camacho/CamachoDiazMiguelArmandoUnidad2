/**
 * Clase ApiClient
 * Pequeño envoltorio sobre fetch para centralizar las llamadas
 * a la API de la tienda y autenticación.
 */
class ApiClient {
    static async get(url) {
        const resp = await fetch(url);
        return ApiClient.#procesar(resp);
    }
    static async post(url, body) {
        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body || {})
        });
        return ApiClient.#procesar(resp);
    }
    static async put(url, body) {
        const resp = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body || {})
        });
        return ApiClient.#procesar(resp);
    }
    static async delete(url) {
        const resp = await fetch(url, { method: 'DELETE' });
        return ApiClient.#procesar(resp);
    }
    static async #procesar(resp) {
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
            const err = new Error(data.error || 'Error en la petición.');
            err.status = resp.status;
            throw err;
        }
        return data;
    }
}

/**
 * Clase StoreApp
 * Orquesta la tienda virtual: sesión del usuario, catálogo,
 * carrito y panel de sesiones activas.
 */
class StoreApp {
    constructor() {
        this.usuario = null;
        this.productos = [];
        this.carrito = [];

        this.dom = {
            userName: document.getElementById('userName'),
            userType: document.getElementById('userType'),
            heroTitle: document.getElementById('heroTitle'),
            grid: document.getElementById('productsGrid'),
            cartBtn: document.getElementById('cartBtn'),
            cartBadge: document.getElementById('cartBadge'),
            cartDrawer: document.getElementById('cartDrawer'),
            cartOverlay: document.getElementById('cartOverlay'),
            closeCart: document.getElementById('closeCart'),
            cartItems: document.getElementById('cartItems'),
            cartTotal: document.getElementById('cartTotal'),
            checkoutBtn: document.getElementById('checkoutBtn'),
            logoutBtn: document.getElementById('logoutBtn'),
            sessionsBtn: document.getElementById('sessionsBtn'),
            sessionsDrawer: document.getElementById('sessionsDrawer'),
            sessionsOverlay: document.getElementById('sessionsOverlay'),
            closeSessions: document.getElementById('closeSessions'),
            sessionsList: document.getElementById('sessionsList'),
            closeOtherSessionsBtn: document.getElementById('closeOtherSessionsBtn'),
            successModal: document.getElementById('successModal'),
            successDetails: document.getElementById('successDetails'),
            closeSuccessModal: document.getElementById('closeSuccessModal'),
            toast: document.getElementById('toast')
        };

        this.init();
    }

    async init() {
        try {
            const { usuario } = await ApiClient.get('/api/auth/me');
            this.usuario = usuario;
            this.pintarUsuario();
        } catch (err) {
            window.location.href = '/?auth=requerido';
            return;
        }

        this.bindEventos();
        await this.cargarProductos();
        await this.cargarCarrito();
    }

    pintarUsuario() {
        this.dom.userName.textContent = `${this.usuario.nombre}`;
        this.dom.userType.textContent = this.usuario.tipoUsuario;
        this.dom.heroTitle.textContent =
            this.usuario.tipoUsuario === 'admin'
                ? `Panel de administrador, ${this.usuario.nombre} 👋`
                : `¡Bienvenido, ${this.usuario.nombre}! 🛍️`;
    }

    bindEventos() {
        this.dom.cartBtn.addEventListener('click', () => this.toggleDrawer('cart', true));
        this.dom.closeCart.addEventListener('click', () => this.toggleDrawer('cart', false));
        this.dom.cartOverlay.addEventListener('click', () => this.toggleDrawer('cart', false));

        this.dom.sessionsBtn.addEventListener('click', () => {
            this.toggleDrawer('sessions', true);
            this.cargarSesiones();
        });
        this.dom.closeSessions.addEventListener('click', () => this.toggleDrawer('sessions', false));
        this.dom.sessionsOverlay.addEventListener('click', () => this.toggleDrawer('sessions', false));

        this.dom.logoutBtn.addEventListener('click', () => this.logout());
        this.dom.checkoutBtn.addEventListener('click', () => this.checkout());
        this.dom.closeOtherSessionsBtn.addEventListener('click', () => this.cerrarOtrasSesiones());
        this.dom.closeSuccessModal.addEventListener('click', () => this.dom.successModal.classList.remove('show'));
    }

    toggleDrawer(tipo, abrir) {
        const drawer = tipo === 'cart' ? this.dom.cartDrawer : this.dom.sessionsDrawer;
        const overlay = tipo === 'cart' ? this.dom.cartOverlay : this.dom.sessionsOverlay;
        drawer.classList.toggle('open', abrir);
        overlay.classList.toggle('show', abrir);
    }

    mostrarToast(texto) {
        this.dom.toast.textContent = texto;
        this.dom.toast.classList.add('show');
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => this.dom.toast.classList.remove('show'), 2400);
    }

    // ---------------- Catálogo ----------------
    async cargarProductos() {
        try {
            const { productos } = await ApiClient.get('/api/tienda/productos');
            this.productos = productos;
            this.renderProductos();
        } catch (err) {
            this.mostrarToast('No se pudo cargar el catálogo.');
        }
    }

    renderProductos() {
        this.dom.grid.innerHTML = this.productos.map((p, i) => `
            <div class="product-card" style="animation-delay:${0.05 * i}s">
                <div class="product-image-wrap">
                    <span class="product-category-badge">${p.categoria || 'General'}</span>
                    <img class="product-image" src="${p.imagen_url}" alt="${p.nombre}" loading="lazy"
                         onload="this.classList.add('loaded')">
                </div>
                <div class="product-info">
                    <span class="product-category">${p.categoria || 'General'}</span>
                    <span class="product-name">${p.nombre}</span>
                    <span class="product-desc">${p.descripcion || ''}</span>
                    <div class="product-footer">
                        <span class="product-price">$${Number(p.precio).toFixed(2)}</span>
                        <button class="add-cart-btn" data-id="${p.id}">
                            <i class="fa-solid fa-cart-plus"></i> Agregar
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // Por si la imagen ya viene cacheada y "onload" no dispara a tiempo
        this.dom.grid.querySelectorAll('.product-image').forEach((img) => {
            if (img.complete) img.classList.add('loaded');
        });

        this.dom.grid.querySelectorAll('.add-cart-btn').forEach((btn) => {
            btn.addEventListener('click', () => this.agregarAlCarrito(btn));
        });
    }

    async agregarAlCarrito(btn) {
        const productoId = btn.dataset.id;
        try {
            await ApiClient.post('/api/tienda/carrito', { productoId, cantidad: 1 });
            btn.classList.add('added');
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Agregado';
            setTimeout(() => {
                btn.classList.remove('added');
                btn.innerHTML = '<i class="fa-solid fa-cart-plus"></i> Agregar';
            }, 1000);
            await this.cargarCarrito();
            this.animarCarritoIcono();
            this.mostrarToast('Producto agregado al carrito.');
        } catch (err) {
            this.mostrarToast(err.message);
        }
    }

    animarCarritoIcono() {
        this.dom.cartBadge.classList.remove('bump');
        this.dom.cartBtn.classList.remove('cart-shake');
        // Forzar reflow para poder re-disparar la animación
        void this.dom.cartBadge.offsetWidth;
        this.dom.cartBadge.classList.add('bump');
        this.dom.cartBtn.classList.add('cart-shake');
        setTimeout(() => {
            this.dom.cartBadge.classList.remove('bump');
            this.dom.cartBtn.classList.remove('cart-shake');
        }, 500);
    }

    // ---------------- Carrito ----------------
    async cargarCarrito() {
        try {
            const { items } = await ApiClient.get('/api/tienda/carrito');
            this.carrito = items;
            this.renderCarrito();
        } catch (err) {
            this.mostrarToast('No se pudo cargar el carrito.');
        }
    }

    renderCarrito() {
        const totalItems = this.carrito.reduce((acc, it) => acc + it.cantidad, 0);
        this.dom.cartBadge.textContent = totalItems;

        if (this.carrito.length === 0) {
            this.dom.cartItems.innerHTML = '<p class="cart-empty">Tu carrito está vacío.</p>';
            this.dom.cartTotal.textContent = '$0.00';
            return;
        }

        this.dom.cartItems.innerHTML = this.carrito.map((it) => `
            <div class="cart-item" data-id="${it.id}">
                <img src="${it.imagen_url}" alt="${it.nombre}">
                <div class="cart-item-info">
                    <div class="name">${it.nombre}</div>
                    <div class="price">$${Number(it.precio).toFixed(2)}</div>
                    <div class="qty-controls">
                        <button class="qty-minus" data-id="${it.id}">−</button>
                        <span>${it.cantidad}</span>
                        <button class="qty-plus" data-id="${it.id}">+</button>
                    </div>
                </div>
                <button class="remove-item" data-id="${it.id}"><i class="fa-solid fa-trash"></i></button>
            </div>
        `).join('');

        const total = this.carrito.reduce((acc, it) => acc + Number(it.precio) * it.cantidad, 0);
        this.dom.cartTotal.textContent = `$${total.toFixed(2)}`;

        this.dom.cartItems.querySelectorAll('.qty-plus').forEach((b) =>
            b.addEventListener('click', () => this.cambiarCantidad(b.dataset.id, 1)));
        this.dom.cartItems.querySelectorAll('.qty-minus').forEach((b) =>
            b.addEventListener('click', () => this.cambiarCantidad(b.dataset.id, -1)));
        this.dom.cartItems.querySelectorAll('.remove-item').forEach((b) =>
            b.addEventListener('click', () => this.eliminarDelCarrito(b.dataset.id)));
    }

    async cambiarCantidad(productoId, delta) {
        const item = this.carrito.find((it) => String(it.id) === String(productoId));
        if (!item) return;
        const nuevaCantidad = item.cantidad + delta;
        try {
            await ApiClient.put('/api/tienda/carrito', { productoId, cantidad: nuevaCantidad });
            await this.cargarCarrito();
        } catch (err) {
            this.mostrarToast(err.message);
        }
    }

    async eliminarDelCarrito(productoId) {
        const el = this.dom.cartItems.querySelector(`.cart-item[data-id="${productoId}"]`);
        if (el) el.classList.add('removing');
        try {
            await ApiClient.delete(`/api/tienda/carrito/${productoId}`);
            setTimeout(() => this.cargarCarrito(), el ? 250 : 0);
        } catch (err) {
            if (el) el.classList.remove('removing');
            this.mostrarToast(err.message);
        }
    }

    async checkout() {
        if (this.carrito.length === 0) {
            this.mostrarToast('Agrega productos antes de finalizar la compra.');
            return;
        }
        const btn = this.dom.checkoutBtn;
        const text = btn.querySelector('.btn-text');
        const spinner = btn.querySelector('.btn-spinner');
        btn.disabled = true;
        spinner.hidden = false;
        text.style.opacity = '.6';

        try {
            const data = await ApiClient.post('/api/tienda/checkout');
            this.dom.successDetails.textContent = `Folio: ${data.folio} · Total: $${data.total}`;
            this.dom.successModal.classList.add('show');
            this.toggleDrawer('cart', false);
            await this.cargarCarrito();
        } catch (err) {
            this.mostrarToast(err.message);
        } finally {
            btn.disabled = false;
            spinner.hidden = true;
            text.style.opacity = '1';
        }
    }

    // ---------------- Sesiones (multisesión) ----------------
    async cargarSesiones() {
        try {
            const { sesiones } = await ApiClient.get('/api/auth/sesiones');
            this.dom.sessionsList.innerHTML = sesiones.map((s) => `
                <div class="session-item ${s.esActual ? 'current' : ''}">
                    <div class="row">
                        <strong>${s.esActual ? 'Este dispositivo' : 'Otro dispositivo'}</strong>
                        ${s.esActual ? '<span class="session-tag">Activa</span>' : ''}
                    </div>
                    <div>IP: ${s.ip_address || 'desconocida'}</div>
                    <div>Última actividad: ${new Date(s.ultima_actividad).toLocaleString()}</div>
                </div>
            `).join('') || '<p class="cart-empty">No hay sesiones activas.</p>';
        } catch (err) {
            this.mostrarToast('No se pudieron cargar las sesiones.');
        }
    }

    async cerrarOtrasSesiones() {
        try {
            const data = await ApiClient.post('/api/auth/logout-otras-sesiones');
            this.mostrarToast(data.mensaje);
            await this.cargarSesiones();
        } catch (err) {
            this.mostrarToast(err.message);
        }
    }

    async logout() {
        try {
            await ApiClient.post('/api/auth/logout');
        } finally {
            window.location.href = '/';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => new StoreApp());
