import { Switch } from 'antd';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useSelector, useDispatch } from 'react-redux';
import {
  SelectSettingCart,
  togglePrintInvoice,
} from '@/features/cart/cartSlice';
import { Invoice, TaxReceiptDepletedModal } from '@/modules/invoice/public';
import {
  VmButton,
  VmButtonGroup,
  VmDrawer,
  VmDropdown,
  VmModal,
} from '@/components/heroui';

import { Body } from './components/Body/Body';
import { InvoiceProgress } from './components/Progress/InvoiceProgress';
import { useInvoicePanelController } from './hooks/useInvoicePanelController';
import useViewportWidth from '@/hooks/useViewportWidth';
import {
  InvoicePanelBody,
  InvoicePanelDialog,
  InvoicePanelDrawerBody,
  InvoicePanelDrawerDialog,
  InvoicePanelDrawerFooter,
  InvoicePanelFooter,
  InvoicePanelModalContainer,
  PrintToggleItem,
  ScrollableBody,
} from './styles';

export const InvoicePanel = () => {
  const dispatch = useDispatch();
  const viewportWidth = useViewportWidth();
  const settings = useSelector(SelectSettingCart);
  const invoiceType = settings.billing?.invoiceType;
  const printInvoice = settings.printInvoice;
  const {
    componentToPrintRef,
    form,
    handleInvoicePanel,
    handleMonetaryContextChange,
    handleSubmit,
    hasCartProducts,
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
    handleSelectTaxReceiptFromModal,
  } = useInvoicePanelController();
  const isSubmittingDisabled =
    submitted ||
    !hasCartProducts ||
    !isAnyPaymentEnabled ||
    (isChangeNegative && !isAddedToReceivables);
  const isSecondaryActionDisabled = loading.status || submitted;
  const isMobilePanel = viewportWidth <= 768;
  const isPanelBusy = loading.status;
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && isPanelBusy) {
      return;
    }
    if (!isOpen) {
      handleInvoicePanel();
    }
  };
  const panelBody = (
    <>
      <Invoice
        ref={componentToPrintRef}
        data={invoice}
        template={invoiceType || undefined}
      />
      {isPanelBusy ? (
        <InvoiceProgress visible={isPanelBusy} message={loading.message} />
      ) : (
        <ScrollableBody aria-busy={isPanelBusy}>
          <Body
            form={form}
            businessId={resolvedBusinessId}
            onMonetaryContextChange={handleMonetaryContextChange}
          />
        </ScrollableBody>
      )}
    </>
  );
  const panelFooter = (
    <>
      <VmButton
        variant="outline"
        isDisabled={isSecondaryActionDisabled}
        onPress={handleInvoicePanel}
      >
        Atrás
      </VmButton>
      <VmButtonGroup>
        <VmButton
          variant="primary"
          isPending={loading.status}
          isDisabled={isSubmittingDisabled}
          onPress={() => void handleSubmit()}
        >
          Facturar
        </VmButton>
        <VmDropdown>
          <VmButton
            variant="primary"
            isIconOnly
            aria-label="Más opciones"
            isDisabled={isSecondaryActionDisabled}
          >
            <VmButtonGroup.Separator />
            <FontAwesomeIcon icon={faChevronDown} />
          </VmButton>
          <VmDropdown.Popover placement="top end">
            <VmDropdown.Menu
              onAction={(key) => {
                if (key === 'cancel-sale') {
                  showCancelSaleConfirm();
                }
              }}
            >
              <VmDropdown.Item
                key="print-invoice"
                id="print-invoice"
                textValue="Imprimir Factura"
              >
                <PrintToggleItem onClick={(e) => e.stopPropagation()}>
                  <Switch
                    size="small"
                    checked={printInvoice}
                    onChange={() => dispatch(togglePrintInvoice())}
                  />
                  <span>Imprimir Factura</span>
                </PrintToggleItem>
              </VmDropdown.Item>
              <VmDropdown.Item
                key="cancel-sale"
                id="cancel-sale"
                textValue="Cancelar venta"
                variant="danger"
                isDisabled={isSecondaryActionDisabled}
              >
                Cancelar venta
              </VmDropdown.Item>
            </VmDropdown.Menu>
          </VmDropdown.Popover>
        </VmDropdown>
      </VmButtonGroup>
    </>
  );
  const taxReceiptDialog = (
    <TaxReceiptDepletedModal
      open={taxReceiptModalOpen}
      receipts={taxReceiptState?.data}
      currentReceipt={ncfType}
      loading={loading.status}
      onSelectReceipt={handleSelectTaxReceiptFromModal}
      onRetry={retryWithTaxReceipt}
      onCancel={closeTaxReceiptModal}
    />
  );

  return (
    <>
      {isMobilePanel ? (
        <VmDrawer.Primitive>
          <VmDrawer.Backdrop
            isOpen={invoicePanel}
            onOpenChange={handleOpenChange}
          >
            <VmDrawer.Content placement="bottom">
              <InvoicePanelDrawerDialog>
                <VmDrawer.Handle />
                {!isPanelBusy && <VmDrawer.CloseTrigger />}
                <VmDrawer.Header>
                  <VmDrawer.Heading>Pago de Factura</VmDrawer.Heading>
                </VmDrawer.Header>
                <InvoicePanelDrawerBody $isBusy={isPanelBusy}>
                  {panelBody}
                </InvoicePanelDrawerBody>
                {!isPanelBusy && (
                  <InvoicePanelDrawerFooter>
                    {panelFooter}
                  </InvoicePanelDrawerFooter>
                )}
                {taxReceiptDialog}
              </InvoicePanelDrawerDialog>
            </VmDrawer.Content>
          </VmDrawer.Backdrop>
        </VmDrawer.Primitive>
      ) : (
        <VmModal.Primitive>
          <VmModal.Backdrop
            isOpen={invoicePanel}
            onOpenChange={handleOpenChange}
          >
            <InvoicePanelModalContainer placement="center" scroll="inside">
              <InvoicePanelDialog>
                {!isPanelBusy && <VmModal.CloseTrigger />}
                <VmModal.Header>
                  <VmModal.Heading>Pago de Factura</VmModal.Heading>
                </VmModal.Header>
                <InvoicePanelBody $isBusy={isPanelBusy}>
                  {panelBody}
                </InvoicePanelBody>
                {!isPanelBusy && (
                  <InvoicePanelFooter>{panelFooter}</InvoicePanelFooter>
                )}
                {taxReceiptDialog}
              </InvoicePanelDialog>
            </InvoicePanelModalContainer>
          </VmModal.Backdrop>
        </VmModal.Primitive>
      )}
    </>
  );
};
