# The MiniMarket - Punto de Venta (Estilo Eleventa)

Sistema de Punto de Venta de alto rendimiento, **100% local y offline**, diseñado específicamente para abarrotes, minimarkets y tiendas de conveniencia.

---

## 🚀 Cómo Iniciar la Aplicación

1. **Doble clic:** Ejecuta el archivo [iniciar-pos.bat](file:///c:/Users/Deivy/Desktop/proyectos/Theminimarket/iniciar-pos.bat).
2. **Desde la terminal:**
   ```bash
   npm start
   ```

---

## 💵 Tasa de Cambio Diaria y Sistema Bimoneda ($ USD y Bs.)

* **Actualización en 1 Clic:** En la barra superior, haz clic en la píldora **"Tasa del Día"** (o en Configuración) para ajustar la tasa manual en segundos.
* **Conversión Instantánea:** Todos los precios, totales de venta y tablas muestran simultáneamente el importe en **$ USD** y en **Bolívares (Bs.)**.
* **Cobro Mixto y Cambio:** Al presionar `F12`, puedes seleccionar si el cliente paga en divisas ($ USD efectivo), Pago Móvil, Punto de Venta / Tarjeta en Bs., o Efectivo en Bs., con cálculo exacto de cambio en ambas monedas.

---

## 🖨️ Tickets de Venta & Hardware POS

* **Plantilla Térmica ESC/POS:** Genera automáticamente el recibo con membrete de la tienda, desglose de artículos en $ y Bs., tasa aplicada y totales.
* **Reimpresión Rápida:** Botón **"Reimprimir Último Ticket"** en la barra inferior de ventas para imprimir copias al instante.
* **Cajón de Dinero y Báscula:** Configuración de pulso de apertura y puerto serial COM para balanzas electrónicas en el módulo de Configuración.

---

## 💾 Respaldos de Seguridad Locales

* En el módulo de **Configuración > Respaldos**, puedes generar con un clic una copia de seguridad timestamped completa (*Hot Backup*) de la base de datos SQLite en `database/backups/` o en una memoria USB.

---

## 📦 Generar Instalador Ejecutable de Windows (.exe)

Para crear el archivo instalador final independiente para tu cliente:
1. Haz doble clic en el archivo [generar-instalador.bat](file:///c:/Users/Deivy/Desktop/proyectos/Theminimarket/generar-instalador.bat).
2. Se generará automáticamente el instalador en la carpeta `instalador/TheMiniMarket POS Setup.exe`.
3. Tu cliente podrá instalarlo en cualquier PC con Windows 10/11 sin necesidad de tener Node.js ni consolas abiertas.

---

## ⌨️ Atajos de Teclado (Ergonomía Eleventa)

| Tecla | Acción |
|---|---|
| **F1** | Pantalla principal de **Ventas** |
| **F12** | **Cobrar Ticket** (Modal bimoneda con cambio en $ y Bs.) |
| **F10** | **Buscar Producto** en el catálogo de 407 artículos precargados |
| **F9** | **Verificador de Precios** instantáneo |
| **F7 / F8** | Registrar **Entrada / Salida** de efectivo de caja |
| **F5** | Cambiar cantidad del artículo seleccionado en el ticket |
| **DEL** | Borrar artículo seleccionado del ticket |
| **INS** | Agregar artículo genérico / varios |
| **ESC** | Cerrar cualquier modal o cancelar operación |
