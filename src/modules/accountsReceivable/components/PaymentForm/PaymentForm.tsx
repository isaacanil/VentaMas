import { Button, Checkbox, DatePicker, Form, InputNumber, Modal as PaymentModal, Select } from 'antd';
import styled from 'styled-components';
import dayjs from 'dayjs';

import { ShowcaseList } from '@/components/ui/ShowCase/ShowcaseList';
import { Receipt } from '@/modules/checkout/pages/checkout/Receipt';
import { AccountsReceivablePaymentReceipt } from '@/modules/checkout/pages/checkout/receipts/AccountsReceivablePaymentReceipt/AccountsReceivablePaymentReceipt';
import CreditSelector from '@/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/components/CreditSelector/CreditSelector';
import { TaxReceiptDepletedModal } from '@/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/components/TaxReceiptDepletedModal/TaxReceiptDepletedModal';
import { modalStyles } from '@/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/constants/modalStyles';

import { AutoCompleteResultModal } from './components/AutoCompleteResultModal';
import { AutoCompletingHint } from './components/AutoCompletingHint';
import { PaymentContextSummary } from './components/PaymentContextSummary';
import { PaymentFields } from './components/PaymentFields';
import { usePaymentFormController } from './hooks/usePaymentFormController';

const { Option } = Select;

export const PaymentForm = () => {
  const {
    autoCompleteModalState,
    autoCompleting,
    change,
    client,
    componentToPrintRef,
    extra,
    form,
    handleClear,
    handleCloseTaxReceiptModal,
    handleContinueAutoCompleteWithoutReceipt,
    handleCreditNoteSelect,
    handleOpenGeneratedInvoicePreview,
    handlePaymentConceptChange,
    handlePrintGeneratedInvoice,
    handlePrintReceiptChange,
    handleRetryAutoCompleteWithSelectedReceipt,
    handleSelectTaxReceiptFromModal,
    handleSubmit,
    handleThirdPartyWithholdingChange,
    invoiceToPrintRef,
    isOpen,
    isPrintableReceipt,
    loading,
    modalTitle,
    ncfType,
    paymentDetails,
    paymentOptions,
    receipt,
    resolvedAutoCompleteClient,
    selectedCreditNotes,
    shouldShowAutoCompleteResultModal,
    submitted,
    taxReceiptData,
    taxReceiptModalOpen,
  } = usePaymentFormController();

  return (
    <>
      <PaymentModal
        open={isOpen}
        style={{ top: 10 }}
        title={modalTitle}
        onCancel={() => {
          if (autoCompleting) return;
          handleClear();
        }}
        styles={modalStyles}
        footer={[
          <Button key="back" onClick={handleClear} disabled={autoCompleting}>
            Cancelar
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleSubmit}
            loading={loading}
            disabled={submitted || autoCompleting}
          >
            Pagar
          </Button>,
        ]}
        zIndex={2000}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            paymentConcept: paymentDetails?.paymentScope,
            totalAmountDue: paymentDetails?.totalAmountDue,
          }}
        >
          <FormWrapper>
            <PaymentContextSummary
              paymentDetails={paymentDetails}
              extra={extra}
              clientName={resolvedAutoCompleteClient?.name ?? undefined}
            />

            {paymentDetails?.paymentScope !== 'balance' ? (
              <Select
                value={paymentDetails.paymentOption}
                onChange={handlePaymentConceptChange}
              >
                {paymentOptions.map((concept) => (
                  <Option key={concept.name} value={concept.name}>
                    {concept.text}
                  </Option>
                ))}
              </Select>
            ) : null}

            {paymentDetails.paymentOption === 'partial' ? (
              <ShowcaseList
                showcases={[
                  {
                    title: 'Balance de la cuenta Actual',
                    valueType: 'price',
                    description:
                      'Se aplicara el pago a las diferentes cuotas de la cuenta actual',
                    value: paymentDetails.totalAmount,
                  },
                ]}
              />
            ) : (
              <ShowcaseList
                showcases={[
                  {
                    title:
                      paymentDetails.paymentScope === 'balance'
                        ? 'Balance General'
                        : 'Total a pagar',
                    valueType: 'price',
                    description:
                      paymentDetails.paymentScope === 'balance'
                        ? 'Se aplicara el pago a las diferentes cuentas por cobrar del cliente actual'
                        : 'Total a pagar por el cliente',
                    value: paymentDetails.totalAmount,
                  },
                ]}
              />
            )}

            <PaymentFields />

            {paymentDetails.paymentScope === 'account' ? (
              <RetentionSection>
                <RetentionTitle>Retenciones sufridas por terceros</RetentionTitle>
                <RetentionFields>
                  <Form.Item
                    label="Fecha de retención"
                    tooltip="Se reporta en 607 cuando el cliente retiene ITBIS o ISR."
                  >
                    <DatePicker
                      allowClear
                      format="YYYY-MM-DD"
                      value={
                        paymentDetails.thirdPartyWithholding?.retentionDate
                          ? dayjs(paymentDetails.thirdPartyWithholding.retentionDate)
                          : null
                      }
                      onChange={(value) =>
                        handleThirdPartyWithholdingChange(
                          'retentionDate',
                          value ? value.format('YYYY-MM-DD') : '',
                        )
                      }
                    />
                  </Form.Item>
                  <Form.Item label="ITBIS retenido">
                    <InputNumber
                      min={0}
                      precision={2}
                      style={{ width: '100%' }}
                      value={paymentDetails.thirdPartyWithholding?.itbisWithheld ?? 0}
                      onChange={(value) =>
                        handleThirdPartyWithholdingChange(
                          'itbisWithheld',
                          typeof value === 'number' ? value : 0,
                        )
                      }
                    />
                  </Form.Item>
                  <Form.Item label="ISR retenido">
                    <InputNumber
                      min={0}
                      precision={2}
                      style={{ width: '100%' }}
                      value={
                        paymentDetails.thirdPartyWithholding?.incomeTaxWithheld ?? 0
                      }
                      onChange={(value) =>
                        handleThirdPartyWithholdingChange(
                          'incomeTaxWithheld',
                          typeof value === 'number' ? value : 0,
                        )
                      }
                    />
                  </Form.Item>
                </RetentionFields>
              </RetentionSection>
            ) : null}

            {client?.id && client.id !== 'GC-0000' ? (
              <CreditSelector
                clientId={client.id}
                onCreditNoteSelect={handleCreditNoteSelect}
                selectedCreditNotes={selectedCreditNotes}
                totalPurchase={paymentDetails.totalAmount}
                paymentMethods={paymentDetails.paymentMethods}
              />
            ) : null}

            <ShowcaseList
              showcases={[
                {
                  title: 'Total pagado',
                  valueType: 'price',
                  value: paymentDetails.totalPaid,
                },
                {
                  title: change >= 0 ? 'Devuelta' : 'Faltante',
                  valueType: 'price',
                  value: change,
                  description:
                    paymentDetails.paymentOption === 'installment' ||
                    paymentDetails.paymentOption === 'balance'
                      ? 'Tiene que pagar completamente'
                      : 'No tiene que pagar el faltante completamente',
                  color:
                    paymentDetails.paymentOption === 'installment' ||
                    paymentDetails.paymentOption === 'balance',
                },
              ]}
            />

            <Form.Item>
              <Checkbox
                checked={paymentDetails.printReceipt}
                onChange={(event) =>
                  handlePrintReceiptChange(event.target.checked)
                }
              >
                Imprimir recibo de pago
              </Checkbox>
            </Form.Item>

            {autoCompleting ? <AutoCompletingHint /> : null}
          </FormWrapper>
        </Form>

        <div style={{ display: 'none' }}>
          {isPrintableReceipt(receipt) ? (
            <AccountsReceivablePaymentReceipt
              data={receipt}
              ref={componentToPrintRef}
            />
          ) : null}
        </div>
      </PaymentModal>

      <AutoCompleteResultModal
        open={shouldShowAutoCompleteResultModal}
        state={autoCompleteModalState}
        clientName={resolvedAutoCompleteClient?.name ?? undefined}
        onClose={handleClear}
        onPreview={handleOpenGeneratedInvoicePreview}
        onPrint={handlePrintGeneratedInvoice}
      />

      <TaxReceiptDepletedModal
        open={taxReceiptModalOpen}
        receipts={taxReceiptData}
        currentReceipt={ncfType || undefined}
        loading={autoCompleting}
        onSelectReceipt={handleSelectTaxReceiptFromModal}
        onRetry={() => void handleRetryAutoCompleteWithSelectedReceipt()}
        onContinueWithout={() => void handleContinueAutoCompleteWithoutReceipt()}
        onCancel={handleCloseTaxReceiptModal}
      />

      <div style={{ display: 'none' }}>
        {autoCompleteModalState?.invoice ? (
          <Receipt ref={invoiceToPrintRef} data={autoCompleteModalState.invoice} />
        ) : null}
      </div>
    </>
  );
};

const FormWrapper = styled.div`
  display: grid;
  gap: 1em;
`;

const RetentionSection = styled.div`
  display: grid;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border: 1px solid var(--ds-color-border-subtle, #d9d9d9);
  border-radius: 12px;
  background: var(--ds-color-bg-surface, #fff);
`;

const RetentionTitle = styled.span`
  font-weight: 600;
`;

const RetentionFields = styled.div`
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
`;
