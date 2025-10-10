import { Modal }  from "antd";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";

import { closeInvoicePreviewModal, selectInvoicePreview } from "../../../../features/invoice/invoicePreviewSlice";
import { useFbGetCreditNotesByInvoice } from "../../../../firebase/creditNotes/useFbGetCreditNotesByInvoice";
import { useFbGetCreditNoteApplicationsByInvoice } from "../../../../hooks/creditNote/useFbGetCreditNoteApplicationsByInvoice";

import { ClientInfoCard } from "./components/ClientInfo";
import { CreditNotesInfoCard } from "./components/CreditNotesInfoCard";
import { PaymentMethodInfoCard } from "./components/PaymentMethodInfoCard";
import Products from "./components/Products";
import SummaryInfoCard from "./components/SummaryInfoCard";


export const InvoicePreview = () => {
  const dispatch = useDispatch();
  const invoicePreviewSelected = useSelector(selectInvoicePreview);
  const isOpen = invoicePreviewSelected?.isOpen;
  
  // Destructuración segura con optional chaining y valores predeterminados
  const {
    id: invoiceId,
    client = {},
    products = [],
    paymentMethod = [],
    totalPurchase = {},
    date = {},
    sourceOfPurchase = "",
    user = {},
    totalShoppingItems = {},
    totalTaxes = {},
    payment = {},
    totalPurchaseWithoutTaxes = {},
    creditNotePayment = []
  } = invoicePreviewSelected?.data || {};

  // Obtener aplicaciones de notas de crédito para esta factura
  const { applications: creditNoteApplications } = useFbGetCreditNoteApplicationsByInvoice(invoiceId);
  
  // Obtener notas de crédito generadas desde esta factura
  const { creditNotes: generatedCreditNotes } = useFbGetCreditNotesByInvoice(invoiceId);

  const handleClose = () => {
    dispatch(closeInvoicePreviewModal());
  }

  return (
    isOpen && (
      <Modal
        open={isOpen}
        onCancel={handleClose}
        title={"Factura"}
        footer={null}
        style={{ top: 10 }}
        width={800}
      >
        <Container>
        <ClientInfoCard client={client} />
        <Products products={products} />
        <Group>
          <PaymentMethodInfoCard 
            paymentMethod={paymentMethod} 
            creditNoteApplications={creditNoteApplications}
          />
          <SummaryInfoCard summaryData={{
            sourceOfPurchase,
            totalShoppingItems,
            totalPurchaseWithoutTaxes,
            totalTaxes,
            payment
          }} />
        </Group>
        
        {/* Mostrar información de notas de crédito generadas si existen */}
        {generatedCreditNotes.length > 0 && (
          <CreditNotesInfoCard 
            creditNotes={generatedCreditNotes}
          />
        )}
        </Container>

      </Modal>
    )
  )
};

const Container = styled.div`
  display: grid;
  gap: 1em;
`

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