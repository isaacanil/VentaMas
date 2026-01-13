import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { MenuProps } from 'antd';
import { message, Button, Dropdown } from 'antd';
import { useState } from 'react';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import { createProfessionalReportCallback } from '@/hooks/exportToExcel/exportConfig';
import { formatBill } from '@/hooks/exportToExcel/formatBill';
import exportToExcel from '@/hooks/exportToExcel/useExportToExcel';
import type { CashCountInvoice } from '@/utils/cashCount/types';

type ExportType = 'Resumen' | 'Detailed';

interface ExportInvoiceProps {
  invoices?: CashCountInvoice[];
}

export const ExportInvoice = ({ invoices = [] }: ExportInvoiceProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const transformedResumenBillsData = () =>
    invoices.map((invoice) => {
      const data = invoice?.data ?? invoice;
      return formatBill({ data, type: 'Resumen' }) as Record<string, unknown>;
    });

  const transformedDetailedBillsData = () =>
    formatBill({ data: invoices, type: 'Detailed' }) as Record<
      string,
      unknown
    >[];

  const handleExportButton = async (type: ExportType) => {
    if (invoices.length === 0) {
      message.error('No hay Facturas para exportar');
      return;
    }

    setIsExporting(true);

    try {
      // Delay mínimo para mostrar el loading
      const exportPromise = (async () => {
        switch (type) {
          case 'Resumen': {
            const resumenCallback = createProfessionalReportCallback(
              'Resumen',
              'REPORTE DE CONCILIACIÓN - RESUMEN',
            );
            await exportToExcel(
              transformedResumenBillsData(),
              'Conciliación Resumen',
              'conciliacion_resumen.xlsx',
              resumenCallback,
            );
            return 'El reporte resumen se ha generado correctamente';
          }
          case 'Detailed': {
            const detailedCallback = createProfessionalReportCallback(
              'Detailed',
              'REPORTE DE CONCILIACIÓN - DETALLE',
            );
            await exportToExcel(
              transformedDetailedBillsData(),
              'Conciliación Detalle',
              'conciliacion_detalle.xlsx',
              detailedCallback,
            );
            return 'El reporte detallado se ha generado correctamente';
          }
          default:
            return 'Exportación completada';
        }
      })(); // Asegurar un delay mínimo de 1 segundo para ver el loading
      const [result] = await Promise.all([
        exportPromise,
        new Promise((resolve) => setTimeout(resolve, 1000)),
      ]);

      message.success(result);
    } catch (error) {
      console.error('Error al exportar:', error);
      message.error(
        'Hubo un problema al generar el archivo Excel. Inténtelo nuevamente.',
      );
    } finally {
      setIsExporting(false);
    }
  };

  const items: MenuProps['items'] = [
    {
      key: 'detailed',
      label: 'Exportar Detalle',
      onClick: () => handleExportButton('Detailed'),
      disabled: isExporting,
    },
    {
      key: 'resumen',
      label: 'Exportar Resumen',
      onClick: () => handleExportButton('Resumen'),
      disabled: isExporting,
    },
  ];

  return (
    <Container>
      <Group>
        <Dropdown
          menu={{ items }}
          placement="bottomRight"
          disabled={isExporting}
        >
          <Button
            icon={
              isExporting ? (
                <SpinningIcon icon={faSpinner} style={{ marginRight: 4 }} />
              ) : (
                icons.arrows.chevronDown
              )
            }
            disabled={isExporting}
          >
            {isExporting ? 'Generando...' : 'Exportar'}
          </Button>
        </Dropdown>
      </Group>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  gap: 1em;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 1300px;
  height: 3em;
  margin: 0 auto;
`;

const Group = styled.div`
  display: flex;
  gap: 1em;
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
