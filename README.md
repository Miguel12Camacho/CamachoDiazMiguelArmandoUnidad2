## Requisitos previos

- [Node.js](https://nodejs.org/) 18 o superior
- [PostgreSQL](https://www.postgresql.org/) 13 o superior
- (Opcional) una cuenta SMTP (Gmail, etc.) si quieres que los correos de
  recuperación de contraseña se envíen de verdad. Si no la configuras, el
  enlace de recuperación se imprime en la consola del servidor.

## 1. Crear la base de datos

```bash
# Entra a psql y crea la base de datos
psql -U postgres
CREATE DATABASE tienda_auth;
\q

# Carga el esquema y los datos de ejemplo
psql -U postgres -d tienda_auth -f sql/schema.sql
```

## 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de PostgreSQL:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=Miguel12
DB_NAME=tienda_auth
SESSION_SECRET=una_clave_larga_y_aleatoria
```

## 3. Instalar dependencias

```bash
npm install
```

## 4. Ejecutar el servidor

```bash
npm start
# o en modo desarrollo con recarga automática:
npm run dev
```

Abre tu navegador en **http://localhost:3000**

- `/` → pantalla de Login / Registro (con las animaciones originales)
- `/tienda` → tienda virtual (protegida, solo accesible con sesión iniciada)
- `/forgot-password.html` → solicitar recuperación de contraseña
- `/reset-password.html?token=...` → establecer nueva contraseña

## Arquitectura (paradigma OOP)

```
server.js                     Punto de entrada
src/
 ├─ config/db.js              Clase Database (Singleton) - conexión a PostgreSQL
 ├─ models/                   Clases de acceso a datos
 │   ├─ UserModel.js
 │   ├─ SessionModel.js       Manejo de multisesiones
 │   ├─ PasswordResetModel.js Tokens de recuperación de contraseña
 │   ├─ ProductModel.js
 │   └─ CartModel.js
 ├─ services/                 Lógica de negocio
 │   ├─ AuthService.js
 │   └─ EmailService.js       Envío de correos (o log a consola si no hay SMTP)
 ├─ middleware/authMiddleware.js   Protección de rutas (requireAuth, requireAdmin)
 ├─ controllers/               Controladores HTTP
 │   ├─ AuthController.js
 │   └─ StoreController.js
 ├─ routes/                    Definición de endpoints REST
 └─ app.js                     Configuración de Express y sesiones
public/                        Frontend público (login, registro, recuperación)
views/protected/tienda.html    Frontend protegido (tienda virtual)
sql/schema.sql                 Esquema de PostgreSQL + datos de ejemplo
```

## Funcionalidades cubiertas

- ✅ **Autenticación por tipo de usuario**: cada cuenta tiene un rol
  (`cliente` o `admin`) que se guarda en la sesión y se usa para personalizar
  la tienda.
- ✅ **Manejo de multisesiones**: las sesiones se guardan en PostgreSQL
  (tabla `session` vía `connect-pg-simple`) y se registran también en
  `sesiones_usuario`, lo que permite ver todas las sesiones activas de un
  usuario (distintos dispositivos/navegadores) y cerrarlas desde el panel
  "Sesiones activas" de la tienda.
- ✅ **Recuperación de contraseñas**: flujo completo con tokens de un solo
  uso, expiración de 30 minutos y envío de correo (o log a consola).
- ✅ **Protección de rutas**: la ruta `/tienda` y todos los endpoints de
  `/api/tienda/*` requieren sesión iniciada (middleware `requireAuth`);
  existe también `requireAdmin` para futuras rutas exclusivas de
  administrador.
- ✅ **Redirección automática**: al iniciar sesión correctamente, el usuario
  es enviado directo a `/tienda`, con animaciones de entrada consistentes
  con la pantalla de login/registro.
- ✅ **Tienda virtual funcional**: catálogo de productos, carrito persistente
  en base de datos, checkout simulado con folio de compra.

## Notas para la entrega (Saber Hacer Unidad 3)

Recuerda que, según las instrucciones de tu curso, debes:

1. Tomar capturas de pantalla del funcionamiento del sitio (login, registro,
   recuperación de contraseña, tienda, carrito, checkout, multisesión).
2. Subir el proyecto completo a un repositorio de GitHub y dar acceso al
   docente. El nombre del repositorio debe seguir el formato:
   `apellidosNombreUnidad3` (ej. `reyesmoralesgabrielalejandroUnidad3`).
3. Compilar el reporte en un PDF con portada, introducción (mínimo media
   cuartilla), capturas, enlace de GitHub, conclusiones (mínimo media
   cuartilla) y fuentes en formato APA, con fuente Arial 12, interlineado 1.5
   y márgenes de 2.5 cm, texto justificado.
4. Guardar el PDF con el nombre: `U3-SH-DWP-ApellidosNombre` (sin espacios ni
   guiones extra).
