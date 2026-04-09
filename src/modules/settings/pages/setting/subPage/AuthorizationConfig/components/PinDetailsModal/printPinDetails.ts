import type { PinEntryView } from './types';

export const buildPinDetailsPrintContent = ({
  pinEntries,
  displayName,
}: {
  pinEntries: PinEntryView[];
  displayName?: string;
}) => {
  const moduleRows = pinEntries.length
    ? pinEntries
        .map(
          (entry) => `
            <tr>
              <td class="module-name">
                <div class="module-title">${entry.moduleName}</div>
                <div class="module-meta">${entry.expiresAt ? `Expira: ${entry.expiresAt.toLocaleString()}` : 'Sin expiracion definida'}</div>
              </td>
              <td class="pin-code">${entry.pin || '------'}</td>
            </tr>
          `,
        )
        .join('')
    : `
            <tr>
              <td class="module-name">
                <div class="module-title">Sin modulos asignados</div>
                <div class="module-meta">Actualiza la configuracion para generar un PIN.</div>
              </td>
              <td class="pin-code">------</td>
            </tr>
          `;

  const pinCount = pinEntries.length;
  const pinCountLabel =
    pinCount === 0
      ? 'Sin PIN registrado'
      : pinCount === 1
        ? '1 PIN activo'
        : `${pinCount} PINs activos`;

  return `
    <html>
      <head>
        <title>PIN de Autorizacion</title>
        <style>
          :root { color-scheme: light; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            font-family: "Helvetica Neue", Arial, sans-serif;
            background: #f5f6f8;
            color: #101828;
          }
          .document {
            max-width: 720px;
            margin: 0 auto;
            padding: 48px;
            background: #ffffff;
            border: 1px solid #e4e7ec;
            border-radius: 16px;
            box-shadow: 0 24px 60px rgba(16, 24, 40, 0.08);
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            border-bottom: 1px solid #e4e7ec;
            padding-bottom: 24px;
            margin-bottom: 32px;
          }
          .brand {
            font-size: 12px;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: #475467;
          }
          .headline h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .headline p {
            margin: 6px 0 0;
            font-size: 14px;
            color: #475467;
          }
          .table-intro {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            gap: 16px;
            margin-bottom: 12px;
            font-size: 13px;
            color: #475467;
          }
          .table { margin-bottom: 32px; }
          table { width: 100%; border-collapse: collapse; }
          th {
            text-align: left;
            font-size: 11px;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #475467;
            border-bottom: 1px solid #e4e7ec;
            padding: 12px 0;
          }
          th:last-child { text-align: right; }
          td {
            padding: 18px 0;
            border-bottom: 1px solid #f2f4f7;
            vertical-align: top;
          }
          .module-title {
            font-size: 15px;
            font-weight: 600;
            color: #101828;
          }
          .module-meta {
            font-size: 13px;
            color: #667085;
            margin-top: 4px;
          }
          .pin-code {
            font-family: "Courier New", monospace;
            font-size: 22px;
            letter-spacing: 0.35em;
            text-align: right;
            color: #1d2939;
            white-space: nowrap;
          }
          .notice {
            background: #fef3f2;
            border: 1px solid #fecdca;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            font-size: 13px;
            color: #b42318;
            line-height: 1.5;
          }
          .footer {
            margin-top: 24px;
            font-size: 11px;
            color: #98a2b3;
            text-align: right;
          }
          @media print {
            body { background: #ffffff; }
            .document { box-shadow: none; margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="document">
          <header class="header">
            <div class="brand">VentaMas</div>
            <div class="headline">
              <h1>PIN de Autorizacion</h1>
              <p>Documento confidencial para uso interno</p>
            </div>
          </header>
          <section class="table">
            <div class="table-intro">
              <span>${displayName || '---'}</span>
              <span>${pinCountLabel}</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Modulo</th>
                  <th>PIN</th>
                </tr>
              </thead>
              <tbody>${moduleRows}</tbody>
            </table>
          </section>
          <div class="notice">
            <strong>IMPORTANTE:</strong> Este PIN es confidencial. No lo compartas con nadie. Se invalida automaticamente a las 24 horas o cuando sea revocado.
          </div>
          <div class="footer">Generado ${new Date().toLocaleString()}</div>
        </div>
      </body>
    </html>
  `;
};
