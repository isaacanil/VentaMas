// Importaciones necesarias
import React from 'react';
import styled from 'styled-components';
import { DateTime } from 'luxon';

// Estilos
const Container = styled.div`
  max-width: 600px;
  margin: auto;
  padding: 20px;
  background-color: #f8f8f8;
  font-family: Arial, sans-serif;
  border: 1px solid #ccc;
`;

const Title = styled.h2`
  text-align: center;
  margin: 0;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  font-weight: bold;
`;

const TableRow = styled.tr`
  border-bottom: 1px solid #ccc;
`;

const TableCell = styled.td`
  padding: 8px 12px;
`;

  
// Componente de recibo de compras
const ReciboCompras = (props, ref) => {
    const ejemploCompra = {
        negocio: {
          nombre: 'Tienda Ejemplo',
          direccion: 'Calle Principal 123, Ciudad, País',
          telefono: '+1 234 567 8900',
        },
        cliente: {
          nombre: 'Juan Pérez',
          tel: '+1 098 765 4321',
          direccion: 'Avenida Secundaria 456, Ciudad, País',
        },
        productos: [
          {
            descripcion: 'Producto 1',
            itbis: '18%',
            valor: '$10.00',
          },
          {
            descripcion: 'Producto 2',
            itbis: '18%',
            valor: '$15.00',
          },
        ],
        pago: {
          totalImpuesto: '$4.50',
          envio: '$5.00',
          totalPagar: '$34.50',
          cambio: '$0.00',
        },
      };
  const { negocio, cliente, productos, pago } = ejemploCompra;
  const fechaActual = DateTime.now().toFormat('dd/MM/yyyy HH:mm');

  return (
    <Container ref={ref}>
      <Title>Recibo de Compras</Title>
      <p>Nombre del negocio: {negocio.nombre}</p>
      <p>Dirección: {negocio.direccion}</p>
      <p>Teléfono: {negocio.telefono}</p>
      <p>Fecha y hora: {fechaActual}</p>
      <p>Cliente: {cliente.nombre}</p>
      <p>Teléfono: {cliente.tel}</p>
      <p>Dirección: {cliente.direccion}</p>

      <Title>Factura para consumidor final</Title>
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>Descripción</TableCell>
            <TableCell>ITBIS</TableCell>
            <TableCell>Valor</TableCell>
          </TableRow>
        </TableHeader>
        <tbody>
          {productos.map((producto, index) => (
            <TableRow key={index}>
              <TableCell>{producto.descripcion}</TableCell>
              <TableCell>{producto.itbis}</TableCell>
              <TableCell>{producto.valor}</TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>

      <p>Total impuesto: {pago.totalImpuesto}</p>
      <p>Envío: {pago.envio}</p>
      <p>Total a pagar: {pago.totalPagar}</p>
      <p>Cambio: {pago.cambio}</p>
    </Container>
  );
};

export default React.forwardRef(ReciboCompras);
