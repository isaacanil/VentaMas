import type {
  ElectronicTaxReceiptSnapshot,
  InvoiceBusinessInfo,
  InvoiceData,
  InvoiceProduct,
} from '@/types/invoice';

export type InvoiceScenarioPresetId =
  | 'short'
  | 'twoPages'
  | 'long'
  | 'electronic'
  | 'largeSummary';

export type InvoiceScenarioPreset = {
  description: string;
  id: InvoiceScenarioPresetId;
  label: string;
  longNotes?: boolean;
  productCount: number;
  usesElectronicTaxReceipt?: boolean;
};

export type InvoiceScenarioProduct = InvoiceProduct & {
  scenarioDiscount: number;
  scenarioLineTax: number;
  scenarioLineTotal: number;
  scenarioQuantity: number;
  scenarioTaxRate: number;
  scenarioUnitPrice: number;
};

export const INVOICE_SCENARIO_PRESETS: InvoiceScenarioPreset[] = [
  {
    description: 'Una sola pagina con footer final completo.',
    id: 'short',
    label: 'Factura corta',
    productCount: 3,
  },
  {
    description: 'Distribucion cercana a dos paginas.',
    id: 'twoPages',
    label: 'Factura 2 paginas',
    productCount: 10,
  },
  {
    description: 'Factura extensa con filas de alto variable.',
    id: 'long',
    label: 'Factura larga',
    productCount: 44,
  },
  {
    description: 'Factura electronica con bloque fiscal y QR textual.',
    id: 'electronic',
    label: 'e-CF con QR',
    productCount: 28,
    usesElectronicTaxReceipt: true,
  },
  {
    description: 'Resumen y notas finales grandes.',
    id: 'largeSummary',
    label: 'Resumen grande',
    longNotes: true,
    productCount: 33,
    usesElectronicTaxReceipt: true,
  },
];

const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const buildElectronicTaxReceipt = (): ElectronicTaxReceiptSnapshot => ({
  documentType: 'E31',
  eNcf: 'E310000000123',
  issuedAt: '2026-06-22',
  officialVerifyUrl: 'https://ecf.dgii.gov.do/consulta?demo=ventamas',
  printData: {
    fechaFirmaDigital: '22/06/2026 10:42:15',
    fechaVencimientoENCF: '31/12/2026',
  },
  qr: {
    url: 'https://ecf.dgii.gov.do/consulta?demo=ventamas&E=310000000123',
  },
  securityCode: 'A1B2C3',
  status: 'accepted',
  trackId: 'DEMO-TRACK-00042',
});

export const buildInvoiceScenarioBusiness = (): InvoiceBusinessInfo => ({
  address: 'Av. Abraham Lincoln 1050, Santo Domingo, D.N.',
  email: 'facturacion@ventamas.demo',
  invoice: {
    invoiceMessage:
      'Gracias por su compra. Mercancia revisada y recibida conforme a las condiciones comerciales acordadas.',
    signatureAssets: {
      enabled: false,
    },
  },
  name: 'VentaMas Laboratorio SRL',
  rnc: '131999999',
  tel: '809-555-0100',
});

const buildProductDescription = (index: number) => {
  const baseNames = [
    'Servicio de soporte operativo',
    'Producto inventariable',
    'Combo promocional',
    'Mantenimiento preventivo',
    'Insumo especializado',
    'Instalacion certificada',
  ];
  const name = `${baseNames[index % baseNames.length]} ${String(
    index + 1,
  ).padStart(2, '0')}`;

  if (index % 5 !== 0) {
    return name;
  }

  return `${name} con descripcion extendida para probar alto variable, condiciones fiscales, observaciones internas y referencias de entrega.`;
};

const buildInvoiceProducts = (count: number): InvoiceScenarioProduct[] =>
  Array.from({ length: count }, (_, index) => {
    const quantity = (index % 4) + 1;
    const unitPrice = 350 + index * 19;
    const taxRate = index % 7 === 0 ? 0 : index % 11 === 0 ? 16 : 18;
    const subtotal = quantity * unitPrice;
    const discount = index % 9 === 0 ? roundMoney(subtotal * 0.04) : 0;
    const taxableAmount = Math.max(subtotal - discount, 0);
    const lineTax = roundMoney(taxableAmount * (taxRate / 100));
    const lineTotal = roundMoney(taxableAmount + lineTax);

    return {
      barcode: `770${String(index + 1).padStart(8, '0')}`,
      brand: index % 3 === 0 ? 'VentaMas Labs' : 'Sin marca',
      cid: `fixture-product-${index + 1}`,
      comment:
        index % 6 === 0
          ? 'Incluye observacion comercial para probar lineas multiples.'
          : undefined,
      id: `fixture-product-${index + 1}`,
      measurement: index % 4 === 0 ? 'UND' : undefined,
      name: buildProductDescription(index),
      scenarioDiscount: discount,
      scenarioLineTax: lineTax,
      scenarioLineTotal: lineTotal,
      scenarioQuantity: quantity,
      scenarioTaxRate: taxRate,
      scenarioUnitPrice: unitPrice,
      sku: `LAB-${String(index + 1).padStart(4, '0')}`,
    };
  });

const resolveTotals = (products: InvoiceScenarioProduct[]) =>
  products.reduce(
    (totals, product) => {
      const subtotal = product.scenarioQuantity * product.scenarioUnitPrice;

      return {
        discount: roundMoney(totals.discount + product.scenarioDiscount),
        subtotal: roundMoney(totals.subtotal + subtotal),
        tax: roundMoney(totals.tax + product.scenarioLineTax),
        total: roundMoney(totals.total + product.scenarioLineTotal),
      };
    },
    {
      discount: 0,
      subtotal: 0,
      tax: 0,
      total: 0,
    },
  );

export const buildInvoiceScenarioData = (
  presetId: InvoiceScenarioPresetId,
): InvoiceData => {
  const preset =
    INVOICE_SCENARIO_PRESETS.find((candidate) => candidate.id === presetId) ??
    INVOICE_SCENARIO_PRESETS[0];
  const products = buildInvoiceProducts(preset.productCount);
  const totals = resolveTotals(products);

  return {
    NCF: preset.usesElectronicTaxReceipt ? 'E310000000123' : 'B0200000042',
    client: {
      address: 'Calle Las Orquideas 24, Ensanche Naco',
      name: 'Distribuidora Camino Verde SRL',
      rnc: '132456789',
      tel: '809-555-0199',
    },
    copyType: 'COPIA CLIENTE',
    date: '2026-06-22',
    dueDate: '2026-07-22',
    electronicTaxReceipt: preset.usesElectronicTaxReceipt
      ? buildElectronicTaxReceipt()
      : null,
    fiscalMode: preset.usesElectronicTaxReceipt
      ? 'electronic_ecf'
      : 'legacy_ncf',
    id: `lab-invoice-${preset.id}`,
    invoiceComment: preset.longNotes
      ? 'Favor validar mercancia al recibir. Esta factura contiene notas extendidas para comprobar que el footer final puede crecer sin romper el body. Los productos con descuento individual ya fueron reflejados en cada linea y en los totales finales.'
      : 'Documento de laboratorio para validar paginacion HTML.',
    numberID: 42,
    paymentMethod: [
      {
        method: 'cash',
        name: 'Efectivo',
        status: true,
        value: roundMoney(totals.total * 0.35),
      },
      {
        method: 'card',
        name: 'Tarjeta',
        reference: 'AUTH-8842',
        status: true,
        value: roundMoney(totals.total * 0.65),
      },
    ],
    products,
    seller: {
      name: 'Laboratorio VentaMas',
    },
    totalPurchase: {
      value: totals.total,
    },
    totalPurchaseWithoutTaxes: {
      value: Math.max(roundMoney(totals.subtotal - totals.discount), 0),
    },
    totalTaxes: {
      value: totals.tax,
    },
  };
};
