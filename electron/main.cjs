const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION IN MAIN:', err);
});

let dbOps;
try {
  dbOps = require('./database.cjs');
  console.log('database.cjs loaded successfully in main!');
} catch (e) {
  console.error('FAILED TO LOAD database.cjs IN MAIN:', e);
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: 'eleventa Punto de Venta - MiniMarket',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

// IPC Handlers - Productos
ipcMain.handle('pos:get-product-by-code', async (_, code) => dbOps.getProductByCode(code));
ipcMain.handle('pos:search-products', async (_, query, limit) => dbOps.searchProducts(query, limit));
ipcMain.handle('pos:save-product', async (_, prod) => dbOps.saveProduct(prod));
ipcMain.handle('pos:delete-product', async (_, id) => dbOps.deleteProduct(id));
ipcMain.handle('pos:get-departments', async () => dbOps.getDepartments());
ipcMain.handle('pos:save-department', async (_, nombre) => dbOps.saveDepartment(nombre));

// IPC Handlers - Inventario & Kardex
ipcMain.handle('pos:add-inventory', async (_, data) => dbOps.addInventory(data));
ipcMain.handle('pos:get-kardex', async (_, prodId, limit) => dbOps.getKardex(prodId, limit));
ipcMain.handle('pos:get-low-stock-products', async (_, deptoId) => dbOps.getLowStockProducts(deptoId));

// IPC Handlers - Ventas
ipcMain.handle('pos:complete-sale', async (_, saleData) => dbOps.completeSale(saleData));

// IPC Handlers - Caja & Turnos
ipcMain.handle('pos:get-current-shift', async () => dbOps.getOrCreateCurrentShift());
ipcMain.handle('pos:add-cash-movement', async (_, movement) => dbOps.addCashMovement(movement));
ipcMain.handle('pos:get-cash-movements', async (_, turnoId) => dbOps.getCashMovements(turnoId));
ipcMain.handle('pos:get-shift-summary', async (_, turnoId) => dbOps.getShiftSummary(turnoId));

// IPC Handlers - Clientes & Crédito
ipcMain.handle('pos:get-customers', async (_, search) => dbOps.getCustomers(search));
ipcMain.handle('pos:save-customer', async (_, customer) => dbOps.saveCustomer(customer));
ipcMain.handle('pos:add-customer-payment', async (_, data) => dbOps.addCustomerPayment(data));
ipcMain.handle('pos:get-customer-statement', async (_, id) => dbOps.getCustomerStatement(id));

// IPC Handlers - Tasa de Cambio & Bimoneda
ipcMain.handle('pos:get-exchange-rate', async () => dbOps.getExchangeRate());
ipcMain.handle('pos:set-exchange-rate', async (_, rate) => dbOps.setExchangeRate(rate));

// IPC Handlers - Ticket & Impresión
ipcMain.handle('pos:get-last-sale', async () => dbOps.getLastSale());
ipcMain.handle('pos:print-ticket', async (_, ticketHtml) => {
  const printWindow = new BrowserWindow({
    show: false,
    width: 300,
    height: 600,
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  });

  await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(ticketHtml)}`);

  return new Promise((resolve) => {
    printWindow.webContents.print(
      { silent: true, printBackground: true, margins: { marginType: 'none' } },
      (success, failureReason) => {
        printWindow.close();
        resolve({ success, failureReason });
      }
    );
  });
});

// IPC Handlers - Respaldo
ipcMain.handle('pos:backup-database', async (_, folder) => dbOps.backupDatabase(folder));

// IPC Handlers - Reportes
ipcMain.handle('pos:get-sales-report', async () => dbOps.getSalesReport());

// IPC Handlers - Importar / Exportar Excel
ipcMain.handle('pos:export-products', async () => dbOps.getAllProductsForExport());
ipcMain.handle('pos:import-products', async (_, productsList) => dbOps.importProducts(productsList));

// IPC Handlers - Usuarios y Empleados
ipcMain.handle('pos:get-users', async () => dbOps.getUsers());
ipcMain.handle('pos:save-user', async (_, userData) => dbOps.saveUser(userData));
ipcMain.handle('pos:delete-user', async (_, id) => dbOps.deleteUser(id));
ipcMain.handle('pos:login-user', async (_, term) => dbOps.loginUser(term));

app.whenReady().then(async () => {
  try {
    await dbOps.initDatabase();
    console.log('Database ready for operations.');
  } catch (err) {
    console.error('CRITICAL ERROR INITIALIZING DATABASE:', err);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
