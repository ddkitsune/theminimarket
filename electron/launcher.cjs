const { spawn } = require('child_process');
const electronPath = require('electron');

const env = { ...process.env };
// Eliminar variable de VS Code que impide abrir la interfaz gráfica
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electronPath, ['electron/main.cjs'], {
  env,
  stdio: 'inherit',
  windowsHide: false
});

child.on('close', (code) => {
  // Electron on Windows exits with non-zero codes even on clean shutdown.
  // We always exit 0 so the .bat does not misreport an error.
  process.exit(0);
});
