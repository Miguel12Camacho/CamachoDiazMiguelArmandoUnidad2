/**
 * Clase AuthUI
 * Controla el toggle visual login/registro y el envío de
 * los formularios al backend mediante fetch.
 */
class AuthUI {
    constructor() {
        this.wrapper = document.querySelector('.auth-wrapper');
        this.loginTrigger = document.querySelector('.login-trigger');
        this.registerTrigger = document.querySelector('.register-trigger');
        this.loginForm = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');

        this.bindToggle();
        this.bindLogin();
        this.bindRegister();
        this.checkRedirectReason();
    }

    bindToggle() {
        this.registerTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            this.wrapper.classList.add('toggled');
        });

        this.loginTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            this.wrapper.classList.remove('toggled');
        });
    }

    checkRedirectReason() {
        const params = new URLSearchParams(window.location.search);
        if (params.get('auth') === 'requerido') {
            this.showMessage('login', 'Necesitas iniciar sesión para continuar.', 'error');
        }
    }

    showMessage(formName, texto, tipo) {
        const el = document.querySelector(`.form-message[data-form="${formName}"]`);
        if (!el) return;
        el.textContent = texto;
        el.classList.remove('error', 'success', 'show');
        void el.offsetWidth; // reinicia la animación
        el.classList.add(tipo, 'show');
    }

    toggleLoading(button, cargando) {
        const text = button.querySelector('.btn-text');
        const spinner = button.querySelector('.btn-spinner');
        button.disabled = cargando;
        spinner.hidden = !cargando;
        text.style.opacity = cargando ? '0.6' : '1';
    }

    bindLogin() {
        this.loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = this.loginForm.querySelector('.submit-button');
            const datos = Object.fromEntries(new FormData(this.loginForm).entries());

            this.toggleLoading(btn, true);
            try {
                const resp = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datos)
                });
                const data = await resp.json();

                if (!resp.ok) {
                    this.showMessage('login', data.error || 'No se pudo iniciar sesión.', 'error');
                    this.toggleLoading(btn, false);
                    return;
                }

                this.showMessage('login', '¡Bienvenido! Redirigiendo a la tienda...', 'success');
                setTimeout(() => {
                    window.location.href = data.redirect || '/tienda';
                }, 700);
            } catch (err) {
                this.showMessage('login', 'Error de conexión con el servidor.', 'error');
                this.toggleLoading(btn, false);
            }
        });
    }

    bindRegister() {
        this.registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = this.registerForm.querySelector('.submit-button');
            const datos = Object.fromEntries(new FormData(this.registerForm).entries());

            this.toggleLoading(btn, true);
            try {
                const resp = await fetch('/api/auth/registro', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datos)
                });
                const data = await resp.json();

                if (!resp.ok) {
                    this.showMessage('registro', data.error || 'No se pudo crear la cuenta.', 'error');
                    this.toggleLoading(btn, false);
                    return;
                }

                this.showMessage('registro', 'Cuenta creada. Ahora inicia sesión.', 'success');
                this.toggleLoading(btn, false);
                this.registerForm.reset();
                setTimeout(() => this.wrapper.classList.remove('toggled'), 1000);
            } catch (err) {
                this.showMessage('registro', 'Error de conexión con el servidor.', 'error');
                this.toggleLoading(btn, false);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => new AuthUI());
