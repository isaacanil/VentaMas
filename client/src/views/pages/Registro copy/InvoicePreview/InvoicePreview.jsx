import React from "react";
import styled from "styled-components";
import Products from "./components/Products";
import { closeInvoicePreviewModal, selectInvoicePreview } from "../../../../features/invoice/invoicePreviewSlice";
import { useDispatch, useSelector } from "react-redux";
import * as antd from "antd";
import { ClientInfoCard } from "./components/ClientInfo";
import SummaryInfoCard from "./components/SummaryInfoCard";
import { PaymentMethodInfoCard } from "./components/PaymentMethodInfoCard";
const { Modal } = antd;
export const InvoicePreview = () => {
  const dispatch = useDispatch();
  const invoicePreviewSelected = useSelector(selectInvoicePreview);
  const isOpen = invoicePreviewSelected?.isOpen;
  // Destructuración segura con optional chaining y valores predeterminados
  const {
    client = {},
    products = [],
    paymentMethod = [],
    sourceOfPurchase = "",
    totalShoppingItems = {},
    totalTaxes = {},
    payment = {},
    totalPurchaseWithoutTaxes = {}
  } = invoicePreviewSelected?.data || {};

  const handleClose = () => dispatch(closeInvoicePreviewModal());

  return (
    isOpen && (
      <Modal
        open={isOpen}
        onCancel={handleClose}
        footer={null}
        style={{ top: 10 }}
        width={800}
      >
        <div className="flex justify-between items-center">
          <Title>Detalles de la Factura</Title>
        </div>
        <Products products={products} />
        <Group>
          <ClientInfoCard client={client} />
          <PaymentMethodInfoCard paymentMethod={paymentMethod} />
          <SummaryInfoCard summaryData={{
            sourceOfPurchase,
            totalShoppingItems,
            totalPurchaseWithoutTaxes,
            totalTaxes,
            payment
          }} />
        </Group>
      </Modal>
    )
  )
};

const Group = styled.div`
  display: grid;
  align-items: stretch;
  
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
`;

const Title = styled.h2`
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 1rem;
`;