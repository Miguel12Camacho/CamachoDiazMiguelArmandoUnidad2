-- ============================================================
-- Esquema de base de datos - PostgreSQL
-- Proyecto: AuthScreen + Tienda Virtual
-- ============================================================

-- Elimina las tablas si ya existen (útil para reinstalaciones en desarrollo)
DROP TABLE IF EXISTS carrito_items CASCADE;
DROP TABLE IF EXISTS sesiones_usuario CASCADE;
DROP TABLE IF EXISTS password_resets CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS session CASCADE;

-- ------------------------------------------------------------
-- Tabla de usuarios
-- ------------------------------------------------------------
CREATE TABLE usuarios (
    id              SERIAL PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,
    apellidos       VARCHAR(100) NOT NULL,
    username        VARCHAR(50)  UNIQUE NOT NULL,
    email           VARCHAR(150) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    tipo_usuario    VARCHAR(20)  NOT NULL DEFAULT 'cliente'
                        CHECK (tipo_usuario IN ('cliente', 'admin')),
    activo          BOOLEAN DEFAULT TRUE,
    creado_en       TIMESTAMP DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Tabla requerida por connect-pg-simple para persistir las
-- sesiones de Express directamente en PostgreSQL.
-- ------------------------------------------------------------
CREATE TABLE session (
    sid     VARCHAR NOT NULL COLLATE "default",
    sess    JSON    NOT NULL,
    expire  TIMESTAMP(6) NOT NULL
)
WITH (OIDS = FALSE);

ALTER TABLE session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;

CREATE INDEX IDX_session_expire ON session (expire);

-- ------------------------------------------------------------
-- Registro de sesiones por usuario (manejo de multisesiones):
-- permite ver y cerrar sesiones activas en distintos
-- dispositivos/navegadores para un mismo usuario.
-- ------------------------------------------------------------
CREATE TABLE sesiones_usuario (
    id                SERIAL PRIMARY KEY,
    usuario_id        INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    session_id        VARCHAR(255) NOT NULL,
    ip_address        VARCHAR(45),
    user_agent        TEXT,
    creado_en         TIMESTAMP DEFAULT NOW(),
    ultima_actividad  TIMESTAMP DEFAULT NOW(),
    activa            BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_sesiones_usuario_id ON sesiones_usuario (usuario_id);

-- ------------------------------------------------------------
-- Tokens para recuperación de contraseña
-- ------------------------------------------------------------
CREATE TABLE password_resets (
    id          SERIAL PRIMARY KEY,
    usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token       VARCHAR(255) UNIQUE NOT NULL,
    expira_en   TIMESTAMP NOT NULL,
    usado       BOOLEAN DEFAULT FALSE,
    creado_en   TIMESTAMP DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Catálogo de productos de la tienda virtual
-- ------------------------------------------------------------
CREATE TABLE productos (
    id            SERIAL PRIMARY KEY,
    nombre        VARCHAR(150) NOT NULL,
    descripcion   TEXT,
    precio        NUMERIC(10,2) NOT NULL,
    categoria     VARCHAR(80),
    imagen_url    TEXT,
    stock         INTEGER DEFAULT 0,
    creado_en     TIMESTAMP DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Carrito de compras (persistente por usuario)
-- ------------------------------------------------------------
CREATE TABLE carrito_items (
    id            SERIAL PRIMARY KEY,
    usuario_id    INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    producto_id   INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    cantidad      INTEGER NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    agregado_en   TIMESTAMP DEFAULT NOW(),
    UNIQUE (usuario_id, producto_id)
);

-- ============================================================
-- Datos de ejemplo (seed) — 20 productos con imágenes
-- ============================================================
INSERT INTO productos (nombre, descripcion, precio, categoria, imagen_url, stock) VALUES
('Audífonos Inalámbricos Aurora', 'Cancelación de ruido activa, 30h de batería y estuche de carga rápida.', 1299.00, 'Audio', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80', 25),
('Teclado Mecánico NebulaKey', 'Switches táctiles, retroiluminación RGB personalizable y cuerpo en aluminio.', 1599.00, 'Periféricos', 'https://images.unsplash.com/photo-1595225476474-0a2c0f0f8a08?auto=format&fit=crop&w=600&q=80', 15),
('Mouse Ergonómico Comet', 'Sensor óptico de 16000 DPI, diseño ergonómico y 6 botones programables.', 599.00, 'Periféricos', 'https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=600&q=80', 40),
('Monitor UltraWide Zenith 34"', 'Panel IPS 144Hz, resolución QHD y compatibilidad con FreeSync.', 7999.00, 'Monitores', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80', 8),
('Laptop Stealth 14 Pro', 'Procesador de última generación, 16GB RAM y SSD de 1TB.', 18999.00, 'Cómputo', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=80', 6),
('Silla Gamer Vortex', 'Soporte lumbar ajustable, reclinable a 180° y reposabrazos 4D.', 3499.00, 'Mobiliario', 'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=600&q=80', 10),
('Webcam StreamVision 4K', 'Video 4K a 30fps, enfoque automático y micrófono estéreo integrado.', 899.00, 'Audio', 'https://images.unsplash.com/photo-1587826080692-f439465d97b8?auto=format&fit=crop&w=600&q=80', 20),
('Mochila TechCarry Pro', 'Compartimento acolchado para laptop de 15", puerto USB externo.', 749.00, 'Accesorios', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80', 30),
('Smartwatch PulseFit X2', 'Monitoreo de ritmo cardíaco, GPS integrado y resistencia al agua 5ATM.', 2199.00, 'Wearables', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80', 18),
('Bocina Bluetooth Thunder Bass', 'Sonido envolvente 360°, resistente al agua IPX7 y 12h de autonomía.', 899.00, 'Audio', 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=600&q=80', 22),
('Tablet Vision Pad 11', 'Pantalla 2K de 11", stylus incluido y 128GB de almacenamiento.', 6499.00, 'Cómputo', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80', 12),
('Disco SSD NovaSpeed 1TB', 'Velocidades de lectura de hasta 3500MB/s, factor M.2 NVMe.', 1099.00, 'Almacenamiento', 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80', 35),
('Cámara Mirrorless PixelShot', 'Sensor APS-C 24MP, grabación 4K y montura intercambiable.', 12999.00, 'Fotografía', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80', 5),
('Router WiFi 6 SkyMesh', 'Cobertura mesh de hasta 300m², triple banda y control parental.', 1899.00, 'Redes', 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80', 14),
('Impresora InkFlow Pro', 'Impresión a color, WiFi directo y sistema de tinta continua.', 2499.00, 'Oficina', 'https://images.unsplash.com/photo-1612815154858-60aa4c59eabd?auto=format&fit=crop&w=600&q=80', 9),
('Micrófono Condensador StudioVoice', 'Patrón cardioide, brazo articulado y filtro anti-pop incluido.', 1399.00, 'Audio', 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=600&q=80', 16),
('Foco Inteligente GlowSphere', 'Control por app, 16 millones de colores y compatible con voz.', 349.00, 'Smart Home', 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80', 50),
('Consola Retro PlayBox Mini', 'Más de 500 juegos clásicos preinstalados y salida HDMI.', 1799.00, 'Gaming', 'https://images.unsplash.com/photo-1486401899868-0e435ed85128?auto=format&fit=crop&w=600&q=80', 11),
('Cargador Portátil PowerCell 20K', 'Batería de 20,000mAh, carga rápida USB-C de 65W.', 649.00, 'Accesorios', 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=600&q=80', 45),
('Escritorio Ajustable RiseDesk', 'Altura eléctrica ajustable, superficie de bambú y memoria de posiciones.', 5499.00, 'Mobiliario', 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=600&q=80', 7);
