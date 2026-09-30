const nodemailer = require('nodemailer');

/**
 * Clase EmailService
 * Responsable de enviar correos electrónicos (recuperación de
 * contraseña, etc). Si no hay credenciales SMTP configuradas en
 * el .env, cae de forma segura a mostrar el enlace en la consola
 * para no bloquear el flujo durante desarrollo/pruebas.
 */
class EmailService {
    constructor() {
        this.habilitado = Boolean(
            process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
        );

        if (this.habilitado) {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT) || 587,
                secure: Number(process.env.SMTP_PORT) === 465,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
        }
    }

    async enviarRecuperacionPassword(destinatario, enlaceReset) {
        if (!this.habilitado) {
            console.log('\n📧 [EmailService] SMTP no configurado. Enlace de recuperación:');
            console.log(`   ${enlaceReset}\n`);
            return { simulado: true };
        }

        const info = await this.transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: destinatario,
            subject: 'Recuperación de contraseña - Tienda Virtual',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
                    <h2 style="color:#1a1a2e;">Recuperar contraseña</h2>
                    <p>Recibimos una solicitud para restablecer tu contraseña. Este enlace es válido por 30 minutos:</p>
                    <p><a href="${enlaceReset}" style="background:#00d4ff;color:#1a1a2e;padding:12px 20px;border-radius:30px;text-decoration:none;font-weight:600;">Restablecer contraseña</a></p>
                    <p>Si tú no solicitaste este cambio, puedes ignorar este correo.</p>
                </div>
            `
        });

        return info;
    }
}

module.exports = new EmailService();
