const path = require('path');
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
require('dotenv').config();

const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const storeRoutes = require('./routes/storeRoutes');
const { requireAuthPage } = require('./middleware/authMiddleware');

const app = express();

app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Sesiones persistidas en PostgreSQL (soporta multisesión de forma nativa) ---
app.use(session({
    store: new pgSession({
        pool: db.pool,
        tableName: 'session',
        createTableIfMissing: false
    }),
    name: 'connect.sid',
    secret: process.env.SESSION_SECRET || 'clave_de_desarrollo_cambiame',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 8, // 8 horas
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
    }
}));

// --- Archivos estáticos públicos (login, registro, recuperación, css, js) ---
app.use(express.static(path.join(__dirname, '..', 'public')));

// --- API ---
app.use('/api/auth', authRoutes);
app.use('/api/tienda', storeRoutes);

// --- Página protegida: la tienda virtual solo se sirve con sesión activa ---
app.get('/tienda', requireAuthPage, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'protected', 'tienda.html'));
});

// --- 404 para rutas de API no encontradas ---
app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Recurso no encontrado.' });
});

module.exports = app;
