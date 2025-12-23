import { DateTime } from 'luxon';
import React from 'react';
import { useLoaderData } from 'react-router-dom'; // Import useLoaderData
import styled from 'styled-components';

import { formatPrice } from '@/utils/format';

import { DetailSummary } from '@/views/component/DetailSummary/DetailSummary';
import Typography from '@/views/templates/system/Typografy/Typografy';


// const { Header, Content } = Layout;

const AccountReceivableInfo = () => {
  // Use useLoaderData to get the pre-fetched data
  const data = useLoaderData(); // Data is guaranteed to be available here

  const { ar, installments, payments, installmentPayments } = data; // Destructure data directly

  const formatDate = (timestamp) =>
    DateTime.fromMillis(timestamp?.seconds * 1000).toFormat('dd/MM/yyyy HH:mm');

  const accountInfo = [
    { label: 'Nombre del Cliente:', value: ar.clientId },
    { label: 'Número de Cuenta:', value: ar.numberId },
    { label: 'Fecha de Creación:', value: formatDate(ar.createdAt) },
    {
      label: 'Estado de la Cuenta:',
      value: ar.isClosed ? 'Cerrada' : 'Abierta',
    },
    { label: 'Monto Total:', value: formatPrice(ar.totalReceivable) },
    { label: 'Ultimo Monto Pagado:', value: formatPrice(ar.lastPayment) },
    { label: 'Monto Pendiente:', value: formatPrice(ar.currentBalance) },
    { label: 'Fecha de Vencimiento:', value: formatDate(ar.paymentDate) },
  ];

  return (
    <Container>
      <Header>
        <BackButton>&#8592; Back</BackButton>
        <Title>Detalles de Cuenta por Cobrar</Title>
      </Header>
      <Body>
        <ContentGrid>
          <DetailSummary items={accountInfo} />
          <Sidebar>
            <Typography variant="h3">Acciones Disponibles</Typography>
            <Actions>
              <Button>Registrar Pago</Button>
              <Button disabled>Editar Cuenta</Button>
              <Button disabled>Generar Reporte</Button>
            </Actions>
          </Sidebar>
        </ContentGrid>

        <div>
          <SectionTitle>Detalles de Cuotas</SectionTitle>
          <Table>
            <thead>
              <tr>
                <Th>Número de Cuota</Th>
                <Th>Monto de la Cuota</Th>
                <Th>Fecha de Vencimiento</Th>
                <Th>Estado de la Cuota</Th>
              </tr>
            </thead>
            <tbody>
              {installments
                .sort(
                  (a, b) =>
                    a.installmentDate.seconds - b.installmentDate.seconds,
                )
                .map((installment, index) => (
                  <tr key={installment.id}>
                    <Td>{index + 1}</Td>
                    <Td>{formatPrice(installment.installmentAmount)}</Td>
                    <Td>{formatDate(installment.installmentDate)}</Td>
                    <Td>{installment.isActive ? 'Pendiente' : 'Pagada'}</Td>
                  </tr>
                ))}
            </tbody>
          </Table>
        </div>
        <div>
          <SectionTitle>Historial de Pagos</SectionTitle>
          <Table>
            <thead>
              <tr>
                <Th>Fecha de Pago</Th>
                <Th>Monto Pagado</Th>
                <Th>Estado del Pago</Th>
              </tr>
            </thead>
            <tbody>
              {installmentPayments
                .sort((a, b) => a.createdAt.seconds - b.createdAt.seconds)
                .map((payment) => (
                  <tr key={payment.id}>
                    <Td>{formatDate(payment.createdAt)}</Td>
                    <Td>${payment.paymentAmount}</Td>
                    {/* <Td><a href={payment.receiptUrl}>Ver</a></Td> */}
                    <Td>{payment.isActive ? 'Confirmado' : 'Pendiente'}</Td>
                  </tr>
                ))}
            </tbody>
          </Table>
        </div>
        <div>
          <SectionTitle>Pagos</SectionTitle>
          <Table>
            <thead>
              <tr>
                <Th>Fecha de Pago</Th>
                <Th>Monto Total Pagado</Th>
                <Th>Método de Pago</Th>
                <Th>Estado del Pago</Th>
              </tr>
            </thead>
            <tbody>
              {payments
                .sort((a, b) => a.createdAt.seconds - b.createdAt.seconds)
                .map((payment) => (
                  <tr key={payment.id}>
                    <Td>{formatDate(payment.createdAt)}</Td>
                    <Td>${payment.totalPaid}</Td>
                    <Td>
                      {payment.paymentMethods.find((method) => method.status)
                        ?.method || 'N/A'}
                    </Td>
                    <Td>{payment.isActive ? 'Confirmado' : 'Pendiente'}</Td>
                  </tr>
                ))}
            </tbody>
          </Table>
        </div>

        <SectionTitle>Comentarios y Notas</SectionTitle>
        <InfoSection>
          <textarea rows="4" cols="50"></textarea>
        </InfoSection>
      </Body>
    </Container>
  );
};

export default AccountReceivableInfo;

const Container = styled.div`
  padding: 20px;
  font-family: Arial, sans-serif;
  background-color: var(--color2);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;
const Body = styled.div``;

const Title = styled.h1`
  font-size: 24px;
  color: #006fee;
`;

const BackButton = styled.button`
  color: #006fee;
  cursor: pointer;
  background: none;
  border: none;
`;

const InfoSection = styled.div`
  margin-bottom: 20px;
`;

const Table = styled.table`
  width: 100%;
  margin-bottom: 20px;
  border-collapse: collapse;
  background-color: white;
`;

const Th = styled.th`
  padding: 10px;
  background-color: #f5f5f5;
  border: 1px solid #d7d7db;
`;

const Td = styled.td`
  padding: 10px;
  text-align: center;
  border: 1px solid #d7d7db;
`;

const Button = styled.button`
  background-color: #006fee;
  color: white;
  padding: 0.4em 20px;
  border: none;
  cursor: pointer;

  &:hover {
    background-color: #005bb5;
  }
  ${(props) =>
    props.disabled &&
    `
    background-color: #929292;
    cursor: not-allowed;
    &:hover{
        background-color: #929292;
        }
    `}
`;
const Sidebar = styled.div`
  display: grid;
  align-items: start;
  padding: 1em;
  background-color: #f9f9f9;
  border: 1px solid #d7d7db;
`;
const Actions = styled.div`
  display: grid;
  gap: 0.4em;
`;
const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
`;
const SectionTitle = styled.h2`
  margin-top: 20px;
  font-size: 1em;
`;
