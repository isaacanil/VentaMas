import { BankOutlined, FileExcelOutlined } from '@ant-design/icons';
import { Button, message } from 'antd';
import { DateTime } from 'luxon';
import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useMatch } from 'react-router-dom';
import styled from 'styled-components';

import { selectUser } from '../../../../../../features/auth/userSlice';
import { useListenAccountsReceivable } from '../../../../../../firebase/accountsReceivable/accountReceivableServices';
import {
  applyProfessionalStyling,
  addTotalsRow,
  addReportHeader,
  formatCurrencyColumns,
} from '../../../../../../hooks/exportToExcel/exportConfig';
import exportToExcel from '../../../../../../hooks/exportToExcel/useExportToExcel';
import useBusiness from '../../../../../../hooks/useBusiness';
import DateUtils from '../../../../../../utils/date/dateUtils';
import { getDateRange } from '../../../../../../utils/date/getDateRange';

import { MultiPaymentModal } from './components/MultiPaymentModal/MultiPaymentModal';

export const AccountReceivableToolbar = ({ side = 'left', data }) => {
  const matchWithAccountsReceivable = useMatch('/account-receivable/list');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const user = useSelector(selectUser);
  const { isPharmacy } = useBusiness();

  // Usar un periodo de tiempo por defecto (últimos 30 días)
  const [datesSelected] = useState(getDateRange('last30Days'));

  // Obtener las cuentas por cobrar para mostrar en el modal
  const { accountsReceivable: accounts } = useListenAccountsReceivable(
    user,
    datesSelected,
  );

  // Derivar processedAccounts durante el render usando useMemo
  const processedAccounts = useMemo(() => {
    if (!isPharmacy || !accounts) {
      return [];
    }

    // Procesar y formatear las cuentas para el modal
    const processed = accounts.map((account) => {
      const invoiceData = account?.invoice?.data;
      const client = account?.client || {};
      const paymentMethods = invoiceData?.paymentMethod || [];

      // Calcular total pagado
      const totalPaid = paymentMethods.reduce((sum, method) => {
        return method.status ? sum + method.value : sum;
      }, 0);

      // Convertir Timestamp a milisegundos para el campo date
      const dateInMillis = account?.createdAt
        ? DateUtils.convertTimestampToMillis(account.createdAt)
        : null;

      return {
        ncf: invoiceData?.NCF || 'N/A',
        invoiceNumber: invoiceData?.numberID || 'N/A',
        client: client?.name || 'Cliente Genérico',
        rnc: client?.personalID,
        insurance:
          invoiceData?.insurance?.name ||
          account?.account?.insurance?.name ||
          'N/A',
        hasInsurance: !!(
          invoiceData?.insurance?.name || account?.account?.insurance?.name
        ),
        date: dateInMillis, // Timestamp convertido a milisegundos
        lastPaymentDate: account?.lastPaymentDate || null,
        initialAmount: account?.initialAmountAr || 0,
        totalPaid: totalPaid,
        balance: account?.balance || 0,
        total: invoiceData?.totalPurchase?.value || 0,
        ver: { account },
        actions: { account },
        type: account?.account?.type || 'normal',
      };
    });

    // Filtrar solo las cuentas de tipo 'insurance' (aseguradora)
    return processed.filter(
      (account) => account.type === 'insurance' || account.hasInsurance,
    );
  }, [accounts, isPharmacy]);

  const buildExportRows = (rows = []) => {
    // Determinar si debemos incluir la columna de Aseguradora
    const includeInsurance = rows.some(
      (r) => r?.type === 'insurance' || r?.hasInsurance,
    );

    return rows.map((row) => {
      // Soportar Timestamp de Firestore o milisegundos
      let createdAtDate;
      if (row?.date?.seconds) {
        createdAtDate = DateTime.fromMillis(row.date.seconds * 1000);
      } else if (typeof row?.date === 'number') {
        createdAtDate = DateTime.fromMillis(row.date);
      } else {
        createdAtDate = null;
      }

      const lastPay = row?.lastPaymentDate?.seconds
        ? DateTime.fromMillis(row.lastPaymentDate.seconds * 1000)
        : null;

      const base = {
        Cliente: row?.client || 'N/A',
        'Cédula/RNC': row?.rnc || '',
        Factura: row?.invoiceNumber || 'N/A',
        Fecha: createdAtDate
          ? createdAtDate.toFormat('dd/MM/yyyy HH:mm')
          : 'N/A',
        'Monto inicial': Number(row?.initialAmount || 0),
        'Último pago': lastPay
          ? lastPay.toFormat('dd/MM/yyyy HH:mm')
          : 'Sin pagos',
        'Total pagado': Number(row?.totalPaid || 0),
        Balance: Number(row?.balance || 0),
      };

      if (includeInsurance) {
        return {
          Aseguradora: row?.insurance || 'N/A',
          ...base,
        };
      }
      return base;
    });
  };

  const handleExportExcel = async () => {
    try {
      // Preferimos los datos del listado (exactamente lo que ve el usuario)
      const source =
        Array.isArray(data) && data.length > 0 ? data : processedAccounts;
      if (!source || source.length === 0) {
        message.error('No hay cuentas por cobrar para exportar');
        return;
      }

      const rows = buildExportRows(source);
      const sheetName = 'Cuentas por cobrar';
      const fileName = `cuentas_por_cobrar_${DateTime.now().toFormat('ddMMyyyy')}.xlsx`;

      const onBeforeExport = (ws, exportData, columns) => {
        addReportHeader(ws, 'REPORTE DE CUENTAS POR COBRAR');
        applyProfessionalStyling(ws, exportData.length);
        // Re-estilizar la fila de encabezados que queda en la fila 4
        const head = ws.getRow(4);
        head.height = 35;
        head.font = { bold: true, color: { argb: 'FF333333' }, size: 12 };
        head.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF5F5F5' },
        };
        head.alignment = { vertical: 'middle', horizontal: 'center' };

        // Formatear columnas monetarias
        const moneyCols = ['Monto inicial', 'Total pagado', 'Balance'];
        formatCurrencyColumns(ws, columns, moneyCols);
        // Totales
        addTotalsRow(ws, exportData, columns, moneyCols, 'TOTALES');
      };

      await exportToExcel(rows, sheetName, fileName, onBeforeExport);
      message.success('Exportación completada');
    } catch (err) {
      console.error(err);
      message.error('No se pudo exportar el Excel');
    }
  };

  const handleOpenMultiPayment = () => {
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  return matchWithAccountsReceivable ? (
    <Container>
      {side === 'right' && (
        <>
          <Button
            onClick={handleExportExcel}
            icon={<FileExcelOutlined />}
          >
            Exportar Excel
          </Button>
          {isPharmacy && (
            <>
              <Button
                type="primary"
                icon={<BankOutlined />}
                onClick={handleOpenMultiPayment}
              >
                Pago múltiple de aseguradoras
              </Button>
              <MultiPaymentModal
                visible={isModalVisible}
                onCancel={handleCloseModal}
                accounts={processedAccounts}
              />
            </>
          )}
        </>
      )}
    </Container>
  ) : null;
};

const Container = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;
