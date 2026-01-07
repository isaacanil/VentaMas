// @ts-nocheck
import { FileTextOutlined } from '@ant-design/icons';
import { Badge } from 'antd';
import React from 'react';

import { SectionTitle, TableCard } from '@/views/component/modals/ARInfoModal/styles';
import { formatCurrency, formatDate } from '@/views/component/modals/ARInfoModal/utils';

const InstallmentSchedule = ({ data }) => {
    const installments = data?.installments || [];
    const totalInstallments = installments.length;

    return (
        <>
            <SectionTitle>
                <FileTextOutlined />
                Cronograma de Cuotas
            </SectionTitle>

            <TableCard>
                <div className="table-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FileTextOutlined /> Detalle de cuotas
                    </div>
                    <span style={{ color: '#8c8c8c', fontSize: 12, fontWeight: 400 }}>
                        {totalInstallments} cuotas
                    </span>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Vencimiento</th>
                            <th className="numeric">Monto</th>
                            <th className="numeric">Saldo</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {installments.length ? (
                            installments.map((inst, index) => {
                                const statusActive = (inst.installmentBalance || 0) > 0;
                                return (
                                    <tr key={inst.id || index}>
                                        <td>{index + 1}</td>
                                        <td>{formatDate(inst.installmentDate)}</td>
                                        <td className="numeric">
                                            {formatCurrency(inst.installmentAmount)}
                                        </td>
                                        <td className="numeric">
                                            {formatCurrency(inst.installmentBalance)}
                                        </td>
                                        <td>
                                            <Badge
                                                status={statusActive ? 'processing' : 'success'}
                                                text={statusActive ? 'Activa' : 'Pagada'}
                                            />
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td
                                    colSpan={5}
                                    style={{
                                        textAlign: 'center',
                                        color: '#8c8c8c',
                                        padding: 24,
                                    }}
                                >
                                    Sin cuotas registradas
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </TableCard>
        </>
    );
};

export default InstallmentSchedule;
