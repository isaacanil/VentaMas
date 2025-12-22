import { CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import React from 'react';

import { SectionTitle, TableCard, HighlightCard } from '../styles';
import { formatCurrency, formatDate } from '../utils';

const PaymentHistory = ({ data }) => {
    const payments = data?.payments || [];

    const paymentMethodsText = (payment) => {
        const methods = payment?.paymentDetails?.paymentMethods || [];
        if (!methods.length) return 'N/A';

        const methodMap = {
            cash: 'Efectivo',
            card: 'Tarjeta',
            transfer: 'Transferencia',
            yape: 'Yape',
            plin: 'Plin',
            credit: 'Crédito',
            // Add other mappings as needed
        };

        return methods
            .filter((m) => m.status)
            .map((m) => methodMap[m.method?.toLowerCase()] || m.method)
            .join(', ');
    };

    return (
        <>
            <SectionTitle>
                <CalendarOutlined />
                Historial de Pagos
            </SectionTitle>

            {payments.length > 0 ? (
                <TableCard>
                    <div className="table-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <CalendarOutlined /> Pagos registrados
                        </div>
                        <span style={{ color: '#8c8c8c', fontSize: 12, fontWeight: 400 }}>
                            {payments.length} pagos
                        </span>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Cuota</th>
                                <th className="numeric">Monto</th>
                                <th>Método</th>
                                <th>Usuario</th>
                                <th>Notas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((payment, index) => {
                                const amount =
                                    payment.paymentAmount ||
                                    payment.paymentDetails?.totalPaid ||
                                    0;
                                const createdBy = payment.createdBy || 'Sistema';

                                return (
                                    <tr key={payment.id || index}>
                                        <td>{formatDate(payment.createdAt)}</td>
                                        <td>{payment.installmentNumber || '-'}</td>
                                        <td className="numeric">{formatCurrency(amount)}</td>
                                        <td>{paymentMethodsText(payment)}</td>
                                        <td>
                                            <Tooltip title={`ID: ${createdBy}`}>
                                                {createdBy === 'Sistema' ? 'Sistema' : 'Usuario'}
                                            </Tooltip>
                                        </td>
                                        <td
                                            style={{
                                                maxWidth: 200,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {payment.comments ||
                                                payment.paymentDetails?.comments ||
                                                '-'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </TableCard>
            ) : (
                <HighlightCard $bg="#f9f9f9" $border="#f0f0f0" $iconColor="#8c8c8c">
                    <div className="icon-area">
                        <ClockCircleOutlined />
                    </div>
                    <div className="content-area">
                        <div className="title">No hay pagos registrados</div>
                        <div className="subtitle">
                            Aún no se han procesado abonos para esta cuenta.
                        </div>
                    </div>
                </HighlightCard>
            )}
        </>
    );
};

export default PaymentHistory;
