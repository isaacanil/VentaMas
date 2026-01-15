import { PlusOutlined } from '@/constants/icons/antd';
import {
  faListAlt,
  faTable,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, message, Modal } from 'antd';
import { DateTime } from 'luxon';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useMatch, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { openCreditNoteModal } from '@/features/creditNote/creditNoteModalSlice';
import { selectTaxReceiptEnabled } from '@/features/taxReceipt/taxReceiptSlice';
import { useFbGetTaxReceipt } from '@/firebase/taxReceipt/fbGetTaxReceipt';
import { createProfessionalCreditNoteReportCallback } from '@/hooks/exportToExcel/exportConfig';
import { formatCreditNote } from '@/hooks/exportToExcel/formatCreditNote';
import exportToExcel from '@/hooks/exportToExcel/useExportToExcel';
import { DropdownMenu } from '@/components/ui/DropdownMenu/DropdowMenu';
import type { ToolbarComponentProps } from '@/modules/navigation/components/MenuApp/GlobalMenu/types';
import type { TaxReceiptItem, TaxReceiptData } from '@/types/taxReceipt';

type CreditNoteRecord = Record<string, unknown>;

interface CreditNoteToolbarProps extends ToolbarComponentProps {
  data?: CreditNoteRecord[];
}

const resolveReceiptData = (
  receipt: TaxReceiptItem | null | undefined,
): TaxReceiptData | null => {
  if (!receipt) return null;
  if (typeof receipt === 'object' && 'data' in receipt) {
    return receipt.data ?? null;
  }
  return receipt ?? null;
};

export const CreditNoteToolbar = ({
  side = 'left',
  data,
}: CreditNoteToolbarProps) => {
  const matchWithCreditNote = useMatch('/credit-note');
  const dispatch = useDispatch();
  const [isExporting, setIsExporting] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const navigate = useNavigate();
  const { taxReceipt } = useFbGetTaxReceipt() as {
    taxReceipt?: TaxReceiptItem[];
  };
  const taxReceiptEnabled = useSelector(selectTaxReceiptEnabled) as boolean;

  const creditNotes = (data ?? []) as CreditNoteRecord[];
  const currentDate = DateTime.now().toFormat('ddMMyyyy');

  const creditNoteReceipt = taxReceipt?.find((receipt) => {
    const data = resolveReceiptData(receipt);
    const name = data?.name?.toLowerCase() ?? '';
    return (
      (name.includes('nota') && name.includes('crédito')) ||
      data?.serie === '04'
    );
  });

  const isCreditNoteReceiptConfigured = Boolean(
    creditNoteReceipt && !resolveReceiptData(creditNoteReceipt)?.disabled,
  );

  // Mostrar botones solo si los comprobantes están habilitados Y el de serie 04 está configurado
  const showCreditNoteActions =
    taxReceiptEnabled && isCreditNoteReceiptConfigured;

  const handleCreateNew = () => {
    if (!taxReceiptEnabled || !isCreditNoteReceiptConfigured) {
      setShowConfigModal(true);
      return;
    }
    dispatch(openCreditNoteModal({ mode: 'create' }));
  };

  const transformedResumenCreditNotesData = () => {
    return formatCreditNote({ data: creditNotes, type: 'Resumen' });
  };

  const transformedDetailedCreditNotesData = () => {
    return formatCreditNote({ data: creditNotes, type: 'Detailed' });
  };

  const handleExportButton = async (type: string) => {
    if (creditNotes.length === 0) {
      message.error('No hay Notas de Crédito para exportar');
      return;
    }

    setIsExporting(true);

    try {
      // Delay mínimo para mostrar el loading
      const exportPromise = (async () => {
        switch (type) {
          case 'Resumen': {
            const resumenCallback = createProfessionalCreditNoteReportCallback(
              'Resumen',
              'REPORTE DE NOTAS DE CRÉDITO - RESUMEN',
            );
            await (exportToExcel as any)(
              transformedResumenCreditNotesData(),
              'Resumen de Notas de Crédito',
              `resumen_notas_credito_${currentDate}.xlsx`,
              resumenCallback,
            );
            return 'El reporte resumen de notas de crédito se ha generado correctamente';
          }
          case 'Detailed': {
            const detailedCallback = createProfessionalCreditNoteReportCallback(
              'Detailed',
              'REPORTE DE NOTAS DE CRÉDITO - DETALLE POR PRODUCTO',
            );
            await (exportToExcel as any)(
              transformedDetailedCreditNotesData(),
              'Detalle de Notas de Crédito',
              `detalle_notas_credito_${currentDate}.xlsx`,
              detailedCallback,
            );
            return 'El reporte detallado de notas de crédito se ha generado correctamente';
          }
          default:
            return 'Exportación completada';
        }
      })();

      // Asegurar un delay mínimo de 1 segundo para ver el loading
      const [result] = await Promise.all([
        exportPromise,
        new Promise((resolve) => setTimeout(resolve, 1000)),
      ]);

      message.success(result);
    } catch (error) {
      console.error('Error al exportar notas de crédito:', error);
      message.error(
        'Hubo un problema al generar el archivo Excel. Inténtelo nuevamente.',
      );
    } finally {
      setIsExporting(false);
    }
  };

  const exportOptions = [
    {
      text: isExporting
        ? 'Generando resumen...'
        : 'Resumen de Notas de Crédito',
      description:
        'Obtén un resumen consolidado que incluye información general del cliente, totales y estados.',
      icon: isExporting ? (
        <SpinningIcon icon={faSpinner} />
      ) : (
        <FontAwesomeIcon icon={faListAlt} />
      ),
      action: () => handleExportButton('Resumen'),
      disabled: isExporting,
    },
    {
      text: isExporting
        ? 'Generando detalle...'
        : 'Detalle de Notas de Crédito',
      description:
        'Accede a un desglose detallado con información de cada producto en las notas de crédito.',
      icon: isExporting ? (
        <SpinningIcon icon={faSpinner} />
      ) : (
        <FontAwesomeIcon icon={faTable} />
      ),
      action: () => handleExportButton('Detailed'),
      disabled: isExporting,
    },
  ];

  return matchWithCreditNote ? (
    <>
      <Container>
        {side === 'right' && (
          <>
            {showCreditNoteActions && (
              <DropdownMenu title="Exportar Excel" options={exportOptions} />
            )}
            {showCreditNoteActions && (
              <Button
                onClick={handleCreateNew}
                icon={<PlusOutlined />}
                style={{ marginLeft: '8px' }}
              >
                Nota de Crédito
              </Button>
            )}
          </>
        )}
      </Container>

      <Modal
        open={showConfigModal}
        onCancel={() => setShowConfigModal(false)}
        onOk={() => {
          setShowConfigModal(false);
          navigate('/settings/general-config-tax-receipt');
        }}
        okText="Configurar ahora"
        cancelText="Cerrar"
        title="Configuración requerida"
      >
        {!taxReceiptEnabled ? (
          <>
            Los comprobantes fiscales están deshabilitados en la configuración.
            Para crear notas de crédito necesitas habilitar los comprobantes
            fiscales y configurar el comprobante correspondiente (serie 04).
          </>
        ) : (
          <>
            Para crear notas de crédito necesitas configurar el comprobante
            fiscal correspondiente (serie 04).
          </>
        )}
      </Modal>
    </>
  ) : null;
};

const Container = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const SpinningIcon = styled(FontAwesomeIcon)`
  animation: spin 1s linear infinite;

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
  }
`;

