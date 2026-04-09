// constants.ts
export interface ComprobanteOption {
  value: string;
  label: string;
  description: string;
}

export const comprobantesOptions: ComprobanteOption[] = [
  {
    value: '01',
    label: 'Factura de Crédito Fiscal',
    description:
      'Registra transacciones comerciales de bienes/servicios. Permite sustentar gastos y créditos de ISR o ITBIS.',
  },
  {
    value: '02',
    label: 'Factura de Consumo',
    description:
      'Acredita transferencias de bienes o servicios a consumidores finales. Sin efectos tributarios.',
  },
  {
    value: '03',
    label: 'Nota de Débito',
    description:
      'Documento emitido para recuperar costos como intereses, fletes, tras emitir el comprobante fiscal.',
  },
  {
    value: '04',
    label: 'Nota de Crédito',
    description:
      'Documento emitido para anular operaciones, efectuar devoluciones, conceder descuentos o corregir errores.',
  },
  {
    value: '11',
    label: 'Comprobante de Compra',
    description:
      'Emitido al adquirir bienes o servicios de personas no registradas como contribuyentes.',
  },
  {
    value: '12',
    label: 'Comprobante de Registro Único de Ingresos',
    description:
      'Resumen de transacciones diarias a consumidores finales, generalmente exentos de ITBIS.',
  },
  {
    value: '13',
    label: 'Comprobante para Gastos Menores',
    description:
      'Para sustentar pagos menores relacionados con actividades laborales, como transporte o consumibles.',
  },
  {
    value: '14',
    label: 'Comprobante para Regímenes Especiales',
    description:
      'Utilizado en ventas o servicios exentos a personas bajo regímenes tributarios especiales.',
  },
  {
    value: '15',
    label: 'Comprobante Gubernamental',
    description:
      'Utilizado para facturar bienes/servicios al Gobierno Central y entidades relacionadas.',
  },
  {
    value: '16',
    label: 'Comprobante para Exportaciones',
    description:
      'Usado para reportar ventas de bienes fuera del territorio nacional por exportadores y zonas francas.',
  },
  {
    value: '17',
    label: 'Comprobante para Pagos al Exterior',
    description:
      'Emitido para pagos de rentas gravadas a personas no residentes fiscales, incluye retención del ISR.',
  },
  {
    value: 'e-CF',
    label: 'Comprobante Fiscal Electrónico',
    description:
      'Documento digital que acredita transferencias de bienes o prestación de servicios cumpliendo normativa.',
  },
];
