import ExcelJS from 'exceljs';
import { useFormatPrice } from '../useFormatPrice';

export const ExportProducts = (products) => {
    // Crear una instancia de Workbook
    const workbook = new ExcelJS.Workbook();

    // Agregar una hoja al libro
    const worksheet = workbook.addWorksheet('Productos');

    // Crear las columnas en la hoja de Excel
    worksheet.columns = [
        { header: 'Nombre del producto', key: 'name' },
        { header: 'Categoría', key: 'category' },
        { header: 'Tamaño', key: 'size' },
        { header: 'Contenido neto', key: 'netContent' },
        { header: 'Stock', key: 'stock' },
        { header: 'Impuesto', key: 'tax' },
        { header: 'Facturable', key: 'isVisible' },
        { header: 'Inventariable', key: 'trackInventory' },
        { header: 'Codigo de barras', key: 'barcode'},
        { header: 'Costo', key: 'cost' },
        { header: 'Precio de lista', key: 'listPrice' },
        { header: 'Precio mínimo', key: 'minimumPrice' },
        { header: 'Precio medio', key: 'averagePrice' },
    ];

    // Ordenar los datos en orden ascendente según el nombre del producto
    products.sort((a, b) => {
        if (a.name < b.name) {
            return -1;
        }
        if (a.name > b.name) {
            return 1;
        }
        return 0;
    });

    // Mapear los datos del arreglo a un arreglo de valores
    const data = products.map(( product ) => [
        product.name,
        product.category,
        product.size,
        product.netContent,
        product.stock,
        product.pricing.tax,
        product.isVisible ? 'Sí' : 'No',
        product.trackInventory ? 'Sí' : 'No',
        product.barcode,
        useFormatPrice(product.pricing.cost),
        useFormatPrice(product.pricing?.listPrice),
        useFormatPrice(product.pricing?.minPrice),
        useFormatPrice(product.pricing?.avgPrice),
    ]);

    // Agregar los datos del arreglo a la hoja
    worksheet.addRows(data);
    // Aplicar el estilo negrita a los encabezados de las columnas
    worksheet.getRow(1).font = { bold: true };
    // Ajustar el ancho de las columnas en función del contenido
    worksheet.columns.forEach(column => {
        let maxWidth = 10; // Establecer un ancho mínimo
        column.eachCell({ includeEmpty: true }, cell => {
            const cellWidth = cell.value ? String(cell.value).length : 10;
            if (cellWidth > maxWidth) {
                maxWidth = cellWidth;
            }
        });
        column.width = maxWidth + 2; // Agregar un pequeño margen
    });

    // Guardar el archivo Excel
    workbook.xlsx.writeBuffer().then((buffer) => {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'productos.xlsx';
        a.click();
    });

}
