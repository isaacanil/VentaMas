import jsPDF from 'jspdf';

import 'jspdf-autotable';
import { formatCurrency, formatDate } from './utils';

export const generateARPDF = (data) => {
    const doc = new jsPDF();
    let yPos = 15;
    const margin = 15;
    const indent = 5;

    // Helper para añadir texto con posición Y dinámica
    const addText = (text, indent = 0) => {
        doc.text(margin + indent, yPos, text);
        yPos += 7;
    };

    // Título
    doc.setFontSize(16);
    addText('Resumen de Cuenta por Cobrar');
    yPos += 5;

    // Información del Cliente
    doc.setFontSize(12);
    doc.setTextColor(100);
    addText('Información del Cliente');
    doc.setTextColor(0);
    doc.setFontSize(10);
    addText(`Nombre: ${data?.client?.name || 'N/A'}`, indent);
    addText(`ID: ${data?.client?.personalID || 'N/A'}`, indent);
    addText(`Teléfono: ${data?.client?.tel || 'N/A'}`, indent);
    addText(`Dirección: ${data?.client?.address || 'N/A'}`, indent);
    yPos += 5;

    // Información de la Factura
    doc.setFontSize(12);
    doc.setTextColor(100);
    addText('Información de la Factura');
    doc.setTextColor(0);
    doc.setFontSize(10);
    addText(`Número: #${data?.invoice?.numberID || 'N/A'}`, indent);
    addText(`NCF: ${data?.invoice?.NCF || 'N/A'}`, indent);
    addText(`Fecha: ${formatDate(data?.invoice?.date)}`, indent);
    addText(
        `Total: ${formatCurrency(data?.invoice?.totalPurchase?.value)}`,
        indent,
    );
    yPos += 5;

    // Información de la Cuenta
    doc.setFontSize(12);
    doc.setTextColor(100);
    addText('Detalles de la Cuenta');
    doc.setTextColor(0);
    doc.setFontSize(10);
    addText(
        `Total por Cobrar: ${formatCurrency(data?.ar?.totalReceivable)}`,
        indent,
    );
    addText(
        `Saldo Actual: ${formatCurrency(data?.ar?.currentBalance)}`,
        indent,
    );
    addText(
        `Frecuencia de Pago: ${data?.ar?.paymentFrequency || 'N/A'}`,
        indent,
    );
    addText(`Próximo Pago: ${formatDate(data?.ar?.paymentDate)}`, indent);
    yPos += 5;

    // Tabla de Cuotas
    doc.autoTable({
        startY: yPos,
        head: [['Nº', 'Vencimiento', 'Monto', 'Saldo', 'Estado']],
        body:
            data?.installments?.map((item, index) => [
                index + 1,
                formatDate(item.installmentDate),
                formatCurrency(item.installmentAmount),
                formatCurrency(item.installmentBalance),
                item.isActive ? 'Activa' : 'Pagada',
            ]) || [],
        theme: 'striped',
        headStyles: { fillColor: [71, 85, 105] },
        styles: { fontSize: 8 },
        margin: { top: 15, right: margin, left: margin },
    });

    // Tabla de Pagos
    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Fecha', 'Cuota', 'Monto', 'Método de Pago', 'Usuario']],
        body:
            data?.payments?.map((payment) => [
                formatDate(payment.createdAt),
                payment.installmentNumber,
                formatCurrency(
                    payment.paymentDetails?.totalPaid || payment.paymentAmount,
                ),
                payment.paymentDetails?.paymentMethods
                    ?.filter((m) => m.status && m.value > 0)
                    .map((m) => `${m.method}: ${formatCurrency(m.value)}`)
                    .join(', '),
                payment.user?.displayName || payment.createdBy,
            ]) || [],
        theme: 'striped',
        headStyles: { fillColor: [71, 85, 105] },
        styles: { fontSize: 8 },
        margin: { top: 15, right: margin, left: margin },
    });

    // Pie de página
    const pageCount = doc.internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(128);
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(
            `Página ${i} de ${pageCount}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' },
        );
    }

    doc.save(
        `CxC_${data?.client?.name || 'Cliente'}_${data?.invoice?.numberID || 'NA'}.pdf`,
    );
};
