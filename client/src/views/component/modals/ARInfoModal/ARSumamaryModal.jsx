// ARSummaryModal.js
import React, { useEffect, useState } from "react";
import {
  Modal,
  Card,
  Tabs,
  Badge,
  Table,
  Progress,
  Tooltip,
  Button,
  Typography,
  Spin,
  Alert,
  Space,
} from "antd";
import { PrinterOutlined, DownloadOutlined, CalendarOutlined } from "@ant-design/icons";
import styled from "styled-components";
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAccountReceivableDetails,
  selectARInfo,
  selectARLoading,
  selectARError,
  resetAR,
  selectARDetailsModal,
  setARDetailsModal
} from '../../../../features/accountsReceivable/accountsReceivableSlice'; // Ajusta la ruta según tu estructura
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { selectUser } from "../../../../features/auth/userSlice";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const StyledCard = styled(Card)`
  border-radius: 8px;
  margin-bottom: 16px;
`;
const StyledTitle = styled(Title)`
  margin-top: 10px !important;
`;
const StyledDescriptions = styled.div`
  margin-bottom: 24px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;

  .info-row {
    display: flex;
    margin-bottom: 8px;
  }

  .info-label {
    font-weight: 500;
    width: 120px;
    color: #666;
  }

  .info-value {
    flex: 1;
  }
`;

const StyledInvoiceInfo = styled(StyledDescriptions)`
  margin-top: 16px;
  background: #f0f5ff;
`;

const StyledSummaryContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-top: 24px;
`;

const InfoCard = styled.div`
  padding: 16px;
  background: ${props => props.variant === 'invoice' ? '#f0f5ff' : '#fafafa'};
  border-radius: 8px;
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .content {
    display: grid;
    gap: 12px;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    
    .label {
      color: #666;
      font-size: 12px;
      margin-bottom: 4px;
    }
    
    .value {
      font-size: 14px;
      font-weight: 500;
    }
  }
`;

const StatusTag = styled.span`
  color: ${props => props.isPaid ? '#52c41a' : props.isLate ? '#f5222d' : '#1890ff'};
  font-size: 12px;
  margin-left: 8px;
`;

const InfoValue = styled.span`
  display: flex;
  align-items: baseline;
  gap: 4px;
  
  .amount {
    font-size: 16px;
    font-weight: 600;
  }
  
  .label {
    font-size: 12px;
    color: #8c8c8c;
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 24px;
`;

export default function ARSummaryModal({ }) {
  const dispatch = useDispatch();
  const data = useSelector(selectARInfo);
  const { isOpen, arId } = useSelector(selectARDetailsModal);

  const loading = useSelector(selectARLoading);
  const error = useSelector(selectARError);
  const user = useSelector(selectUser);

  const [activeTab, setActiveTab] = useState("summary");

  // Funciones auxiliares seguras
  const formatCurrency = (value) => {
    return typeof value === 'number' ? `$${value.toFixed(2)}` : "N/A";
  };

  // Actualizar formatDate para manejar timestamps de Firestore
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    try {
      // Si es timestamp de Firestore
      if (timestamp?.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }
      // Si es timestamp normal
      return new Date(timestamp).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const calculateProgress = () => {
    const total = data?.ar?.totalReceivable || 0;
    const balance = data?.ar?.currentBalance || 0;
    return total > 0 ? Math.min(((total - balance) / total) * 100, 100) : 0;
  };

  // Configuración segura de columnas
  const installmentsColumns = [
    {
      title: "Nº Cuota",
      dataIndex: "index",
      render: (_, __, index) => (index + 1).toString()
    },
    {
      title: "Fecha de Vencimiento",
      dataIndex: "installmentDate",
      render: (date) => formatDate(date)
    },
    {
      title: "Monto",
      dataIndex: "installmentAmount",
      render: (amount) => formatCurrency(amount)
    },
    {
      title: "Saldo",
      dataIndex: "installmentBalance",
      render: (balance) => formatCurrency(balance)
    },
    {
      title: "Estado",
      dataIndex: "isActive",
      render: (isActive) => (
        <Badge
          status={isActive ? "processing" : "default"}
          text={isActive ? "Activa" : "Pagada"}
        />
      ),
    },
  ];

  // Añadir configuración de columnas para la tabla de pagos
  const paymentsColumns = [
    {
      title: "Fecha",
      dataIndex: "createdAt",
      render: (date) => formatDate(date),
    },
    {
      title: "Cuota",
      dataIndex: "installmentNumber",
    },
    {
      title: "Monto",
      dataIndex: "amount",
      render: (_, record) => formatCurrency(record.paymentDetails?.totalPaid || record.paymentAmount),
    },
    {
      title: "Método de Pago",
      dataIndex: "paymentMethods",
      render: (_, record) => {
        const methods = record.paymentDetails?.paymentMethods || [];
        return methods
          .filter(m => m.status && m.value > 0)
          .map(m => `${m.method}: ${formatCurrency(m.value)}`)
          .join(', ');
      },
    },
    {
      title: "Usuario",
      dataIndex: "user",
      render: (_, record) => record.user?.displayName || record.createdBy,
    },
    {
      title: "Comentarios",
      dataIndex: "comments",
      ellipsis: true,
    },
  ];

  useEffect(() => {
    if (user?.businessID && arId) {
      dispatch(fetchAccountReceivableDetails({ arId, businessID: user.businessID }));
    }
  }, [arId, user]);

  const handleCloseModal = () => {
    dispatch(setARDetailsModal({ isOpen: false }));
    setTimeout(() => {
      dispatch(resetAR());
    }, 300);
  };

  const renderClientInfo = () => {
    if (!data?.client) return null;

    return (
      <StyledDescriptions>
        <Title level={5}>Información del Cliente</Title>
        <div className="info-row">
          <span className="info-label">ID:</span>
          <span className="info-value">{data.client.personalID}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Teléfono:</span>
          <span className="info-value">
            {data.client.tel}
            {data.client.tel2 && ` / ${data.client.tel2}`}
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">Dirección:</span>
          <span className="info-value">{data.client.address}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Sector:</span>
          <span className="info-value">{data.client.sector}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Provincia:</span>
          <span className="info-value">{data.client.province}</span>
        </div>
      </StyledDescriptions>
    );
  };

  const renderInvoiceInfo = () => {
    if (!data?.invoice) return null;

    return (
      <StyledInvoiceInfo>
        <Title level={5}>Información de la Factura</Title>
        <div className="info-row">
          <span className="info-label">Número:</span>
          <span className="info-value">#{data.invoice.numberID}</span>
        </div>
        <div className="info-row">
          <span className="info-label">NCF:</span>
          <span className="info-value">{data.invoice.NCF}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Fecha:</span>
          <span className="info-value">{formatDate(data.invoice.date)}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Total:</span>
          <span className="info-value">{formatCurrency(data.invoice.totalPurchase?.value)}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Items:</span>
          <span className="info-value">{data.invoice.totalShoppingItems?.value}</span>
        </div>

      </StyledInvoiceInfo>
    );
  };

  // Modificar getNextPaymentInfo para verificar pagos reales
  const getNextPaymentInfo = () => {
    if (!data?.installments || !data?.ar) return { date: null, status: 'N/A' };

    // Ordenar instalments por fecha
    const sortedInstallments = [...data.installments].sort((a, b) =>
      (a.installmentDate?.seconds || 0) - (b.installmentDate?.seconds || 0)
    );

    // Encontrar la próxima cuota pendiente
    const nextPendingInstallment = sortedInstallments.find(inst =>
      inst.installmentBalance > 0
    );

    // Si no hay cuotas pendientes
    if (!nextPendingInstallment) {
      return {
        date: null,
        isPaid: true,
        isLate: false,
        status: 'COMPLETADO',
        installmentNumber: null
      };
    }

    const nextPaymentDate = new Date(nextPendingInstallment.installmentDate.seconds * 1000);
    const today = new Date();
    const isLate = nextPaymentDate < today;

    return {
      date: nextPaymentDate,
      isPaid: false,
      isLate,
    
      status: isLate ? 'ATRASADO' : 'PENDIENTE',
      installmentNumber: nextPendingInstallment.installmentNumber,
      amount: nextPendingInstallment.installmentAmount
    };
  };

  const renderSummaryInfo = () => {
    const nextPayment = getNextPaymentInfo();
    const totalAmount = data?.ar?.totalReceivable || 0;
    const initialPaidAmount = data.invoice.totalPurchase?.value - data.ar.totalReceivable;
    const remainingAmount = data?.ar?.arBalance || 0;
    const paidAmount = totalAmount - remainingAmount;

    return (
      <StyledSummaryContainer>
        <InfoCard>
          <div className="header">
            <Title level={5}>Estado de Cuenta</Title>
            <Progress type="circle" percent={calculateProgress()} width={40} />
          </div>
          <div className="content">
          <div className="info-item">
              <span className="label">Monto Inicial</span>
              <InfoValue>
                <span className="amount">{formatCurrency(initialPaidAmount)}</span>
           
              </InfoValue>
            </div>
            <div className="info-item">
              <span className="label">Monto Total del Crédito</span>
              <InfoValue>
                <span className="amount">{formatCurrency(totalAmount)}</span>
              </InfoValue>
            </div>
            <div className="info-item">
              <span className="label">Balance Actual</span>
              <InfoValue>
                <span className="amount">{formatCurrency(remainingAmount)}</span>
                {paidAmount > 0 && (
                  <span className="label">
                    (Pagado: {formatCurrency(paidAmount)})
                  </span>
                )}
              </InfoValue>
            </div>
          </div>
        </InfoCard>

        <InfoCard>
          <div className="header">
            <Title level={5}>Detalles de Pago</Title>
            <CalendarOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
          </div>
          <div className="content">
            <div className="info-item">
              <span className="label">Frecuencia</span>
              <span className="value">{data?.ar?.paymentFrequency || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="label">
                {nextPayment.status === 'COMPLETADO' ? 'Estado' : 'Próximo Pago'}
              </span>
              <span className="value">
                {nextPayment.date ? (
                  <>
                    {formatDate(nextPayment.date)}
                    {nextPayment.installmentNumber && (
                      <Text type="secondary" style={{ marginLeft: '8px' }}>
                        (Cuota {nextPayment.installmentNumber})
                      </Text>
                    )}
                    <StatusTag
                      isPaid={nextPayment.isPaid}
                      isLate={nextPayment.isLate}
                    >
                      {nextPayment.status}
                    </StatusTag>
                  </>
                ) : (
                  <StatusTag isPaid={true}>
                    {nextPayment.status}
                  </StatusTag>
                )}
              </span>
            </div>
            {nextPayment.amount && (
              <div className="info-item">
                <span className="label">Monto de Cuota</span>
                <span className="value">{formatCurrency(nextPayment.amount)}</span>
              </div>
            )}
          </div>
        </InfoCard>
      </StyledSummaryContainer>
    );
  };

  const handleDownload = () => {
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
    addText("Resumen de Cuenta por Cobrar");
    yPos += 5;

    // Información del Cliente
    doc.setFontSize(12);
    doc.setTextColor(100);
    addText("Información del Cliente");
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
    addText("Información de la Factura");
    doc.setTextColor(0);
    doc.setFontSize(10);
    addText(`Número: #${data?.invoice?.numberID || 'N/A'}`, indent);
    addText(`NCF: ${data?.invoice?.NCF || 'N/A'}`, indent);
    addText(`Fecha: ${formatDate(data?.invoice?.date)}`, indent);
    addText(`Total: ${formatCurrency(data?.invoice?.totalPurchase?.value)}`, indent);
    yPos += 5;

    // Información de la Cuenta
    doc.setFontSize(12);
    doc.setTextColor(100);
    addText("Detalles de la Cuenta");
    doc.setTextColor(0);
    doc.setFontSize(10);
    addText(`Total por Cobrar: ${formatCurrency(data?.ar?.totalReceivable)}`, indent);
    addText(`Saldo Actual: ${formatCurrency(data?.ar?.currentBalance)}`, indent);
    addText(`Frecuencia de Pago: ${data?.ar?.paymentFrequency || 'N/A'}`, indent);
    addText(`Próximo Pago: ${formatDate(data?.ar?.paymentDate)}`, indent);
    yPos += 5;

    // Tabla de Cuotas
    doc.autoTable({
      startY: yPos,
      head: [['Nº', 'Vencimiento', 'Monto', 'Saldo', 'Estado']],
      body: data?.installments?.map((item, index) => [
        index + 1,
        formatDate(item.installmentDate),
        formatCurrency(item.installmentAmount),
        formatCurrency(item.installmentBalance),
        item.isActive ? 'Activa' : 'Pagada'
      ]) || [],
      theme: 'striped',
      headStyles: { fillColor: [71, 85, 105] },
      styles: { fontSize: 8 },
      margin: { top: 15, right: margin, left: margin }
    });

    // Tabla de Pagos
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Fecha', 'Cuota', 'Monto', 'Método de Pago', 'Usuario']],
      body: data?.payments?.map(payment => [
        formatDate(payment.createdAt),
        payment.installmentNumber,
        formatCurrency(payment.paymentDetails?.totalPaid || payment.paymentAmount),
        payment.paymentDetails?.paymentMethods
          ?.filter(m => m.status && m.value > 0)
          .map(m => `${m.method}: ${formatCurrency(m.value)}`)
          .join(', '),
        payment.user?.displayName || payment.createdBy
      ]) || [],
      theme: 'striped',
      headStyles: { fillColor: [71, 85, 105] },
      styles: { fontSize: 8 },
      margin: { top: 15, right: margin, left: margin }
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
        { align: 'center' }
      );
    }

    doc.save(`CxC_${data?.client?.name || 'Cliente'}_${data?.invoice?.numberID || 'NA'}.pdf`);
  };

  // Modificar la tabla de cuotas para ordenarlas por fecha
  const sortedInstallments = React.useMemo(() => {
    if (!data?.installments) return [];

    return [...data.installments].sort((a, b) =>
      (a.installmentDate?.seconds || 0) - (b.installmentDate?.seconds || 0)
    ).map((item, index) => ({
      key: item?.id || index,
      installmentDate: item?.installmentDate?.seconds * 1000,
      installmentAmount: item?.installmentAmount,
      installmentBalance: item?.installmentBalance,
      isActive: item?.isActive,
      payments: item?.payments || []
    }));
  }, [data?.installments]);

  console.log('data', data.invoice)
  return (
    <>
      <Modal
        title="Resumen de Cuenta por Cobrar"
        open={isOpen}
        onCancel={handleCloseModal}
        footer={null}
        width={1000}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Spin size="large" />
          </div>
        ) : error ? (
          <Alert message="Error" description={error} type="error" showIcon />
        ) : data?.ar ? (
          <StyledCard
            title={
              <Space>
                {data?.client?.name || 'Cliente no disponible'}
                <Badge
                  status={data?.ar?.isActive ? "success" : "error"}
                  text={data?.ar?.isActive ? "Activa" : "Inactiva"}
                />
              </Space>
            }
          >
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              <TabPane tab="Resumen" key="summary">
                <InfoGrid>
                  {renderClientInfo()}
                  {renderInvoiceInfo()}
                </InfoGrid>
                {renderSummaryInfo()}
              </TabPane>
              <TabPane tab="Cuotas" key="installments">
                <Table
                  columns={installmentsColumns}
                  dataSource={sortedInstallments}
                  pagination={false}
                />
              </TabPane>
              <TabPane tab="Pagos" key="payments">
                <Table
                  columns={paymentsColumns}
                  dataSource={data?.payments?.map(payment => ({
                    key: payment.id || payment.paymentId,
                    ...payment,
                  })) || []}
                  pagination={false}
                  scroll={{ x: 'max-content' }}
                />
              </TabPane>
            </Tabs>
          </StyledCard>
        ) : (
          <Alert
            message="Sin datos"
            description="No se encontró información para esta cuenta por cobrar."
            type="info"
            showIcon
          />
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: '16px' }}>
          <Tooltip title="Imprimir resumen">
            <Button icon={<PrinterOutlined />} onClick={() => window.print()} />
          </Tooltip>
          <Tooltip title="Descargar resumen">
            <Button icon={<DownloadOutlined />} onClick={handleDownload} />
          </Tooltip>
        </div>
      </Modal>
    </>
  );
}
