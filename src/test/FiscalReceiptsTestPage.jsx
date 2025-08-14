import React from 'react';
import FiscalReceiptsWidget from '../views/templates/NotificationCenter/components/FiscalReceiptsWidget';
import { generateFiscalReceiptsWidgetData } from '../utils/fiscalReceiptsUtils';
import { EXAMPLE_TAX_RECEIPTS } from '../examples/fiscalReceiptsExample';

/**
 * Componente de prueba para el widget de comprobantes fiscales
 * Se puede usar temporalmente para probar el funcionamiento
 */
const FiscalReceiptsTestPage = () => {
  // Generar datos usando los ejemplos
  const widgetData = generateFiscalReceiptsWidgetData(EXAMPLE_TAX_RECEIPTS);

  console.log('Datos del widget:', widgetData);
  console.log('Datos de ejemplo:', EXAMPLE_TAX_RECEIPTS);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Prueba del Widget de Comprobantes Fiscales</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Datos de Entrada (Simulados):</h3>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px', fontSize: '12px' }}>
          {JSON.stringify(EXAMPLE_TAX_RECEIPTS.map(r => ({
            name: r.data.name,
            series: r.data.series,
            quantity: r.data.quantity,
            disabled: r.data.disabled
          })), null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Widget Compacto:</h3>
        <FiscalReceiptsWidget data={widgetData} />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Datos Procesados:</h3>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px', fontSize: '12px' }}>
          {JSON.stringify({
            alertType: widgetData.alertType,
            hasIssues: widgetData.hasIssues,
            remaining: widgetData.remaining,
            total: widgetData.total,
            summary: widgetData.summary
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default FiscalReceiptsTestPage;
