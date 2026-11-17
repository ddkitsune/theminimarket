const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Productos (F3)
  getProductByCode: (code) => ipcRenderer.invoke('pos:get-product-by-code', code),
  searchProducts: (query, limit) => ipcRenderer.invoke('pos:search-products', query, limit),
  saveProduct: (product) => ipcRenderer.invoke('pos:save-product', product),
  deleteProduct: (id) => ipcRenderer.invoke('pos:delete-product', id),
  getDepartments: () => ipcRenderer.invoke('pos:get-departments'),
  saveDepartment: (nombre) => ipcRenderer.invoke('pos:save-department', nombre),

  // Inventario & Kardex (F4)
  addInventory: (data) => ipcRenderer.invoke('pos:add-inventory', data),
  getKardex: (productoId, limit) => ipcRenderer.invoke('pos:get-kardex', productoId, limit),
  getLowStockProducts: (deptoId) => ipcRenderer.invoke('pos:get-low-stock-products', deptoId),

  // Ventas (F1)
  completeSale: (saleData) => ipcRenderer.invoke('pos:complete-sale', saleData),

  // Caja & Turnos (Corte)
  getCurrentShift: () => ipcRenderer.invoke('pos:get-current-shift'),
  addCashMovement: (movement) => ipcRenderer.invoke('pos:add-cash-movement', movement),
  getCashMovements: (turnoId) => ipcRenderer.invoke('pos:get-cash-movements', turnoId),
  getShiftSummary: (turnoId) => ipcRenderer.invoke('pos:get-shift-summary', turnoId),

  // Clientes & Crédito (F2 & Clientes)
  getCustomers: (search) => ipcRenderer.invoke('pos:get-customers', search),
  saveCustomer: (customer) => ipcRenderer.invoke('pos:save-customer', customer),
  addCustomerPayment: (data) => ipcRenderer.invoke('pos:add-customer-payment', data),
  getCustomerStatement: (clienteId) => ipcRenderer.invoke('pos:get-customer-statement', clienteId),

  // Tasa de Cambio & Bimoneda ($ USD / Bs.)
  getExchangeRate: () => ipcRenderer.invoke('pos:get-exchange-rate'),
  setExchangeRate: (rate) => ipcRenderer.invoke('pos:set-exchange-rate', rate),

  // Ticket & Impresión
  getLastSale: () => ipcRenderer.invoke('pos:get-last-sale'),
  printTicket: (ticketHtml) => ipcRenderer.invoke('pos:print-ticket', ticketHtml),

  // Respaldo de Base de Datos
  backupDatabase: (folder) => ipcRenderer.invoke('pos:backup-database', folder),

  // Reportes (Pantalla 10)
  getSalesReport: () => ipcRenderer.invoke('pos:get-sales-report'),

  // Importar / Exportar Excel
  exportProducts: () => ipcRenderer.invoke('pos:export-products'),
  importProducts: (productsList) => ipcRenderer.invoke('pos:import-products', productsList),

  // Usuarios y Empleados
  getUsers: () => ipcRenderer.invoke('pos:get-users'),
  saveUser: (user) => ipcRenderer.invoke('pos:save-user', user),
  deleteUser: (id) => ipcRenderer.invoke('pos:delete-user', id),
  loginUser: (term) => ipcRenderer.invoke('pos:login-user', term)
});
