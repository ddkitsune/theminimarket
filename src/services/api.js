const isElectron = typeof window !== 'undefined' && Boolean(window.api);

export const posApi = {
  // Productos (F3)
  getProductByCode: async (code) => {
    return isElectron ? await window.api.getProductByCode(code) : null;
  },
  searchProducts: async (query, limit = 50) => {
    return isElectron ? await window.api.searchProducts(query, limit) : [];
  },
  saveProduct: async (prod) => {
    return isElectron ? await window.api.saveProduct(prod) : { success: true };
  },
  deleteProduct: async (id) => {
    return isElectron ? await window.api.deleteProduct(id) : { success: true };
  },
  getDepartments: async () => {
    return isElectron ? await window.api.getDepartments() : [];
  },
  saveDepartment: async (nombre) => {
    return isElectron ? await window.api.saveDepartment(nombre) : { id: 1, nombre };
  },

  // Inventario & Kardex (F4)
  addInventory: async (data) => {
    return isElectron ? await window.api.addInventory(data) : { success: true };
  },
  getKardex: async (productoId = null, limit = 50) => {
    return isElectron ? await window.api.getKardex(productoId, limit) : [];
  },
  getLowStockProducts: async (deptoId = null) => {
    return isElectron ? await window.api.getLowStockProducts(deptoId) : [];
  },

  // Ventas (F1)
  completeSale: async (saleData) => {
    if (isElectron) return await window.api.completeSale(saleData);
    return {
      success: true,
      folio: 1,
      total: saleData.items.reduce((acc, it) => acc + (it.precio * it.cantidad), 0),
      cambio: 0
    };
  },

  // Caja & Turnos
  getCurrentShift: async () => {
    return isElectron ? await window.api.getCurrentShift() : { id: 1, fondo_inicial: 0 };
  },
  addCashMovement: async (movement) => {
    return isElectron ? await window.api.addCashMovement(movement) : { success: true };
  },
  getCashMovements: async (turnoId) => {
    return isElectron ? await window.api.getCashMovements(turnoId) : [];
  },
  getShiftSummary: async (turnoId) => {
    if (isElectron) return await window.api.getShiftSummary(turnoId);
    return {
      fondo_inicial: 0,
      total_ventas_efectivo: 0,
      total_ventas_tarjeta: 0,
      total_ventas_credito: 0,
      total_entradas: 0,
      total_salidas: 0,
      efectivo_esperado: 0,
      total_transacciones: 0,
      total_ventas: 0
    };
  },

  // Clientes & Crédito (F2 & Clientes)
  getCustomers: async (search = '') => {
    return isElectron ? await window.api.getCustomers(search) : [];
  },
  saveCustomer: async (customer) => {
    return isElectron ? await window.api.saveCustomer(customer) : { success: true };
  },
  addCustomerPayment: async (data) => {
    return isElectron ? await window.api.addCustomerPayment(data) : { success: true };
  },
  getCustomerStatement: async (clienteId) => {
    return isElectron ? await window.api.getCustomerStatement(clienteId) : { cliente: null, movimientos: [] };
  },

  // Tasa de Cambio & Bimoneda ($ USD / Bs.)
  getExchangeRate: async () => {
    return isElectron ? await window.api.getExchangeRate() : { tasa: 55.00, fecha_actualizacion: 'Hoy' };
  },
  setExchangeRate: async (rate) => {
    return isElectron ? await window.api.setExchangeRate(rate) : { tasa: rate, fecha_actualizacion: 'Hoy' };
  },

  // Ticket & Impresión
  getLastSale: async () => {
    return isElectron ? await window.api.getLastSale() : null;
  },
  printTicket: async (ticketHtml) => {
    if (isElectron) return await window.api.printTicket(ticketHtml);
    window.print();
    return { success: true };
  },

  // Respaldo
  backupDatabase: async (folder) => {
    return isElectron ? await window.api.backupDatabase(folder) : { success: true, fileName: 'test.db' };
  },

  // Reportes
  getSalesReport: async () => {
    if (isElectron) return await window.api.getSalesReport();
    return { totales: { total_ventas: 0, monto_total: 0, ganancia_total: 0 }, ventasPorDia: [], ventasPorDepto: [] };
  }
};
