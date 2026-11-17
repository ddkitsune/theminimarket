-- ============================================================================
-- ESQUEMA SQLITE - SISTEMA PUNTO DE VENTA (ESTILO ELEVENTA)
-- Optimizado para modo local 100% offline y alta velocidad (WAL Mode)
-- ============================================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- 1. Departamentos / Categorías
CREATE TABLE IF NOT EXISTS departamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Proveedores
CREATE TABLE IF NOT EXISTS proveedores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    telefono TEXT,
    contacto TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Catálogo de Productos (Estructura idéntica al Excel)
CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT NOT NULL UNIQUE,                    -- Código de barras o clave interna
    producto TEXT NOT NULL,                         -- Descripción del producto
    tipo_venta TEXT DEFAULT 'unidad' CHECK (tipo_venta IN ('unidad', 'granel', 'kit')),
    precio_costo REAL NOT NULL DEFAULT 0.0,         -- P. Costo ($)
    ganancia_porcentaje REAL DEFAULT 0.0,           -- % Ganancia calculada
    precio_venta REAL NOT NULL DEFAULT 0.0,         -- P. Venta ($)
    precio_mayoreo REAL NOT NULL DEFAULT 0.0,       -- P. Mayoreo ($)
    existencia REAL NOT NULL DEFAULT 0.0,           -- Existencia (Soporta decimales para granel/charcutería)
    inv_minimo REAL NOT NULL DEFAULT 0.0,           -- Inv. Mínimo (Punto de reorden)
    inv_maximo REAL NOT NULL DEFAULT 0.0,           -- Inv. Máximo
    departamento_id INTEGER,                        -- Departamento
    proveedor_id INTEGER,
    unidad_medida TEXT DEFAULT 'PZA',               -- PZA, KG, LT
    usa_inventario INTEGER DEFAULT 1,               -- 1 = Sí, 0 = Servicio / No inventariable
    activo INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (departamento_id) REFERENCES departamentos(id) ON DELETE SET NULL,
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_productos_codigo ON productos(codigo);
CREATE INDEX IF NOT EXISTS idx_productos_producto ON productos(producto);
CREATE INDEX IF NOT EXISTS idx_productos_departamento ON productos(departamento_id);

-- 4. Clientes y Créditos (Cuentas por Cobrar / Fiado)
CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    folio INTEGER UNIQUE,
    nombres TEXT NOT NULL,
    apellidos TEXT DEFAULT '',
    telefono TEXT DEFAULT '',
    correo TEXT DEFAULT '',
    domicilio_1 TEXT DEFAULT '',
    domicilio_2 TEXT DEFAULT '',
    colonia TEXT DEFAULT '',
    municipio_estado TEXT DEFAULT '',
    codigo_postal TEXT DEFAULT '',
    notas TEXT DEFAULT '',
    tiene_credito INTEGER DEFAULT 0,                -- 1 = Autorizado, 0 = No
    limite_credito REAL DEFAULT 0.0,
    saldo_actual REAL DEFAULT 0.0,                  -- Saldo deudor actual
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS creditos_movimientos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('cargo', 'abono')),
    monto REAL NOT NULL,
    saldo_anterior REAL NOT NULL,
    saldo_nuevo REAL NOT NULL,
    venta_id INTEGER,
    notas TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

-- 5. Usuarios y Cajeros
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    usuario TEXT NOT NULL UNIQUE,
    pin TEXT NOT NULL,                              -- PIN rápido para cobro/autorizaciones
    rol TEXT DEFAULT 'cajero' CHECK (rol IN ('admin', 'cajero')),
    activo INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Turnos y Arqueo / Corte de Caja
CREATE TABLE IF NOT EXISTS turnos_caja (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    fecha_apertura DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre DATETIME,
    fondo_inicial REAL NOT NULL DEFAULT 0.0,
    total_ventas_efectivo REAL DEFAULT 0.0,
    total_ventas_tarjeta REAL DEFAULT 0.0,
    total_ventas_credito REAL DEFAULT 0.0,
    total_ventas_transferencia REAL DEFAULT 0.0,
    total_ventas_vales REAL DEFAULT 0.0,
    total_entradas REAL DEFAULT 0.0,                -- F7 Entradas
    total_salidas REAL DEFAULT 0.0,                 -- F8 Salidas (gastos menores)
    total_devoluciones REAL DEFAULT 0.0,
    efectivo_esperado REAL DEFAULT 0.0,
    efectivo_declarado REAL DEFAULT 0.0,
    diferencia REAL DEFAULT 0.0,
    estado TEXT DEFAULT 'abierto' CHECK (estado IN ('abierto', 'cerrado')),
    notas TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- 7. Entradas y Salidas Rápidas (F7 / F8)
CREATE TABLE IF NOT EXISTS movimientos_caja (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    turno_id INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'salida')),
    monto REAL NOT NULL,
    motivo TEXT NOT NULL,
    usuario_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (turno_id) REFERENCES turnos_caja(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- 8. Ventas (Tickets)
CREATE TABLE IF NOT EXISTS ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    folio_ticket INTEGER NOT NULL,
    turno_id INTEGER NOT NULL,
    cliente_id INTEGER,
    usuario_id INTEGER NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_articulos REAL NOT NULL DEFAULT 0,
    subtotal REAL NOT NULL DEFAULT 0.0,
    impuestos REAL NOT NULL DEFAULT 0.0,
    descuento REAL NOT NULL DEFAULT 0.0,
    total REAL NOT NULL DEFAULT 0.0,
    costo_total REAL NOT NULL DEFAULT 0.0,          -- Para cálculo instantáneo de ganancia
    ganancia_total REAL NOT NULL DEFAULT 0.0,
    pago_con REAL DEFAULT 0.0,
    cambio REAL DEFAULT 0.0,
    estado TEXT DEFAULT 'completada' CHECK (estado IN ('completada', 'cancelada')),
    FOREIGN KEY (turno_id) REFERENCES turnos_caja(id),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha);
CREATE INDEX IF NOT EXISTS idx_ventas_turno ON ventas(turno_id);

-- 9. Detalles de Venta (Renglones del Ticket)
CREATE TABLE IF NOT EXISTS venta_detalles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venta_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,
    codigo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    precio_costo REAL NOT NULL,
    precio_unitario REAL NOT NULL,
    cantidad REAL NOT NULL,
    importe REAL NOT NULL,
    ganancia REAL NOT NULL,
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- 10. Pagos por Venta (Soporta bimoneda y métodos venezolanos)
CREATE TABLE IF NOT EXISTS venta_pagos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venta_id INTEGER NOT NULL,
    metodo TEXT NOT NULL,
    monto REAL NOT NULL,
    referencia TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE
);

-- 11. Kardex de Inventario (Auditoría de existencias)
CREATE TABLE IF NOT EXISTS inventario_kardex (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('venta', 'ajuste', 'entrada_compra', 'salida_merma', 'devolucion')),
    cantidad REAL NOT NULL,
    existencia_anterior REAL NOT NULL,
    existencia_nueva REAL NOT NULL,
    costo_unitario REAL DEFAULT 0.0,
    referencia_id INTEGER,                          -- ID de venta, compra o ajuste
    motivo TEXT,
    usuario_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- 12. Configuración General & Hardware
CREATE TABLE IF NOT EXISTS configuracion (
    clave TEXT PRIMARY KEY,
    valor TEXT NOT NULL,
    descripcion TEXT
);
