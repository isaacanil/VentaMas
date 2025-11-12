import { Modal, Tag, Table, Typography, Spin } from 'antd';
import { useState } from 'react'
import styled from 'styled-components'

import { PillButton } from '../../../../../../../../../component/PillButton/PillButton';

const { Title, Text } = Typography;

export const ViewExpenses = ({ loading = false, expenses = [] }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const columns = [
        {
            title: 'Descripción',
            dataIndex: ['description'],
            key: 'description',
            width: '40%',
        },
        {
            title: 'Categoría',
            dataIndex: ['category'],
            key: 'category',
            width: '20%',
            render: (category) => <Tag color="blue">{category}</Tag>
        },
        {
            title: 'Método de Pago',
            dataIndex: ['payment', 'method'],
            key: 'paymentMethod',
            width: '20%',
            render: (method) => {
                const methods = {
                    'open_cash': 'Efectivo de Caja',
                    'cash': 'Efectivo',
                    'credit_card': 'Tarjeta',
                    'check': 'Cheque',
                    'bank_transfer': 'Transferencia'
                };
                return methods[method] || method;
            }
        },
        {
            title: 'Monto',
            dataIndex: ['amount'],
            key: 'amount',
            width: '20%',
            render: (amount) => <Text strong>RD$ {parseFloat(amount).toFixed(2)}</Text>
        }
    ];

    const totalExpenses = expenses.reduce((acc, curr) => {
        return acc + parseFloat(curr.amount || 0);
    }, 0);
    return (
        <Container>
            <PillButton
                onClick={handleOpenModal}
                loading={loading}
                disabled={!expenses.length}
                badgeCount={expenses.length}
            >
                Gastos 
            </PillButton>

            <Modal
                title="Gastos Registrados"
                open={isModalOpen}
                onCancel={handleCloseModal}
                footer={null}
                width={800}
            >
                {loading ? (
                    <LoadingContainer>
                        <Spin size="large" />
                        <p>Cargando gastos...</p>
                    </LoadingContainer>
                ) : (
                    <>
                        <Table
                            dataSource={expenses}
                            columns={columns}
                            rowKey="id"
                            pagination={false}
                            scroll={{ y: 300 }}
                        />

                        <TotalContainer>
                            <Title level={4}>Total Gastos: RD$ {totalExpenses.toFixed(2)}</Title>
                        </TotalContainer>
                    </>
                )}
            </Modal>
        </Container>
    )
}

const Container = styled.div`
`

const TotalContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f7f7f7;
  border-radius: 0.4em;
`

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  
  p {
    margin-top: 1rem;
  }
`
