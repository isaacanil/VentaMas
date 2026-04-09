import type { TableColumnsType } from 'antd';
import { Modal, Tag, Table, Typography, Spin } from 'antd';
import { useState } from 'react';
import styled from 'styled-components';

import type { CashCountExpense } from '@/utils/cashCount/types';
import { PillButton } from '@/components/common/PillButton/PillButton';

const { Title, Text } = Typography;

interface ViewExpensesProps {
  loading?: boolean;
  expenses?: CashCountExpense[];
}

const EMPTY_CASH_COUNT_EXPENSES: CashCountExpense[] = [];

const paymentMethodLabels: Record<string, string> = {
  open_cash: 'Efectivo de Caja',
  cash: 'Efectivo',
  credit_card: 'Tarjeta',
  check: 'Cheque',
  bank_transfer: 'Transferencia',
};

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

export const ViewExpenses = ({
  loading = false,
  expenses = EMPTY_CASH_COUNT_EXPENSES,
}: ViewExpensesProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const columns: TableColumnsType<CashCountExpense> = [
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
      render: (category: CashCountExpense['category']) => (
        <Tag color="blue">{category}</Tag>
      ),
    },
    {
      title: 'Método de Pago',
      dataIndex: ['payment', 'method'],
      key: 'paymentMethod',
      width: '20%',
      render: (method?: string) => {
        const key = typeof method === 'string' ? method : '';
        return paymentMethodLabels[key] || key;
      },
    },
    {
      title: 'Monto',
      dataIndex: ['amount'],
      key: 'amount',
      width: '20%',
      render: (amount: CashCountExpense['amount']) => (
        <Text strong>RD$ {toNumber(amount).toFixed(2)}</Text>
      ),
    },
  ];

  const totalExpenses = expenses.reduce((acc, curr) => {
    return acc + toNumber(curr.amount);
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
              <Title level={4}>
                Total Gastos: RD$ {totalExpenses.toFixed(2)}
              </Title>
            </TotalContainer>
          </>
        )}
      </Modal>
    </Container>
  );
};

const Container = styled.div``;

const TotalContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 1rem;
  margin-top: 1rem;
  background-color: #f7f7f7;
  border-radius: 0.4em;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;

  p {
    margin-top: 1rem;
  }
`;
