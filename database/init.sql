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
-- SEEDS INICIALES ENRIQUECIDOS
-- =========================================================================

-- 1. Árbol de referidos inicial (17 nodos jerárquicos multinivel: Niveles 1, 2 y 3)
INSERT INTO referidos (id, nombre, codigo, nivel, ventas, parent_id) VALUES
    (0, 'Tú', 'TU', 0, 3850.00, NULL),
    -- Nivel 1 (Directos con 10% de comisión)
    (1, 'Ana García', 'ANA', 1, 1850.00, 0),
    (2, 'Luis Poveda', 'LUIS', 1, 1420.00, 0),
    (3, 'Marta Sánchez', 'MARTA', 1, 980.00, 0),
    (8, 'Carlos Mendoza', 'CARLOSM', 1, 750.00, 0),
    (9, 'Valeria Castro', 'VALERIA', 1, 1100.00, 0),
    -- Nivel 2 (Secundarios con 5% de comisión)
    (4, 'Carlos Ruiz', 'CARLOS', 2, 620.00, 1),
    (5, 'Sofía León', 'SOFIA', 2, 540.00, 1),
    (6, 'Marco Díaz', 'MARCO', 2, 480.00, 2),
    (10, 'Javier Ortiz', 'JAVIER', 2, 390.00, 2),
    (11, 'Andrea Mora', 'ANDREA', 2, 510.00, 3),
    (12, 'Diego Torres', 'DIEGO', 2, 420.00, 9),
    -- Nivel 3 (Terciarios con 2% de comisión)
    (7, 'Diana Paz', 'DIANA', 3, 350.00, 4),
    (13, 'Felipe Silva', 'FELIPE', 3, 280.00, 4),
    (14, 'Gabriel Morales', 'GABRIEL', 3, 310.00, 6),
    (15, 'Natalia Vega', 'NATALIA', 3, 410.00, 11),
    (16, 'Camila Rivas', 'CAMILA', 3, 260.00, 12)
ON CONFLICT (id) DO NOTHING;

SELECT setval('referidos_id_seq', (SELECT MAX(id) FROM referidos));

-- 2. Cuentas de Usuarios (Contraseña universal para pruebas: 123456 con bcrypt)
INSERT INTO usuarios (id, email, password, nombre, rol, activo, referido_id) VALUES
    (1, 'admin@upse.edu.ec', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Administrador General', 'admin', true, 0),
    (2, 'cliente@upse.edu.ec', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Luis Poveda', 'cliente', true, 2),
    (3, 'ana@upse.edu.ec', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Ana García', 'cliente', true, 1),
    (4, 'marta@upse.edu.ec', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Marta Sánchez', 'cliente', true, 3),
    (5, 'carlos@upse.edu.ec', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Carlos Ruiz', 'cliente', true, 4),
    (6, 'valeria@upse.edu.ec', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Valeria Castro', 'cliente', true, 9)
ON CONFLICT (id) DO NOTHING;

SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios));

-- 3. Catálogo Extendido de 18 Productos Cosméticos
INSERT INTO productos (id, nombre, descripcion, precio, stock, categoria, img, galeria, activo) VALUES
    (1, 'Serum Revitalizante', 'Serum concentrado con vitamina C pura y ácido hialurónico triple peso molecular. Ilumina la piel y reduce manchas.', 45.00, 15, 'Serum', 'https://picsum.photos/seed/serum/600', ARRAY['https://picsum.photos/seed/serum1/600', 'https://picsum.photos/seed/serum2/600'], true),
    (2, 'Crema Hidratante Pro', 'Crema facial de textura sedosa con niacinamida al 5% y manteca de karité pura.', 32.50, 20, 'Crema', 'https://picsum.photos/seed/crema/600', ARRAY['https://picsum.photos/seed/crema1/600', 'https://picsum.photos/seed/crema2/600'], true),
    (3, 'Tónico Purificante', 'Tónico astringente sin alcohol con extracto de hamamelis y agua de rosas orgánicas.', 28.00, 25, 'Tónico', 'https://picsum.photos/seed/tonico/600', ARRAY['https://picsum.photos/seed/tonico1/600', 'https://picsum.photos/seed/tonico2/600'], true),
    (4, 'Mascarilla Nocturna', 'Tratamiento nocturno reparador intensivo con colágeno hidrolizado y vitamina E.', 50.00, 12, 'Mascarilla', 'https://picsum.photos/seed/mascarilla/600', ARRAY['https://picsum.photos/seed/mascarilla1/600', 'https://picsum.photos/seed/mascarilla2/600'], true),
    (5, 'Serum Anti-Edad Retinol', 'Serum nocturno con retinol encapsulado al 0.3% que estimula la regeneración celular.', 58.00, 10, 'Serum', 'https://picsum.photos/seed/retinol/600', ARRAY['https://picsum.photos/seed/retinol1/600'], true),
    (6, 'Crema Contorno de Ojos', 'Emulsión descongestiva para ojos con cafeína activa, péptidos y extracto de té verde.', 26.00, 18, 'Crema', 'https://picsum.photos/seed/ojos/600', ARRAY['https://picsum.photos/seed/ojos1/600'], true),
    (7, 'Tónico Exfoliante AHA-BHA', 'Exfoliación química suave con ácido glicólico y salicílico para desobstruir poros.', 34.00, 14, 'Tónico', 'https://picsum.photos/seed/exfoliante/600', ARRAY['https://picsum.photos/seed/exfoliante1/600'], true),
    (8, 'Kit Rutina Completa', 'Kit dermatológico de 4 pasos esenciales: limpiador, serum, crema hidratante y protector.', 129.00, 8, 'Kit', 'https://picsum.photos/seed/kit/600', ARRAY['https://picsum.photos/seed/kit1/600'], true),
    (9, 'Protector Solar Facial SPF 50+', 'Fluido solar invisible no comedogénico con filtros minerales y toque seco mate.', 36.00, 30, 'Protector', 'https://picsum.photos/seed/solar/600', ARRAY['https://picsum.photos/seed/solar1/600'], true),
    (10, 'Gel Limpiador Espumoso', 'Limpiador facial suave con pH 5.5, ceramidas y extracto de manzanilla.', 24.00, 22, 'Limpiador', 'https://picsum.photos/seed/cleanser/600', ARRAY['https://picsum.photos/seed/cleanser1/600'], true),
    (11, 'Aceite Facial de Escualano', 'Aceite 100% puro derivado de caña de azúcar que sella la humedad sin sensación grasa.', 48.00, 16, 'Aceite', 'https://picsum.photos/seed/oil/600', ARRAY['https://picsum.photos/seed/oil1/600'], true),
    (12, 'Mascarilla de Arcilla Rosa', 'Mascarilla desintoxicante con arcilla rosa francesa y extracto de aloe vera.', 38.50, 14, 'Mascarilla', 'https://picsum.photos/seed/clay/600', ARRAY['https://picsum.photos/seed/clay1/600'], true),
    (13, 'Serum Niacinamida 10% + Zinc', 'Tratamiento de alta potencia para reducir imperfecciones y equilibrar el sebo.', 42.00, 19, 'Serum', 'https://picsum.photos/seed/niacinamide/600', ARRAY['https://picsum.photos/seed/niacinamide1/600'], true),
    (14, 'Bálsamo Labial con Péptidos', 'Bálsamo ultra-nutritivo con manteca de cacao, péptidos voluminizadores y cera de abejas.', 18.00, 40, 'Crema', 'https://picsum.photos/seed/lip/600', ARRAY['https://picsum.photos/seed/lip1/600'], true),
    (15, 'Agua Micelar Calmante', 'Solución micelar bifásica enriquecida con centella asiática para pieles sensibles.', 22.00, 28, 'Limpiador', 'https://picsum.photos/seed/micellar/600', ARRAY['https://picsum.photos/seed/micellar1/600'], true),
    (16, 'Bruma Hidratante Poliglutámica', 'Spray facial ultrafino que retiene 4 veces más humedad que el ácido hialurónico.', 30.00, 15, 'Tónico', 'https://picsum.photos/seed/mist/600', ARRAY['https://picsum.photos/seed/mist1/600'], true),
    (17, 'Fluido Matificante Mat-Pro', 'Emulsión ultraligera reguladora con polvo de bambú para un acabado mate duradero.', 35.00, 11, 'Crema', 'https://picsum.photos/seed/matt/600', ARRAY['https://picsum.photos/seed/matt1/600'], true),
    (18, 'Kit Glow Intensivo', 'Tratamiento duo con serum revitalizante de vitamina C y mascarilla de arcilla rosa.', 78.00, 7, 'Kit', 'https://picsum.photos/seed/glowkit/600', ARRAY['https://picsum.photos/seed/glowkit1/600'], true)
ON CONFLICT (id) DO NOTHING;

SELECT setval('productos_id_seq', (SELECT MAX(id) FROM productos));

-- 4. Pedidos Históricos Iniciales (Para poblar Mis Pedidos y Gestión de Pedidos)
INSERT INTO pedidos (id, cliente_email, total, estado, usuario_id, creado_en) VALUES
    (1001, 'cliente@upse.edu.ec', 77.50, 'entregado', 2, NOW() - INTERVAL '5 days'),
    (1002, 'cliente@upse.edu.ec', 84.00, 'enviado', 2, NOW() - INTERVAL '3 days'),
    (1003, 'ana@upse.edu.ec', 129.00, 'entregado', 3, NOW() - INTERVAL '2 days'),
    (1004, 'carlos@upse.edu.ec', 94.00, 'preparando', 5, NOW() - INTERVAL '1 day'),
    (1005, 'cliente@upse.edu.ec', 50.00, 'pendiente', 2, NOW() - INTERVAL '2 hours')
ON CONFLICT (id) DO NOTHING;

SELECT setval('pedidos_id_seq', (SELECT MAX(id) FROM pedidos));

-- 5. Detalle de Ítems de los Pedidos
INSERT INTO pedido_items (id, pedido_id, producto_id, cantidad, precio_unitario) VALUES
    (1, 1001, 1, 1, 45.00),
    (2, 1001, 2, 1, 32.50),
    (3, 1002, 3, 3, 28.00),
    (4, 1003, 8, 1, 129.00),
    (5, 1004, 5, 1, 58.00),
    (6, 1004, 9, 1, 36.00),
    (7, 1005, 4, 1, 50.00)
ON CONFLICT (id) DO NOTHING;

SELECT setval('pedido_items_id_seq', (SELECT MAX(id) FROM pedido_items));

-- 6. Historial Contable de Liquidaciones
INSERT INTO liquidaciones (id, referido_id, total, estado, creado_en, pagada_en) VALUES
    (1, 1, 85.00, 'pagada', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
    (2, 2, 62.00, 'pagada', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days')
ON CONFLICT (id) DO NOTHING;

SELECT setval('liquidaciones_id_seq', (SELECT MAX(id) FROM liquidaciones));

-- 7. Ledger Auditable de Comisiones Devengadas
INSERT INTO comisiones (id, pedido_id, referido_id, nivel, porcentaje, monto, estado, liquidacion_id, creado_en) VALUES
    (1, 1001, 0, 1, 0.10, 7.75, 'pagada', 2, NOW() - INTERVAL '5 days'),
    (2, 1002, 0, 1, 0.10, 8.40, 'pendiente', NULL, NOW() - INTERVAL '3 days'),
    (3, 1003, 0, 1, 0.10, 12.90, 'pagada', 1, NOW() - INTERVAL '2 days'),
    (4, 1004, 1, 1, 0.10, 9.40, 'pendiente', NULL, NOW() - INTERVAL '1 day'),
    (5, 1004, 0, 2, 0.05, 4.70, 'pendiente', NULL, NOW() - INTERVAL '1 day'),
    (6, 1005, 0, 1, 0.10, 5.00, 'pendiente', NULL, NOW() - INTERVAL '2 hours')
ON CONFLICT (id) DO NOTHING;

SELECT setval('comisiones_id_seq', (SELECT MAX(id) FROM comisiones));
