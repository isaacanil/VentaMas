import { message } from 'antd';
import { useState } from 'react';
import { useSelector } from 'react-redux';

import { selectBusinessData } from '../../features/auth/businessSlice';
import { generateCreditNoteLetterPdf } from '../../pdf/creditNote/templates/template1/CreditNoteLetterPdf';
import { printPdfBase64 } from '../../utils/printPdf';

export const useCreditNotePDF = () => {
  const business = useSelector(selectBusinessData);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handlePrintPdf = async (creditNoteData) => {
    // Validación más específica
    if (!creditNoteData) {
      console.error('❌ No hay datos de la nota de crédito');
      message.error('No hay datos de la nota de crédito.');
      return;
    }

    if (!business) {
      console.error('❌ No hay datos del negocio');
      message.error('No hay datos del negocio.');
      return;
    }

    // Validar campos críticos de la nota de crédito
    const missingFields = [];
    if (
      !creditNoteData.items ||
      !Array.isArray(creditNoteData.items) ||
      creditNoteData.items.length === 0
    ) {
      missingFields.push('items (productos)');
    }
    if (!creditNoteData.client) {
      missingFields.push('client (cliente)');
    }
    if (!creditNoteData.createdAt) {
      missingFields.push('createdAt (fecha)');
    }
    if (
      creditNoteData.totalAmount === undefined ||
      creditNoteData.totalAmount === null
    ) {
      missingFields.push('totalAmount (monto total)');
    }

    if (missingFields.length > 0) {
      console.error('❌ Faltan campos críticos:', missingFields);
      console.error('❌ Estructura actual:', Object.keys(creditNoteData));
      message.error(`Faltan datos críticos: ${missingFields.join(', ')}`);
      return;
    }

    // Validar estructura de items
    const itemsWithoutPricing = creditNoteData.items.filter(
      (item) => !item.pricing,
    );
    if (itemsWithoutPricing.length > 0) {
      console.warn('⚠️ Algunos items no tienen pricing:', itemsWithoutPricing);
    }

    setPdfLoading(true);

    try {
      const pdfBase64 = await generateCreditNoteLetterPdf(
        business,
        creditNoteData,
      );

      // Cross-platform print helper with mobile fallback
      printPdfBase64(pdfBase64);
    } catch (error) {
      console.error('❌ Error al generar el PDF para imprimir:', error);
      console.error('Stack trace:', error.stack);
      message.error('No se pudo generar el PDF.');
    } finally {
      setPdfLoading(false);
    }
  };

  return {
    pdfLoading,
    handlePrintPdf,
  };
};
