import {
  faListAlt,
  faTable,
  faSpinner,
  faChartPie,
  faDownload,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { message, Button } from 'antd';
import { DateTime } from 'luxon';
import { useState } from 'react';
import { useMatch, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { createProfessionalReportCallback } from '@/utils/export/excel/exportConfig';
import { formatBill } from '@/utils/export/excel/formatBill';
import exportToExcel from '@/utils/export/excel/useExportToExcel';
import useViewportWidth from '@/hooks/useViewportWidth';
import routesName from '@/router/routes/routesName';
import { DropdownMenu } from '@/components/ui/DropdownMenu';

import type { ToolbarComponentProps } from '@/modules/navigation/components/MenuApp/GlobalMenu/types';
import type { InvoiceData } from '@/types/invoice';

type InvoiceLike = { data?: InvoiceData } & Record<string, unknown>;

interface RegistroToolbarProps extends ToolbarComponentProps {
  data?: InvoiceLike[];
}

type ExportType = 'Resumen' | 'Detailed';

export const RegistroToolbar = ({
  side = 'left',
  data,
}: RegistroToolbarProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const navigate = useNavigate();
  const { BILLS } = routesName.SALES_TERM;
  const matchWithCashReconciliation = useMatch(BILLS);
  const invoices = (data ?? []) as InvoiceLike[];
  const currentDate = DateTime.now().toFormat('ddMMyyyy');
  const vw = useViewportWidth();
  const isMobile = vw <= 768;

  const transformedResumenBillsData = () =>
    invoices.map(
      (invoice) =>
        formatBill({ data: invoice.data, type: 'Resumen' }) as Record<
          string,
          unknown
        >,
    );

  const transformedDetailedBillsData = () =>
    formatBill({ data: invoices, type: 'Detailed' }) as Record<
      string,
      unknown
    >[];
  const handleExportButton = (type: ExportType) => {
    if (invoices.length === 0) {
      message.error('No hay Facturas para exportar');
      return;
    }

    setIsExporting(true);

    let exportPromise: Promise<string>;
    switch (type) {
      case 'Resumen': {
        const resumenCallback = createProfessionalReportCallback(
          'Resumen',
          'REPORTE DE FACTURACIÓN - RESUMEN',
        );
        exportPromise = exportToExcel(
          transformedResumenBillsData(),
          'Resumen de Facturas',
          `resumen_facturas_${currentDate}.xlsx`,
          resumenCallback,
        ).then(() => 'El reporte resumen se ha generado correctamente');
        break;
      }
      case 'Detailed': {
        const detailedCallback = createProfessionalReportCallback(
          'Detailed',
          'REPORTE DE FACTURACIÓN - DETALLE POR PRODUCTO',
        );
        exportPromise = exportToExcel(
          transformedDetailedBillsData(),
          'Detalle de Facturas',
          `detalle_facturas_${currentDate}.xlsx`,
          detailedCallback,
        ).then(() => 'El reporte detallado se ha generado correctamente');
        break;
      }
      default:
        exportPromise = Promise.resolve('Exportación completada');
    }

    void Promise.all([
      exportPromise,
      new Promise((resolve) => setTimeout(resolve, 1000)),
    ]).then(
      ([result]) => {
        message.success(result);
        setIsExporting(false);
      },
      (error) => {
        console.error('Error al exportar:', error);
        message.error(
          'Hubo un problema al generar el archivo Excel. Inténtelo nuevamente.',
        );
        setIsExporting(false);
      },
    );
  };
  const options = [
    {
      text: isExporting ? 'Generando resumen...' : 'Resumen de Factura',
      description:
        'Obtén un resumen consolidado que incluye información general del cliente, totales y métodos de pago.',
      icon: isExporting ? (
        <SpinningIcon icon={faSpinner} />
      ) : (
        <FontAwesomeIcon icon={faListAlt} />
      ),
      action: () => handleExportButton('Resumen'),
      disabled: isExporting,
    },
    {
      text: isExporting ? 'Generando detalle...' : 'Detalle de Factura',
      description:
        'Accede a un desglose detallado con información de cada producto vendido, categorías, precios y cantidades.',
      icon: isExporting ? (
        <SpinningIcon icon={faSpinner} />
      ) : (
        <FontAwesomeIcon icon={faTable} />
      ),
      action: () => handleExportButton('Detailed'),
      disabled: isExporting,
    },
  ];
  return matchWithCashReconciliation ? (
    <Container>
      {side === 'right' && (
        <>
          <Button
            icon={<FontAwesomeIcon icon={faChartPie} />}
            onClick={() => navigate(routesName.SALES_TERM.BILLS_ANALYTICS)}
          >
            {isMobile ? 'Gráficos' : 'Gráfico de ventas'}
          </Button>
          <DropdownMenu
            title={isMobile ? 'Exportar' : 'Exportar'}
            icon={<FontAwesomeIcon icon={faDownload} />}
            options={options}
          />
        </>
      )}
    </Container>
  ) : null;
};

const Container = styled.div`
  display: flex;
  gap: 0.4rem;
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
