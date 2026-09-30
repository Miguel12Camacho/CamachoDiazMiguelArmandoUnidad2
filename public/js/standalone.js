/**
 * Clase StandaloneForm
 * Componente reutilizable para formularios simples (recuperar y
 * restablecer contraseña) que envían datos por fetch y muestran
 * mensajes de éxito/error con la misma estética del login.
 */
class StandaloneForm {
    constructor({ formId, messageForm, endpoint, buildBody, validate, onSuccess }) {
        this.form = document.getElementById(formId);
        this.messageForm = messageForm;
        this.endpoint = endpoint;
        this.buildBody = buildBody || ((datos) => datos);
        this.validate = validate || (() => null);
        this.onSuccess = onSuccess || (() => {});

        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    }

    showMessage(texto, tipo) {
        const el = document.querySelector(`.form-message[data-form="${this.messageForm}"]`);
        if (!el) return;
        el.textContent = texto;
        el.classList.remove('error', 'success', 'show');
        void el.offsetWidth;
        el.classList.add(tipo, 'show');
    }

    toggleLoading(cargando) {
        const btn = this.form.querySelector('.submit-button');
        const text = btn.querySelector('.btn-text');
        const spinner = btn.querySelector('.btn-spinner');
        btn.disabled = cargando;
        spinner.hidden = !cargando;
        text.style.opacity = cargando ? '0.6' : '1';
    }

    async handleSubmit(e) {
        e.preventDefault();
        const datos = Object.fromEntries(new FormData(this.form).entries());

        const errorValidacion = this.validate(datos);
        if (errorValidacion) {
            this.showMessage(errorValidacion, 'error');
            return;
        }

        this.toggleLoading(true);
        try {
            const resp = await fetch(this.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.buildBody(datos))
            });
            const data = await resp.json();

            if (!resp.ok) {
                this.showMessage(data.error || 'Ocurrió un error.', 'error');
                this.toggleLoading(false);
                return;
            }

            this.showMessage(data.mensaje || 'Operación exitosa.', 'success');
            this.toggleLoading(false);
            this.onSuccess(data, this.form);
        } catch (err) {
            this.showMessage('Error de conexión con el servidor.', 'error');
            this.toggleLoading(false);
        }
    }
}
