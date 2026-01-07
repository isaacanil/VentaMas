// @ts-nocheck
import { CalendarOutlined } from '@ant-design/icons';
import { Button, Modal, List, Calendar, Badge } from 'antd';
import { DateTime } from 'luxon';
import React, { useState } from 'react';
import styled from 'styled-components';

const PaymentDatesOverview = ({
  paymentDates,
  nextPaymentDate,
  frequency,
  installments,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'list' ? 'calendar' : 'list');
  };

  // Formatear fechas para la vista de lista
  const formattedDates = paymentDates.map((date, index) => ({
    key: index,
    date: DateTime.fromMillis(date).toFormat('dd/MM/yyyy'),
    dateObj: DateTime.fromMillis(date),
    isNext: date === nextPaymentDate,
  }));

  // Función para renderizar datos en el calendario
  const dateCellRender = (value) => {
    const dateMillis = value.valueOf();
    const matchingDates = formattedDates.filter((item) => {
      const startOfDay = item.dateObj.startOf('day').toMillis();
      return (
        startOfDay === DateTime.fromMillis(dateMillis).startOf('day').toMillis()
      );
    });

    if (matchingDates.length > 0) {
      const isNextPayment = matchingDates.some((date) => date.isNext);
      return (
        <Badge
          status={isNextPayment ? 'processing' : 'success'}
          text={
            isNextPayment ? 'Próximo pago' : `Pago #${matchingDates[0].key + 1}`
          }
        />
      );
    }
    return null;
  };

  // Determinar el término según la frecuencia de pago
  const getFrequencyTerm = () => {
    switch (frequency) {
      case 'monthly':
        return 'mensual';
      case 'weekly':
        return 'semanal';
      case 'annual':
        return 'anual';
      default:
        return '';
    }
  };

  return (
    <>
      <ViewButton
        type="primary"
        icon={<CalendarOutlined />}
        onClick={showModal}
      >
        Ver fechas de pago
      </ViewButton>

      <Modal
        title={`Plan de pagos ${getFrequencyTerm()} (${installments} cuotas)`}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="viewToggle" onClick={toggleViewMode}>
            {viewMode === 'list' ? 'Ver calendario' : 'Ver lista'}
          </Button>,
          <Button key="close" type="primary" onClick={handleCancel}>
            Cerrar
          </Button>,
        ]}
        width={viewMode === 'calendar' ? 800 : 500}
      >
        {viewMode === 'list' ? (
          <List
            dataSource={formattedDates}
            renderItem={(item, index) => (
              <List.Item>
                <ListItemContent isNext={item.isNext}>
                  <span className="payment-number">Pago #{index + 1}</span>
                  <span className="payment-date">{item.date}</span>
                  {item.isNext && (
                    <NextPaymentBadge>Próximo pago</NextPaymentBadge>
                  )}
                </ListItemContent>
              </List.Item>
            )}
          />
        ) : (
          <Calendar dateCellRender={dateCellRender} />
        )}
      </Modal>
    </>
  );
};

const ViewButton = styled(Button)`
  width: 100%;
  margin-top: 10px;
`;

const ListItemContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 5px 10px;
  background-color: ${(props) => (props.isNext ? '#e6f7ff' : 'transparent')};
  border-radius: 4px;

  .payment-number {
    font-weight: ${(props) => (props.isNext ? 'bold' : 'normal')};
  }

  .payment-date {
    color: #555;
  }
`;

const NextPaymentBadge = styled.span`
  padding: 2px 8px;
  font-size: 12px;
  color: white;
  background-color: #1890ff;
  border-radius: 10px;
`;

export default PaymentDatesOverview;
