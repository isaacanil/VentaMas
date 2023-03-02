import React from 'react';
import { Modal, Button } from 'react-bootstrap';

function OrderDetailsModal(props) {
  const { order } = props;

  return (
    <Modal show={props.show} onHide={props.onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Detalles del pedido</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p><strong>Condición:</strong> {order.condition}</p>
        <p><strong>Fecha de creación:</strong> {order.created_at}</p>
        <p><strong>Fecha de entrega:</strong> {order.delivery_date}</p>
        <p><strong>ID:</strong> {order.id}</p>
        <p><strong>Nota:</strong> {order.note}</p>
        <p><strong>Productos:</strong></p>
        <ul>
          {order.products.map((product) => (
            <li key={product.id}>{product.name} - {product.quantity}</li>
          ))}
        </ul>
        <p><strong>Proveedor:</strong> {order.provider}</p>
        <p><strong>Estado:</strong> {order.state}</p>
        <p><strong>Total:</strong> {order.total}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={props.onHide}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default OrderDetailsModal;