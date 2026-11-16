const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

class SQLiteWrapper {
  constructor(dbPath, sqlInstance) {
    this.dbPath = dbPath;
    this.SQL = sqlInstance;
    if (fs.existsSync(dbPath)) {
      this.db = new this.SQL.Database(fs.readFileSync(dbPath));
    } else {
      this.db = new this.SQL.Database();
    }
  }

  save() {
    try {
      const data = this.db.export();
      fs.writeFileSync(this.dbPath, Buffer.from(data));
    } catch (e) {
      console.error('Error saving SQLite database to disk:', e);
    }
  }

  pragma(str) {
    try {
      this.db.run(`PRAGMA ${str}`);
    } catch (e) {}
  }

  exec(sql) {
    const res = this.db.exec(sql);
    this.save();
    return res;
  }

  prepare(sql) {
    const self = this;
    return {
      get(...params) {
        const stmt = self.db.prepare(sql);
        try {
          if (params.length > 0) stmt.bind(params);
          if (stmt.step()) {
            return stmt.getAsObject();
          }
          return undefined;
        } finally {
          stmt.free();
        }
      },
      all(...params) {
        const stmt = self.db.prepare(sql);
        const results = [];
        try {
          if (params.length > 0) stmt.bind(params);
          while (stmt.step()) {
            results.push(stmt.getAsObject());
          }
          return results;
        } finally {
          stmt.free();
        }
      },
      run(...params) {
        const stmt = self.db.prepare(sql);
        try {
          if (params.length > 0) stmt.bind(params);
          stmt.step();
        } finally {
          stmt.free();
        }

        let lastInsertRowid = 0;
        let changes = 0;
        try {
          const rowRes = self.db.exec("SELECT last_insert_rowid() as id, changes() as chg");
          if (rowRes.length > 0 && rowRes[0].values.length > 0) {
            lastInsertRowid = rowRes[0].values[0][0];
            changes = rowRes[0].values[0][1];
          }
        } catch (e) {}

        self.save();
        return { lastInsertRowid, changes };
      }
    };
  }

  transaction(fn) {
    const self = this;
    return (...args) => {
      self.db.run('BEGIN TRANSACTION;');
      try {
        const result = fn(...args);
        self.db.run('COMMIT;');
        self.save();
        return result;
      } catch (err) {
        self.db.run('ROLLBACK;');
        throw err;
      }
    };
  }

  backup(destPath) {
    const data = this.db.export();
    fs.writeFileSync(destPath, Buffer.from(data));
  }
}

function resolveDbPath() {
  let electronApp;
  try {
    electronApp = require('electron').app;
  } catch (e) {}

  if (electronApp && electronApp.isPackaged) {
    const userData = electronApp.getPath('userData');
    if (!fs.existsSync(userData)) {
      fs.mkdirSync(userData, { recursive: true });
    }
    const targetDb = path.join(userData, 'minimarket.db');
    if (!fs.existsSync(targetDb)) {
      const candidates = [
        path.join(process.resourcesPath, 'database', 'minimarket.db'),
        path.join(process.resourcesPath, 'minimarket.db'),
        path.join(__dirname, '../database/minimarket.db'),
        path.join(__dirname, 'database/minimarket.db')
      ];
      let copied = false;
      for (const cand of candidates) {
        if (fs.existsSync(cand)) {
          fs.copyFileSync(cand, targetDb);
          console.log(`Seeded production database from ${cand} to ${targetDb}`);
          copied = true;
          break;
        }
      }
      if (!copied) {
        console.warn('Seed database not found, new database will be initialized at', targetDb);
      }
    }
    return targetDb;
  }

  return path.join(__dirname, '../database/minimarket.db');
}

let db = null;
let initPromise = null;

async function initDatabase() {
  if (db) return db;
  if (!initPromise) {
    initPromise = (async () => {
      const SQL = await initSqlJs();
      const dbPath = resolveDbPath();
      db = new SQLiteWrapper(dbPath, SQL);
      db.pragma('foreign_keys = ON');
      console.log('Database initialized successfully with sql.js at:', dbPath);
      return db;
    })();
  }
  return initPromise;
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

// 1. Obtener producto por código exacto
function getProductByCode(code) {
  const stmt = getDb().prepare(`
    SELECT p.*, d.nombre as departamento_nombre 
    FROM productos p 
    LEFT JOIN departamentos d ON p.departamento_id = d.id 
    WHERE p.codigo = ? AND p.activo = 1
  `);
  return stmt.get(code);
}

// 2. Búsqueda rápida de productos (código o nombre)
function searchProducts(query, limit = 50) {
  const searchTerm = `%${query.trim()}%`;
  const stmt = getDb().prepare(`
    SELECT p.*, d.nombre as departamento_nombre 
    FROM productos p 
    LEFT JOIN departamentos d ON p.departamento_id = d.id 
    WHERE (p.codigo LIKE ? OR p.producto LIKE ?) AND p.activo = 1
    ORDER BY p.producto ASC 
    LIMIT ?
  `);
  return stmt.all(searchTerm, searchTerm, limit);
}

// 3. Obtener todos los departamentos
function getDepartments() {
  return getDb().prepare('SELECT * FROM departamentos ORDER BY nombre ASC').all();
}

function saveDepartment(nombre) {
  const clean = nombre.trim().toUpperCase();
  getDb().prepare('INSERT OR IGNORE INTO departamentos (nombre) VALUES (?)').run(clean);
  return getDb().prepare('SELECT * FROM departamentos WHERE nombre = ?').get(clean);
}

// 4. Crear o Actualizar Producto (Pantalla F3)
function saveProduct(prod) {
  const {
    id,
    codigo,
    producto,
    tipo_venta = 'unidad',
    precio_costo = 0,
    ganancia_porcentaje = 0,
    precio_venta = 0,
    precio_mayoreo = 0,
    existencia = 0,
    inv_minimo = 0,
    inv_maximo = 0,
    departamento_id = null,
    unidad_medida = 'PZA',
    usa_inventario = 1
  } = prod;

  if (id) {
    getDb().prepare(`
      UPDATE productos SET
        codigo = ?, producto = ?, tipo_venta = ?, precio_costo = ?,
        ganancia_porcentaje = ?, precio_venta = ?, precio_mayoreo = ?,
        existencia = ?, inv_minimo = ?, inv_maximo = ?, departamento_id = ?,
        unidad_medida = ?, usa_inventario = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      codigo, producto, tipo_venta, precio_costo, ganancia_porcentaje,
      precio_venta, precio_mayoreo, existencia, inv_minimo, inv_maximo,
      departamento_id, unidad_medida, usa_inventario ? 1 : 0, id
    );
    return getProductByCode(codigo);
  } else {
    const info = getDb().prepare(`
      INSERT INTO productos (
        codigo, producto, tipo_venta, precio_costo, ganancia_porcentaje,
        precio_venta, precio_mayoreo, existencia, inv_minimo, inv_maximo,
        departamento_id, unidad_medida, usa_inventario, activo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      codigo, producto, tipo_venta, precio_costo, ganancia_porcentaje,
      precio_venta, precio_mayoreo, existencia, inv_minimo, inv_maximo,
      departamento_id, unidad_medida, usa_inventario ? 1 : 0
    );
    return getDb().prepare('SELECT * FROM productos WHERE id = ?').get(info.lastInsertRowid);
  }
}

function deleteProduct(id) {
  return getDb().prepare('UPDATE productos SET activo = 0 WHERE id = ?').run(id);
}

// 5. Inventario & Kardex (Pantalla F4)
function addInventory({ productoId, cantidad, motivo = 'Ajuste manual', userId = 1 }) {
  const prod = getDb().prepare('SELECT * FROM productos WHERE id = ?').get(productoId);
  if (!prod) throw new Error('Producto no encontrado');

  const extAnt = prod.existencia;
  const extNueva = extAnt + cantidad;

  getDb().prepare('UPDATE productos SET existencia = ? WHERE id = ?').run(extNueva, productoId);

  getDb().prepare(`
    INSERT INTO inventario_kardex (
      producto_id, tipo, cantidad, existencia_anterior, existencia_nueva,
      costo_unitario, motivo, usuario_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    productoId, cantidad >= 0 ? 'entrada_compra' : 'ajuste',
    Math.abs(cantidad), extAnt, extNueva, prod.precio_costo, motivo, userId
  );

  return { success: true, existencia_anterior: extAnt, existencia_nueva: extNueva };
}

function getKardex(productoId = null, limit = 50) {
  if (productoId) {
    return getDb().prepare(`
      SELECT k.*, p.producto, p.codigo, u.nombre as usuario_nombre
      FROM inventario_kardex k
      JOIN productos p ON k.producto_id = p.id
      LEFT JOIN usuarios u ON k.usuario_id = u.id
      WHERE k.producto_id = ?
      ORDER BY k.id DESC LIMIT ?
    `).all(productoId, limit);
  }
  return getDb().prepare(`
    SELECT k.*, p.producto, p.codigo, u.nombre as usuario_nombre
    FROM inventario_kardex k
    JOIN productos p ON k.producto_id = p.id
    LEFT JOIN usuarios u ON k.usuario_id = u.id
    ORDER BY k.id DESC LIMIT ?
  `).all(limit);
}

// 6. Compras Sugeridas y Productos Bajos (Pantalla 6)
function getLowStockProducts(deptoId = null) {
  let query = `
    SELECT p.*, d.nombre as departamento_nombre 
    FROM productos p 
    LEFT JOIN departamentos d ON p.departamento_id = d.id 
    WHERE p.existencia <= p.inv_minimo AND p.activo = 1 AND p.usa_inventario = 1
  `;
  const params = [];
  if (deptoId) {
    query += ' AND p.departamento_id = ?';
    params.push(deptoId);
  }
  query += ' ORDER BY p.producto ASC';
  return getDb().prepare(query).all(...params);
}

// 7. Turnos y Arqueo / Corte de Caja
function getOrCreateCurrentShift(userId = 1) {
  let shift = getDb().prepare("SELECT * FROM turnos_caja WHERE estado = 'abierto' ORDER BY id DESC LIMIT 1").get();
  if (!shift) {
    const info = getDb().prepare(`
      INSERT INTO turnos_caja (usuario_id, fondo_inicial, estado) 
      VALUES (?, 0.0, 'abierto')
    `).run(userId);
    shift = getDb().prepare("SELECT * FROM turnos_caja WHERE id = ?").get(info.lastInsertRowid);
  }
  return shift;
}

function addCashMovement({ turnoId, tipo, monto, motivo, userId = 1 }) {
  const stmt = getDb().prepare(`
    INSERT INTO movimientos_caja (turno_id, tipo, monto, motivo, usuario_id)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(turnoId, tipo, monto, motivo, userId);

  if (tipo === 'entrada') {
    getDb().prepare('UPDATE turnos_caja SET total_entradas = total_entradas + ? WHERE id = ?').run(monto, turnoId);
  } else {
    getDb().prepare('UPDATE turnos_caja SET total_salidas = total_salidas + ? WHERE id = ?').run(monto, turnoId);
  }
  return { success: true };
}

function getCashMovements(turnoId) {
  return getDb().prepare(`
    SELECT m.*, u.nombre as usuario_nombre 
    FROM movimientos_caja m 
    JOIN usuarios u ON m.usuario_id = u.id 
    WHERE m.turno_id = ? 
    ORDER BY m.id DESC
  `).all(turnoId);
}

// 8. Transacción de Venta
function completeSale(saleData) {
  const tx = getDb().transaction((data) => {
    const { turnoId, clienteId, userId = 1, items, pagoCon, metodoPago = 'efectivo', descuento = 0.0 } = data;

    let totalArticulos = 0;
    let subtotal = 0;
    let costoTotal = 0;

    for (const it of items) {
      totalArticulos += it.cantidad;
      subtotal += it.precio * it.cantidad;
      costoTotal += (it.precio_costo || 0) * it.cantidad;
    }

    const total = subtotal - descuento;
    const gananciaTotal = total - costoTotal;
    const cambio = Math.max(0, pagoCon - total);

    const lastFolio = getDb().prepare("SELECT MAX(folio_ticket) as maxFolio FROM ventas").get();
    const folio = (lastFolio && lastFolio.maxFolio ? lastFolio.maxFolio : 0) + 1;

    const saleInfo = getDb().prepare(`
      INSERT INTO ventas (
        folio_ticket, turno_id, cliente_id, usuario_id,
        total_articulos, subtotal, impuestos, descuento, total,
        costo_total, ganancia_total, pago_con, cambio, estado
      ) VALUES (?, ?, ?, ?, ?, ?, 0.0, ?, ?, ?, ?, ?, ?, 'completada')
    `).run(folio, turnoId, clienteId, userId, totalArticulos, subtotal, descuento, total, costoTotal, gananciaTotal, pagoCon, cambio);

    const ventaId = saleInfo.lastInsertRowid;

    const insertDetail = getDb().prepare(`
      INSERT INTO venta_detalles (
        venta_id, producto_id, codigo, descripcion, precio_costo,
        precio_unitario, cantidad, importe, ganancia
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const updateStock = getDb().prepare(`
      UPDATE productos 
      SET existencia = existencia - ? 
      WHERE id = ? AND usa_inventario = 1
    `);

    const insertKardex = getDb().prepare(`
      INSERT INTO inventario_kardex (
        producto_id, tipo, cantidad, existencia_anterior, existencia_nueva,
        costo_unitario, referencia_id, motivo, usuario_id
      ) VALUES (?, 'venta', ?, ?, ?, ?, ?, 'Venta Ticket #' || ?, ?)
    `);

    for (const it of items) {
      const importe = it.precio * it.cantidad;
      const ganancia = (it.precio - (it.precio_costo || 0)) * it.cantidad;

      insertDetail.run(
        ventaId, it.id, it.codigo, it.producto, it.precio_costo || 0,
        it.precio, it.cantidad, importe, ganancia
      );

      const prod = getDb().prepare("SELECT existencia, usa_inventario FROM productos WHERE id = ?").get(it.id);
      if (prod && prod.usa_inventario) {
        const extAnt = prod.existencia;
        const extNueva = extAnt - it.cantidad;
        updateStock.run(it.cantidad, it.id);
        insertKardex.run(it.id, it.cantidad, extAnt, extNueva, it.precio_costo || 0, ventaId, folio, userId);
      }
    }

    getDb().prepare(`
      INSERT INTO venta_pagos (venta_id, metodo, monto)
      VALUES (?, ?, ?)
    `).run(ventaId, metodoPago, total);

    if (metodoPago === 'efectivo') {
      getDb().prepare("UPDATE turnos_caja SET total_ventas_efectivo = total_ventas_efectivo + ? WHERE id = ?").run(total, turnoId);
    } else if (metodoPago === 'tarjeta') {
      getDb().prepare("UPDATE turnos_caja SET total_ventas_tarjeta = total_ventas_tarjeta + ? WHERE id = ?").run(total, turnoId);
    } else if (metodoPago === 'credito') {
      getDb().prepare("UPDATE turnos_caja SET total_ventas_credito = total_ventas_credito + ? WHERE id = ?").run(total, turnoId);
      if (clienteId) {
        getDb().prepare("UPDATE clientes SET saldo_actual = saldo_actual + ? WHERE id = ?").run(total, clienteId);
        getDb().prepare(`
          INSERT INTO creditos_movimientos (cliente_id, tipo, monto, saldo_anterior, saldo_nuevo, venta_id, notas)
          VALUES (?, 'cargo', ?, (SELECT saldo_actual - ? FROM clientes WHERE id = ?), (SELECT saldo_actual FROM clientes WHERE id = ?), ?, 'Cargo por venta Ticket #' || ?)
        `).run(clienteId, total, total, clienteId, clienteId, ventaId, folio);
      }
    } else if (metodoPago === 'transferencia') {
      getDb().prepare("UPDATE turnos_caja SET total_ventas_transferencia = total_ventas_transferencia + ? WHERE id = ?").run(total, turnoId);
    }

    return {
      success: true,
      folio,
      ventaId,
      total,
      pagoCon,
      cambio
    };
  });

  return tx(saleData);
}

// 9. Resumen de Corte de Caja
function getShiftSummary(turnoId) {
  const shift = getDb().prepare("SELECT * FROM turnos_caja WHERE id = ?").get(turnoId);
  if (!shift) return null;

  const ventas = getDb().prepare(`
    SELECT COUNT(*) as total_transacciones, 
           COALESCE(SUM(total), 0) as total_ventas,
           COALESCE(SUM(ganancia_total), 0) as total_ganancia
    FROM ventas 
    WHERE turno_id = ? AND estado = 'completada'
  `).get(turnoId);

  const entradas = getDb().prepare(`
    SELECT COALESCE(SUM(monto), 0) as total 
    FROM movimientos_caja WHERE turno_id = ? AND tipo = 'entrada'
  `).get(turnoId).total;

  const salidas = getDb().prepare(`
    SELECT COALESCE(SUM(monto), 0) as total 
    FROM movimientos_caja WHERE turno_id = ? AND tipo = 'salida'
  `).get(turnoId).total;

  const efectivoEsperado = shift.fondo_inicial + shift.total_ventas_efectivo + entradas - salidas;

  return {
    ...shift,
    total_transacciones: ventas.total_transacciones,
    total_ventas: ventas.total_ventas,
    total_ganancia: ventas.total_ganancia,
    entradas_detalle: entradas,
    salidas_detalle: salidas,
    efectivo_esperado: efectivoEsperado
  };
}

// 10. Clientes y Cuentas por Cobrar (Pantallas 2 & 3)
function getCustomers(search = '') {
  if (!search) {
    return getDb().prepare("SELECT * FROM clientes ORDER BY nombres ASC").all();
  }
  const term = `%${search.trim()}%`;
  return getDb().prepare(`
    SELECT * FROM clientes 
    WHERE (nombres || ' ' || apellidos) LIKE ? OR telefono LIKE ? OR correo LIKE ?
    ORDER BY nombres ASC
  `).all(term, term, term);
}

function saveCustomer(customer) {
  const {
    id,
    nombres,
    apellidos = '',
    telefono = '',
    correo = '',
    domicilio_1 = '',
    domicilio_2 = '',
    colonia = '',
    municipio_estado = '',
    codigo_postal = '',
    notas = '',
    tiene_credito = 0,
    limite_credito = 0
  } = customer;

  if (id) {
    getDb().prepare(`
      UPDATE clientes SET
        nombres = ?, apellidos = ?, telefono = ?, correo = ?,
        domicilio_1 = ?, domicilio_2 = ?, colonia = ?, municipio_estado = ?,
        codigo_postal = ?, notas = ?, tiene_credito = ?, limite_credito = ?
      WHERE id = ?
    `).run(
      nombres, apellidos, telefono, correo, domicilio_1, domicilio_2,
      colonia, municipio_estado, codigo_postal, notas, tiene_credito ? 1 : 0,
      limite_credito, id
    );
    return getDb().prepare('SELECT * FROM clientes WHERE id = ?').get(id);
  } else {
    const lastFolio = getDb().prepare('SELECT MAX(folio) as maxF FROM clientes').get();
    const folio = (lastFolio && lastFolio.maxF ? lastFolio.maxF : 0) + 1;

    const info = getDb().prepare(`
      INSERT INTO clientes (
        folio, nombres, apellidos, telefono, correo, domicilio_1, domicilio_2,
        colonia, municipio_estado, codigo_postal, notas, tiene_credito, limite_credito, saldo_actual
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0.0)
    `).run(
      folio, nombres, apellidos, telefono, correo, domicilio_1, domicilio_2,
      colonia, municipio_estado, codigo_postal, notas, tiene_credito ? 1 : 0, limite_credito
    );
    return getDb().prepare('SELECT * FROM clientes WHERE id = ?').get(info.lastInsertRowid);
  }
}

// Abono de cliente
function addCustomerPayment({ clienteId, monto, notas = 'Abono a cuenta', userId = 1 }) {
  const cliente = getDb().prepare('SELECT * FROM clientes WHERE id = ?').get(clienteId);
  if (!cliente) throw new Error('Cliente no encontrado');

  const saldoAnt = cliente.saldo_actual;
  const saldoNuevo = Math.max(0, saldoAnt - monto);

  getDb().prepare('UPDATE clientes SET saldo_actual = ? WHERE id = ?').run(saldoNuevo, clienteId);

  getDb().prepare(`
    INSERT INTO creditos_movimientos (
      cliente_id, tipo, monto, saldo_anterior, saldo_nuevo, notas
    ) VALUES (?, 'abono', ?, ?, ?, ?)
  `).run(clienteId, monto, saldoAnt, saldoNuevo, notas);

  return { success: true, saldo_anterior: saldoAnt, saldo_nuevo: saldoNuevo };
}

function getCustomerStatement(clienteId) {
  const cliente = getDb().prepare('SELECT * FROM clientes WHERE id = ?').get(clienteId);
  const movimientos = getDb().prepare(`
    SELECT * FROM creditos_movimientos 
    WHERE cliente_id = ? 
    ORDER BY id DESC
  `).all(clienteId);
  return { cliente, movimientos };
}

// 11. Reportes Analíticos (Pantalla 10)
function getSalesReport() {
  const ventasPorDia = getDb().prepare(`
    SELECT 
      strftime('%w', fecha) as dia_semana,
      COUNT(*) as total_tickets,
      COALESCE(SUM(total), 0) as total_venta,
      COALESCE(SUM(ganancia_total), 0) as total_ganancia
    FROM ventas 
    WHERE estado = 'completada'
    GROUP BY strftime('%w', fecha)
    ORDER BY dia_semana ASC
  `).all();

  const ventasPorDepto = getDb().prepare(`
    SELECT 
      COALESCE(d.nombre, 'VARIOS') as departamento,
      COUNT(vd.id) as cantidad_articulos,
      COALESCE(SUM(vd.importe), 0) as total_venta,
      COALESCE(SUM(vd.ganancia), 0) as total_ganancia
    FROM venta_detalles vd
    JOIN productos p ON vd.producto_id = p.id
    LEFT JOIN departamentos d ON p.departamento_id = d.id
    JOIN ventas v ON vd.venta_id = v.id
    WHERE v.estado = 'completada'
    GROUP BY d.nombre
    ORDER BY total_venta DESC
    LIMIT 10
  `).all();

  const totales = getDb().prepare(`
    SELECT 
      COUNT(*) as total_ventas,
      COALESCE(SUM(total), 0) as monto_total,
      COALESCE(SUM(ganancia_total), 0) as ganancia_total
    FROM ventas WHERE estado = 'completada'
  `).get();

  return {
    totales,
    ventasPorDia,
    ventasPorDepto
  };
}

// 12. Gestión de Tasa de Cambio (Bimoneda $ USD y Bs.)
function getExchangeRate() {
  let row = getDb().prepare("SELECT valor, descripcion FROM configuracion WHERE clave = 'tasa_dolar'").get();
  if (!row) {
    getDb().prepare("INSERT INTO configuracion (clave, valor, descripcion) VALUES ('tasa_dolar', '55.00', datetime('now', 'localtime'))").run();
    row = { valor: '55.00', descripcion: new Date().toISOString() };
  }
  const dateRow = getDb().prepare("SELECT valor FROM configuracion WHERE clave = 'tasa_fecha'").get();
  return {
    tasa: parseFloat(row.valor) || 55.0,
    fecha_actualizacion: dateRow ? dateRow.valor : (row.descripcion || 'Hoy')
  };
}

function setExchangeRate(rate) {
  const numRate = parseFloat(rate);
  if (!numRate || numRate <= 0) throw new Error("La tasa debe ser mayor a 0");
  const now = new Date().toLocaleString('es-VE');
  
  getDb().prepare("INSERT OR REPLACE INTO configuracion (clave, valor, descripcion) VALUES ('tasa_dolar', ?, 'Tasa de cambio USD a Bs.')").run(numRate.toFixed(2));
  getDb().prepare("INSERT OR REPLACE INTO configuracion (clave, valor, descripcion) VALUES ('tasa_fecha', ?, 'Fecha de última actualización de tasa')").run(now);

  return { tasa: numRate, fecha_actualizacion: now };
}

// 13. Obtener última venta para Reimprimir Ticket
function getLastSale() {
  const lastSale = getDb().prepare("SELECT * FROM ventas ORDER BY id DESC LIMIT 1").get();
  if (!lastSale) return null;

  const items = getDb().prepare("SELECT * FROM venta_detalles WHERE venta_id = ?").all(lastSale.id);
  const pagos = getDb().prepare("SELECT * FROM venta_pagos WHERE venta_id = ?").all(lastSale.id);
  const config = getSettings();

  return {
    ...lastSale,
    items,
    pagos,
    negocio: config
  };
}

function getSettings() {
  const rows = getDb().prepare("SELECT clave, valor FROM configuracion").all();
  const map = {};
  for (const r of rows) {
    map[r.clave] = r.valor;
  }
  return map;
}

// 14. Respaldo Automático de Base de Datos
function backupDatabase(targetFolder = null) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  const backupFileName = `minimarket_backup_${timestamp}.db`;
  
  let electronApp;
  try { electronApp = require('electron').app; } catch(e) {}
  
  let defaultBackupDir;
  if (electronApp && electronApp.isPackaged) {
    defaultBackupDir = path.join(electronApp.getPath('userData'), 'backups');
  } else {
    defaultBackupDir = path.join(__dirname, '../database/backups');
  }

  const destDir = targetFolder || defaultBackupDir;
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const destPath = path.join(destDir, backupFileName);
  getDb().backup(destPath);

  return {
    success: true,
    path: destPath,
    fileName: backupFileName
  };
}

module.exports = {
  initDatabase,
  getDb,
  getProductByCode,
  searchProducts,
  getDepartments,
  saveDepartment,
  saveProduct,
  deleteProduct,
  addInventory,
  getKardex,
  getLowStockProducts,
  getOrCreateCurrentShift,
  addCashMovement,
  getCashMovements,
  completeSale,
  getShiftSummary,
  getCustomers,
  saveCustomer,
  addCustomerPayment,
  getCustomerStatement,
  getSalesReport,
  getExchangeRate,
  setExchangeRate,
  getLastSale,
  getSettings,
  backupDatabase
};
