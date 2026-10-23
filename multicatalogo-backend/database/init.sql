-- database/init.sql
-- Script de inicialización de Base de Datos PostgreSQL 16 para MultiCatálogo

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(150) NOT NULL DEFAULT '',
    rol VARCHAR(50) NOT NULL DEFAULT 'cliente',
    activo BOOLEAN NOT NULL DEFAULT true,
    referido_id INTEGER,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Referidos (Árbol Multinivel)
CREATE TABLE IF NOT EXISTS referidos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nivel INTEGER NOT NULL DEFAULT 1,
    ventas NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    parent_id INTEGER REFERENCES referidos(id) ON DELETE SET NULL
);

-- Foreign Key usuarios -> referidos
ALTER TABLE usuarios 
    ADD CONSTRAINT fk_usuario_referido 
    FOREIGN KEY (referido_id) REFERENCES referidos(id) ON DELETE SET NULL;

-- 3. Tabla de Productos (Catálogo)
CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(10, 2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    categoria VARCHAR(100) NOT NULL,
    img TEXT NOT NULL,
    galeria TEXT[] DEFAULT '{}',
    activo BOOLEAN NOT NULL DEFAULT true
);

-- 4. Tabla de Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    cliente_email VARCHAR(150) NOT NULL,
    total NUMERIC(12, 2) NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'pendiente',
    usuario_id INTEGER REFERENCES usuarios(id),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabla de Ítems del Pedido
CREATE TABLE IF NOT EXISTS pedido_items (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES productos(id),
    cantidad INTEGER NOT NULL,
    precio_unitario NUMERIC(10, 2) NOT NULL
);

-- 6. Liquidaciones a Distribuidores
CREATE TABLE IF NOT EXISTS liquidaciones (
    id SERIAL PRIMARY KEY,
    referido_id INTEGER NOT NULL REFERENCES referidos(id),
    total NUMERIC(12, 2) NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'pagada',
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    pagada_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Ledger Inmutable de Comisiones
CREATE TABLE IF NOT EXISTS comisiones (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    referido_id INTEGER NOT NULL REFERENCES referidos(id),
    nivel INTEGER NOT NULL CHECK (nivel IN (1, 2, 3)),
    porcentaje NUMERIC(5, 2) NOT NULL,
    monto NUMERIC(10, 2) NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagada', 'revertida')),
    liquidacion_id INTEGER REFERENCES liquidaciones(id),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices de Rendimiento
CREATE INDEX IF NOT EXISTS idx_referidos_parent_id ON referidos(parent_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_usuario_id ON pedidos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_email ON pedidos(cliente_email);
CREATE INDEX IF NOT EXISTS idx_pedido_items_pedido_id ON pedido_items(pedido_id);
CREATE INDEX IF NOT EXISTS idx_comisiones_referido_id ON comisiones(referido_id);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);

-- =========================================================================
-- SEEDS INICIALES
-- =========================================================================

-- Árbol de referidos inicial (Raíz "Tú" y 7 nodos)
INSERT INTO referidos (id, nombre, codigo, nivel, ventas, parent_id) VALUES
    (0, 'Tú', 'TU', 0, 2400.00, NULL),
    (1, 'Ana García', 'ANA', 1, 1200.00, 0),
    (2, 'Luis Poveda', 'LUIS', 1, 850.00, 0),
    (3, 'Marta Sánchez', 'MARTA', 1, 430.00, 0),
    (4, 'Carlos Ruiz', 'CARLOS', 2, 500.00, 1),
    (5, 'Sofía León', 'SOFIA', 2, 430.00, 1),
    (6, 'Marco Díaz', 'MARCO', 2, 380.00, 2),
    (7, 'Diana Paz', 'DIANA', 3, 300.00, 4)
ON CONFLICT (id) DO NOTHING;

SELECT setval('referidos_id_seq', (SELECT MAX(id) FROM referidos));

-- Usuarios iniciales con contraseñas encriptadas con bcrypt (123456)
INSERT INTO usuarios (id, email, password, nombre, rol, activo, referido_id) VALUES
    (1, 'admin@upse.edu.ec', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Administrador General', 'admin', true, 0),
    (2, 'cliente@upse.edu.ec', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Luis Poveda', 'cliente', true, 2)
ON CONFLICT (id) DO NOTHING;

SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios));

-- Catálogo de 8 productos
INSERT INTO productos (id, nombre, descripcion, precio, stock, categoria, img, galeria, activo) VALUES
    (1, 'Serum Revitalizante', 'Serum concentrado con vitamina C y ácido hialurónico. Ilumina la piel y reduce manchas.', 45.00, 15, 'Serum', 'https://picsum.photos/seed/serum/600', ARRAY['https://picsum.photos/seed/serum1/600', 'https://picsum.photos/seed/serum2/600'], true),
    (2, 'Crema Hidratante Pro', 'Crema facial de textura ligera con niacinamida y manteca de karité.', 32.50, 20, 'Crema', 'https://picsum.photos/seed/crema/600', ARRAY['https://picsum.photos/seed/crema1/600', 'https://picsum.photos/seed/crema2/600'], true),
    (3, 'Tónico Purificante', 'Tónico sin alcohol con hamamelis y agua de rosas. Limpia poros y equilibra el pH.', 28.00, 25, 'Tónico', 'https://picsum.photos/seed/tonico/600', ARRAY['https://picsum.photos/seed/tonico1/600', 'https://picsum.photos/seed/tonico2/600'], true),
    (4, 'Mascarilla Nocturna', 'Mascarilla de noche con colágeno y vitamina E. Repara la piel mientras duermes.', 50.00, 12, 'Mascarilla', 'https://picsum.photos/seed/mascarilla/600', ARRAY['https://picsum.photos/seed/mascarilla1/600', 'https://picsum.photos/seed/mascarilla2/600'], true),
    (5, 'Serum Anti-Edad Retinol', 'Serum de retinol encapsulado que suaviza líneas de expresión y mejora la firmeza.', 58.00, 10, 'Serum', 'https://picsum.photos/seed/retinol/600', ARRAY['https://picsum.photos/seed/retinol1/600'], true),
    (6, 'Crema Contorno de Ojos', 'Contorno de ojos con cafeína y péptidos. Reduce bolsas y ojeras.', 26.00, 18, 'Crema', 'https://picsum.photos/seed/ojos/600', ARRAY['https://picsum.photos/seed/ojos1/600'], true),
    (7, 'Tónico Exfoliante AHA-BHA', 'Exfoliación química suave con ácidos AHA y BHA. Renueva la textura cutánea.', 34.00, 14, 'Tónico', 'https://picsum.photos/seed/exfoliante/600', ARRAY['https://picsum.photos/seed/exfoliante1/600'], true),
    (8, 'Kit Rutina Completa', 'Kit integral con serum, crema, tónico y mascarilla. Limpieza, tratamiento e hidratación.', 129.00, 8, 'Kit', 'https://picsum.photos/seed/kit/600', ARRAY['https://picsum.photos/seed/kit1/600'], true)
ON CONFLICT (id) DO NOTHING;

SELECT setval('productos_id_seq', (SELECT MAX(id) FROM productos));
