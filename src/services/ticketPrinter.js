// Generador y formateador de tickets térmicos (58mm / 80mm)

export function generateReceiptHtml(saleData) {
  const {
    folio,
    fecha = new Date().toLocaleString('es-VE'),
    items = [],
    total,
    tasaCambio = 55.0,
    pagoCon,
    cambio,
    metodoPago = 'efectivo',
    cajero = 'DAVID ENRIQUE GONZALEZ',
    negocio = {}
  } = saleData;

  const totalUsd = Number(total || 0);
  const totalBs = totalUsd * tasaCambio;
  const cambioUsd = Number(cambio || 0);
  const cambioBs = cambioUsd * tasaCambio;

  const nombreNegocio = negocio.nombre_negocio || 'MINIMARKET';
  const direccion = negocio.direccion || 'Dirección Comercial';
  const telefono = negocio.telefono || '0412-0000000';
  const mensaje = negocio.mensaje_ticket || '¡Gracias por su compra!';

  const itemsHtml = items.map((it) => {
    const unitUsd = Number(it.precio || it.precio_unitario || 0);
    const unitBs = unitUsd * tasaCambio;
    const importeUsd = unitUsd * it.cantidad;
    const importeBs = importeUsd * tasaCambio;

    return `
      <tr>
        <td colspan="3" style="font-weight: bold; padding-top: 4px;">${it.producto || it.descripcion}</td>
      </tr>
      <tr style="border-bottom: 1px dotted #ccc;">
        <td style="text-align: left;">${it.cantidad} x $${unitUsd.toFixed(2)}</td>
        <td style="text-align: right; color: #555;">(Bs. ${unitBs.toFixed(2)})</td>
        <td style="text-align: right; font-weight: bold;">$${importeUsd.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Ticket #${folio}</title>
      <style>
        @page { margin: 0; }
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 12px;
          margin: 0;
          padding: 10px;
          color: #000;
          background: #fff;
          width: 280px;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .bold { font-weight: bold; }
        .border-t { border-top: 1px dashed #000; }
        .border-b { border-bottom: 1px dashed #000; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
      </style>
    </head>
    <body>
      <div class="text-center">
        <h2 style="margin: 0; font-size: 16px;">${nombreNegocio}</h2>
        <div style="font-size: 10px; margin: 2px 0;">${direccion}</div>
        <div style="font-size: 10px;">Tel: ${telefono}</div>
        <div class="border-b" style="margin: 6px 0;"></div>
        <div class="bold" style="font-size: 14px;">TICKET DE VENTA #${folio}</div>
        <div style="font-size: 10px;">Fecha: ${fecha}</div>
        <div style="font-size: 10px;">Le atendió: ${cajero}</div>
        <div style="font-size: 10px; margin-top: 2px;">Tasa: Bs. ${tasaCambio.toFixed(2)} / $</div>
        <div class="border-b" style="margin: 6px 0;"></div>
      </div>

      <table>
        <thead>
          <tr style="border-bottom: 1px solid #000;">
            <th style="text-align: left;">Cant / P.Unit</th>
            <th style="text-align: right;">Equiv Bs.</th>
            <th style="text-align: right;">Total $</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="border-t" style="margin-top: 8px; padding-top: 6px;">
        <table style="font-size: 12px;">
          <tr>
            <td class="bold">TOTAL USD:</td>
            <td class="text-right bold" style="font-size: 15px;">$${totalUsd.toFixed(2)}</td>
          </tr>
          <tr>
            <td class="bold">TOTAL BS:</td>
            <td class="text-right bold" style="font-size: 13px;">Bs. ${totalBs.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Método:</td>
            <td class="text-right uppercase">${metodoPago}</td>
          </tr>
          ${cambioUsd > 0 ? `
          <tr>
            <td>Cambio USD:</td>
            <td class="text-right bold">$${cambioUsd.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Cambio Bs:</td>
            <td class="text-right bold">Bs. ${cambioBs.toFixed(2)}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <div class="text-center border-t" style="margin-top: 10px; padding-top: 8px; font-size: 11px;">
        <div>${mensaje}</div>
        <div style="font-size: 9px; margin-top: 4px; color: #666;">Sistema MiniMarket POS</div>
      </div>
    </body>
    </html>
  `;
}
