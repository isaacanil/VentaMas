import { Button, Spin, Dropdown, Switch } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import {
  SelectSettingCart,
  togglePrintInvoice,
} from '@/features/cart/cartSlice';
import { Invoice } from '@/modules/invoice/components/Invoice/components/Invoice/Invoice';

import { Body } from './components/Body/Body';
import { TaxReceiptDepletedModal } from './components/TaxReceiptDepletedModal/TaxReceiptDepletedModal';
import { useInvoicePanelController } from './hooks/useInvoicePanelController';
import {
  CancelItem,
  DropdownOverlay,
  OverlayDivider,
  PrintToggleItem,
  ScrollableBody,
  SplitMenuButton,
  StyledInvoicePanelModal,
} from './styles';

export const InvoicePanel = () => {
  const dispatch = useDispatch();
  const settings = useSelector(SelectSettingCart);
  const invoiceType = settings.billing?.invoiceType;
  const printInvoice = settings.printInvoice;
  const {
    componentToPrintRef,
    form,
    handleInvoicePanel,
    handleMonetaryContextChange,
    handleSubmit,
    invoice,
    invoicePanel,
    isAddedToReceivables,
    isAnyPaymentEnabled,
    isChangeNegative,
    loading,
    ncfType,
    resolvedBusinessId,
    retryWithTaxReceipt,
    showCancelSaleConfirm,
    submitted,
    taxReceiptModalOpen,
    taxReceiptState,
    closeTaxReceiptModal,
    continueWithoutTaxReceipt,
    handleSelectTaxReceiptFromModal,
  } = useInvoicePanelController();

  return (
    <>
      <StyledInvoicePanelModal
        open={invoicePanel}
        title="Pago de Factura"
        onCancel={handleInvoicePanel}
        width={520}
        centered
        footer={[
          <Button
            key="close"
            type="default"
            disabled={loading.status || submitted}
            onClick={handleInvoicePanel}
          >
            Atrás
          </Button>,
          <Dropdown
            key="submit-dropdown"
            trigger={['click']}
            disabled={loading.status || submitted}
            dropdownRender={() => (
              <DropdownOverlay>
                <PrintToggleItem onClick={(e) => e.stopPropagation()}>
                  <Switch
                    size="small"
                    checked={printInvoice}
                    onChange={() => dispatch(togglePrintInvoice())}
                  />
                  <span>Imprimir Factura</span>
                </PrintToggleItem>
                <OverlayDivider />
                <CancelItem
                  disabled={loading.status || submitted}
                  onClick={showCancelSaleConfirm}
                >
                  Cancelar venta
                </CancelItem>
              </DropdownOverlay>
            )}
          >
            <SplitMenuButton disabled={loading.status || submitted} />
          </Dropdown>,
          <Button
            key="submit"
            type="primary"
            loading={loading.status}
            disabled={
              submitted ||
              !isAnyPaymentEnabled ||
              (isChangeNegative && !isAddedToReceivables)
            }
            onClick={() => void handleSubmit()}
          >
            Facturar
          </Button>,
        ]}
      >
        <Invoice
          ref={componentToPrintRef}
          data={invoice}
          template={invoiceType || undefined}
        />
        <Spin spinning={loading.status}>
          <ScrollableBody>
            <Body
              form={form}
              businessId={resolvedBusinessId}
              onMonetaryContextChange={handleMonetaryContextChange}
            />
          </ScrollableBody>
        </Spin>
      </StyledInvoicePanelModal>
      <TaxReceiptDepletedModal
        open={taxReceiptModalOpen}
        receipts={taxReceiptState?.data}
        currentReceipt={ncfType}
        loading={loading.status}
        onSelectReceipt={handleSelectTaxReceiptFromModal}
        onRetry={retryWithTaxReceipt}
        onContinueWithout={continueWithoutTaxReceipt}
        onCancel={closeTaxReceiptModal}
      />
    </>
  );
};
