// excelUtils.js
import dayjs from 'dayjs';
import * as exceljs from 'exceljs';  // Cambiado de ExcelJS a exceljs (minúsculas)
import { saveAs } from 'file-saver';
import _ from 'lodash';

/**
 * Cleans and converts a numeric value from different formats
 * @param {string|number} value - Value to clean (ex: "$70.00" or "89,1449")
 * @returns {number} - Clean numeric value
 */
export const cleanNumericValue = (value) => {
  if (!value || (typeof value !== 'string' && typeof value !== 'number')) return 0;
  
  if (typeof value === 'number') return value;
  
  // Remove currency symbol and spaces
  let cleanValue = value.replace(/[$\s]/g, '');
  
  // Replace commas with periods for decimal format
  cleanValue = cleanValue.replace(/,/g, '.');
  
  // Convert to number
  const numValue = parseFloat(cleanValue);
  return isNaN(numValue) ? 0 : numValue;
};

/**
 * Extracts the tax percentage as a decimal
 * @param {string} taxValue - Tax value (ex: "18%")
 * @returns {number} - Decimal rate (ex: 0.18)
 */
export const extractTaxRate = (taxValue) => {
  if (!taxValue || typeof taxValue !== 'string') return 0;
  
  // Extract the percentage number
  const match = taxValue.match(/(\d+)/);
  if (match && match[1]) {
    const taxPercent = parseInt(match[1], 10);
    return taxPercent / 100;
  }
  return 0;
};

/**
 * Calculates the price without tax
 * @param {number} priceWithTax - Price with tax
 * @param {number} taxRate - Tax rate (decimal)
 * @returns {number} - Price without tax
 */
export const calculatePriceWithoutTax = (priceWithTax, taxRate) => {
  if (taxRate === 0) return priceWithTax;
  return priceWithTax / (1 + taxRate);
};

/**
 * Rounds the price according to the selected strategy
 * @param {number} price - Price to round
 * @param {string} strategy - Rounding strategy ('0' for units, '1' for tens, etc.)
 * @param {string} method - Rounding method ('ceil', 'floor', 'round')
 * @returns {number} - Rounded price
 */
export const roundPrice = (price, strategy = '0', method = 'ceil') => {
  if (strategy === 'none') return price;
  
  const factor = Math.pow(10, parseInt(strategy, 10));
  
  switch (method) {
    case 'ceil':
      return Math.ceil(price / factor) * factor;
    case 'floor':
      return Math.floor(price / factor) * factor;
    case 'round':
      return Math.round(price / factor) * factor;
    default:
      return Math.ceil(price / factor) * factor;
  }
};

/**
 * Processes data from a TSV/CSV file
 * @param {string} content - File content
 * @returns {Array} - Array of processed product objects
 */
export const processTsvFile = (content) => {
  try {
    // Validación básica del contenido
    if (!content || typeof content !== 'string') {
      throw new Error('El contenido del archivo no es válido');
    }

    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    
    if (lines.length < 2) {
      throw new Error('El archivo no contiene suficientes datos');
    }
    
    // Get headers (first line)
    const headers = lines[0].split('\t').map(header => header.trim());
    
    // Verificar los encabezados mínimos necesarios
    const requiredHeaders = [
      'Nombre del producto', 
      'Stock', 
      'Impuesto', 
      'Codigo de barras',
      'Costo',
      'Precio de lista',
      'Precio mínimo',
      'Precio medio'
    ];
    
    for (const header of requiredHeaders) {
      if (!headers.includes(header)) {
        throw new Error(`Falta el encabezado requerido: ${header}`);
      }
    }
    
    // Process each line
    const products = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('\t');
      if (values.length >= headers.length) {
        try {
          const product = processProductLine(values, headers);
          products.push(product);
        } catch (err) {
          console.error(`Error procesando línea ${i}:`, err);
          // Continuar con la siguiente línea en lugar de fallar todo el proceso
        }
      }
    }
    
    return products;
  } catch (err) {
    console.error('Error en processTsvFile:', err);
    throw err;
  }
};

/**
 * Processes a line of data into a product object
 * @param {Array} values - Line values
 * @param {Array} headers - Column headers
 * @returns {Object} - Structured product object
 */
export const processProductLine = (values, headers) => {
  try {
    // Index verification
    const nameIndex = headers.indexOf('Nombre del producto');
    const stockIndex = headers.indexOf('Stock');
    const taxIndex = headers.indexOf('Impuesto');
    const billableIndex = headers.indexOf('Facturable');
    const trackInventoryIndex = headers.indexOf('Inventariable');
    const barcodeIndex = headers.indexOf('Codigo de barras');
    const costIndex = headers.indexOf('Costo');
    const listPriceIndex = headers.indexOf('Precio de lista');
    const minPriceIndex = headers.indexOf('Precio mínimo');
    const avgPriceIndex = headers.indexOf('Precio medio');
    
    // Extract basic values - con mayor protección contra errores
    const name = nameIndex >= 0 && nameIndex < values.length ? values[nameIndex] : '';
    const stock = stockIndex >= 0 && stockIndex < values.length ? parseInt(values[stockIndex]) || 0 : 0;
    
    // Extract tax value
    const taxRateString = taxIndex >= 0 && taxIndex < values.length ? values[taxIndex] : '0%';
    const taxRate = extractTaxRate(taxRateString);
    
    // Boolean values
    const billable = billableIndex >= 0 && billableIndex < values.length ? values[billableIndex] === 'Sí' : false;
    const trackInventory = trackInventoryIndex >= 0 && trackInventoryIndex < values.length ? values[trackInventoryIndex] === 'Sí' : false;
    
    // Barcode
    const barcode = barcodeIndex >= 0 && barcodeIndex < values.length ? values[barcodeIndex] || '' : '';
    
    // Prices - con validación adicional
    const cost = costIndex >= 0 && costIndex < values.length ? cleanNumericValue(values[costIndex]) : 0;
    const listPrice = listPriceIndex >= 0 && listPriceIndex < values.length ? cleanNumericValue(values[listPriceIndex]) : 0;
    const minPrice = minPriceIndex >= 0 && minPriceIndex < values.length ? cleanNumericValue(values[minPriceIndex]) : 0;
    const avgPrice = avgPriceIndex >= 0 && avgPriceIndex < values.length ? cleanNumericValue(values[avgPriceIndex]) : 0;
    
    // Calculate price without tax for all price fields
    const priceWithoutTax = calculatePriceWithoutTax(listPrice, taxRate);
    const minPriceWithoutTax = calculatePriceWithoutTax(minPrice, taxRate);
    const avgPriceWithoutTax = calculatePriceWithoutTax(avgPrice, taxRate);
    
    const listPriceRaw = listPriceIndex >= 0 && listPriceIndex < values.length 
      ? cleanNumericValue(values[listPriceIndex]) : 0;
    const minPriceRaw = minPriceIndex >= 0 && minPriceIndex < values.length 
      ? cleanNumericValue(values[minPriceIndex]) : 0;
    const avgPriceRaw = avgPriceIndex >= 0 && avgPriceIndex < values.length 
      ? cleanNumericValue(values[avgPriceIndex]) : 0;
      
    // Compute net prices (without tax)
    const netListPrice = calculatePriceWithoutTax(listPriceRaw, taxRate);
    const netMinPrice  = calculatePriceWithoutTax(minPriceRaw, taxRate);
    const netAvgPrice = calculatePriceWithoutTax(avgPriceRaw, taxRate);
    
    return {
      name,
      stock,
      trackInventory,
      billable,
      barcode,
      isVisible: true,
      order: 1,
      pricing: {
        cost,
        listPrice: netListPrice,
        minPrice: netMinPrice,
        avgPrice: netAvgPrice,
        tax: taxRate * 100,
        price: netListPrice  // price equals listPrice
      }
    };
  } catch (err) {
    console.error('Error en processProductLine:', err);
    throw err;
  }
};

/**
 * Updates product prices according to configuration
 * @param {Array} products - List of products to update
 * @param {Object} config - Update configuration
 * @returns {Array} - Products with updated prices
 */
export const updatePrices = (products, config) => {
  if (!products || !Array.isArray(products) || products.length === 0) {
    return [];
  }
  
  return products.map(product => {
    // Check if this product should be updated
    if (config.applyTo === 'withStock' && product.stock <= 0) {
      return product;
    }
    if (config.applyTo === 'withoutStock' && product.stock > 0) {
      return product;
    }
    if (config.onlyProductsWithCost && product.pricing.cost <= 0) {
      return product;
    }
    
    // Create copy to avoid mutating the original
    const updatedProduct = _.cloneDeep(product);
    let basePrice = updatedProduct.pricing[config.targetField];
    let newPrice = basePrice;
    
    // Apply the update according to the selected method
    if (config.method === 'percentage') {
      newPrice = basePrice * (1 + config.value / 100);
    } else if (config.method === 'amount') {
      newPrice = basePrice + parseFloat(config.value);
    } else if (config.method === 'formula') {
      // For formulas based on cost
      if (config.targetField === 'listPrice') {
        const cost = updatedProduct.pricing.cost;
        newPrice = cost * (1 + config.value / 100);
      }
    }
    
    // Apply rounding if enabled
    if (config.roundPrices) {
      newPrice = roundPrice(newPrice, config.roundTo);
    }
    
    // Update the target price
    updatedProduct.pricing[config.targetField] = newPrice;
    if (config.targetField === 'listPrice') {
      updatedProduct.pricing.price = newPrice;
    }
    
    return updatedProduct;
  });
};

/**
 * Exports products to Excel
 * @param {Array} products - List of products to export
 * @param {string} filename - Filename (without extension)
 */
export const exportProductsToExcel = async (products, filename = 'products') => {
  if (!products || !Array.isArray(products) || products.length === 0) {
    throw new Error('No products to export');
  }
  
  try {
    const workbook = new exceljs.Workbook();  // Usando exceljs minúscula
    const worksheet = workbook.addWorksheet('Products');
    
    // Updated headers (removed "Price without Tax")
    worksheet.columns = [
      { header: 'Product Name', key: 'name', width: 40 },
      { header: 'Stock', key: 'stock', width: 10 },
      { header: 'Tax', key: 'tax', width: 10 },
      { header: 'Billable', key: 'billable', width: 10 },
      { header: 'Track Inventory', key: 'trackInventory', width: 15 },
      { header: 'Barcode', key: 'barcode', width: 20 },
      { header: 'Cost', key: 'cost', width: 15 },
      { header: 'List Price', key: 'listPrice', width: 15 },
      { header: 'Price', key: 'price', width: 15 },
      { header: 'Min Price', key: 'minPrice', width: 15 },
      { header: 'Average Price', key: 'avgPrice', width: 15 }
    ];
    
    // Add rows
    products.forEach(product => {
      worksheet.addRow({
        name: product.name,
        stock: product.stock,
        tax: `${product.pricing.tax}%`,
        billable: product.billable ? 'Yes' : 'No',
        trackInventory: product.trackInventory ? 'Yes' : 'No',
        barcode: product.barcode,
        cost: product.pricing.cost,
        listPrice: product.pricing.listPrice,
        price: product.pricing.price,
        minPrice: product.pricing.minPrice,
        avgPrice: product.pricing.avgPrice // updated field key here
      });
    });
    
    // Format numeric cells
    worksheet.getColumn('cost').numFmt = '$#,##0.00';
    worksheet.getColumn('listPrice').numFmt = '$#,##0.00';
    worksheet.getColumn('price').numFmt = '$#,##0.00';
    worksheet.getColumn('minPrice').numFmt = '$#,##0.00';
    worksheet.getColumn('avgPrice').numFmt = '$#,##0.00'; // updated to match the new key
    
    // Style for headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
    
    // Generate file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${filename}_${dayjs().format('YYYY-MM-DD')}.xlsx`);
  } catch (err) {
    console.error('Error en exportProductsToExcel:', err);
    throw err;
  }
};