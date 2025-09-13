/**
 * Ejemplos y datos de prueba para comprobantes fiscales
 * Este archivo muestra cómo quedarían los datos reales
 */

// Ejemplo de datos reales de comprobantes fiscales (simulación)
export const EXAMPLE_TAX_RECEIPTS = [
  {
    id: 'receipt_1',
    data: {
      name: 'CREDITO FISCAL',
      series: 'B01',
      startNumber: 1,
      endNumber: 1000,
      currentNumber: 850,
      quantity: '150',       // String - Cantidad restante
      disabled: false,
      createdAt: new Date('2024-01-01'),
      lastUsed: new Date('2024-07-15')
    }
  },
  {
    id: 'receipt_2', 
    data: {
      name: 'CONSUMIDOR FINAL',
      series: 'A01',
      startNumber: 1,
      endNumber: 2000,
      currentNumber: 1920,
      quantity: '80',        // String - CRÍTICO
      disabled: false,
      createdAt: new Date('2024-01-01'),
      lastUsed: new Date('2024-07-15')
    }
  },
  {
    id: 'receipt_3',
    data: {
      name: 'GUBERNAMENTAL',
      series: 'G01', 
      startNumber: 1,
      endNumber: 500,
      currentNumber: 450,
      quantity: '50',        // String - ADVERTENCIA
      disabled: false,
      createdAt: new Date('2024-03-01'),
      lastUsed: new Date('2024-07-10')
    }
  },
  {
    id: 'receipt_4',
    data: {
      name: 'EXPORTACION',
      series: 'E01',
      startNumber: 1,
      endNumber: 100,
      currentNumber: 25,
      quantity: '75',        // String - OK
      disabled: false,
      createdAt: new Date('2024-05-01'),
      lastUsed: new Date('2024-07-01')
    }
  },
  {
    id: 'receipt_5',
    data: {
      name: 'NOTA DE CREDITO',
      series: 'NC01',
      startNumber: 1,
      endNumber: 500,
      currentNumber: 10,
      quantity: '490',       // String - OK (pero desactivado)
      disabled: true,
      createdAt: new Date('2024-02-01'),
      lastUsed: new Date('2024-06-01')
    }
  }
];

/**
 * Función para demostrar el uso con datos reales
 */
export const demonstrateRealUsage = () => {
  // Importar las funciones necesarias
  const { processFiscalReceipts, generateFiscalReceiptsWidgetData } = require('../utils/fiscalReceiptsUtils');
  
  console.log('=== DEMOSTRACIÓN DE DATOS REALES ===\n');
  
  // Procesar los datos de ejemplo
  const analysis = processFiscalReceipts(EXAMPLE_TAX_RECEIPTS);
  
  console.log('📊 ANÁLISIS GENERAL:');
  console.log(`- Total de comprobantes: ${analysis.summary.totalReceipts}`);
  console.log(`- Comprobantes activos: ${analysis.summary.activeReceipts}`);
  console.log(`- Comprobantes que requieren atención: ${analysis.summary.receiptsNeedingAttention}`);
  console.log(`- Comprobantes críticos: ${analysis.summary.criticalReceipts}`);
  console.log(`- Comprobantes con advertencia: ${analysis.summary.warningReceipts}`);
  console.log(`- Total de comprobantes restantes: ${analysis.summary.totalRemaining}\n`);
  
  // Mostrar detalles de cada comprobante
  console.log('📋 DETALLES POR COMPROBANTE:');
  analysis.receipts.forEach(receipt => {
    if (receipt.isActive) {
      const status = receipt.alertLevel === 'critical' ? '🚨 CRÍTICO' : 
                    receipt.alertLevel === 'warning' ? '⚠️ ADVERTENCIA' : 
                    '✅ OK';
      
      console.log(`${status} ${receipt.name} (Serie ${receipt.series}):`);
      console.log(`  - Rango: ${receipt.startNumber} - ${receipt.endNumber}`);
      console.log(`  - Actual: ${receipt.currentNumber}`);
      console.log(`  - Restantes: ${receipt.remainingNumbers} (${receipt.percentageRemaining}%)`);
      console.log(`  - Umbrales: Advertencia=${receipt.thresholds?.warning}, Crítico=${receipt.thresholds?.critical}\n`);
    }
  });
  
  // Generar datos para el widget
  const widgetData = generateFiscalReceiptsWidgetData(EXAMPLE_TAX_RECEIPTS);
  
  console.log('🔔 DATOS PARA EL WIDGET DE NOTIFICACIONES:');
  console.log(`Título: ${widgetData.title}`);
  console.log(`Tipo de alerta: ${widgetData.alertType}`);
  console.log(`Mensaje: ${widgetData.message}`);
  console.log(`Serie info: ${widgetData.seriesInfo}`);
  console.log(`¿Tiene problemas?: ${widgetData.hasIssues ? 'Sí' : 'No'}`);
  console.log(`Acción recomendada: ${widgetData.actionText}`);
  
  if (widgetData.summary) {
    console.log(`\nResumen adicional:`);
    console.log(`- Comprobantes que necesitan atención: ${widgetData.summary.receiptsNeedingAttention}`);
    console.log(`- Más crítico: ${widgetData.summary.mostCritical?.name || 'Ninguno'}`);
  }
  
  return analysis;
};

// Ejecutar la demostración si se ejecuta directamente
if (typeof window === 'undefined' && require.main === module) {
  demonstrateRealUsage();
}
