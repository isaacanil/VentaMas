import { Button, ButtonGroup, Drawer, Dropdown, Modal } from '@heroui/react';
import { Spin, Switch } from 'antd';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useSelector, useDispatch } from 'react-redux';
import {
  SelectSettingCart,
  togglePrintInvoice,
} from '@/features/cart/cartSlice';
import { Invoice } from '@/modules/invoice/components/Invoice/components/Invoice/Invoice';

import { Body } from './components/Body/Body';
import { TaxReceiptDepletedModal } from './components/TaxReceiptDepletedModal/TaxReceiptDepletedModal';
import { useInvoicePanelController } from './hooks/useInvoicePanelController';
import useViewportWidth from '@/hooks/windows/useViewportWidth';
import {
  InvoicePanelBody,
  InvoicePanelDialog,
  InvoicePanelDrawerBody,
  InvoicePanelDrawerDialog,
  InvoicePanelDrawerFooter,
  InvoicePanelFooter,
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
    !isAnyPaymentEnabled ||
    (isChangeNegative && !isAddedToReceivables);
  const isSecondaryActionDisabled = loading.status || submitted;
  const isMobilePanel = viewportWidth <= 768;
  const handleOpenChange = (isOpen: boolean) => {
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
      <Spin spinning={loading.status}>
        <ScrollableBody>
          <Body
            form={form}
            businessId={resolvedBusinessId}
            onMonetaryContextChange={handleMonetaryContextChange}
          />
        </ScrollableBody>
      </Spin>
    </>
  );
  const panelFooter = (
    <>
      <Button
        variant="outline"
        isDisabled={isSecondaryActionDisabled}
        onPress={handleInvoicePanel}
      >
        Atrás
      </Button>
      <ButtonGroup>
        <Button
          variant="primary"
          isPending={loading.status}
          isDisabled={isSubmittingDisabled}
          onPress={() => void handleSubmit()}
        >
          Facturar
        </Button>
        <Dropdown>
          <Button
            variant="primary"
            isIconOnly
            aria-label="Más opciones"
            isDisabled={isSecondaryActionDisabled}
          >
            <ButtonGroup.Separator />
            <FontAwesomeIcon icon={faChevronDown} />
          </Button>
          <Dropdown.Popover placement="top end">
            <Dropdown.Menu
              onAction={(key) => {
                if (key === 'cancel-sale') {
                  showCancelSaleConfirm();
                }
              }}
            >
              <Dropdown.Item
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
              </Dropdown.Item>
              <Dropdown.Item
                key="cancel-sale"
                id="cancel-sale"
                textValue="Cancelar venta"
                variant="danger"
                isDisabled={isSecondaryActionDisabled}
              >
                Cancelar venta
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </ButtonGroup>
    </>
  );

  return (
    <>
      {isMobilePanel ? (
        <Drawer>
          <Drawer.Backdrop
            isOpen={invoicePanel}
            onOpenChange={handleOpenChange}
          >
            <Drawer.Content placement="bottom">
              <InvoicePanelDrawerDialog>
                <Drawer.Handle />
                <Drawer.CloseTrigger />
                <Drawer.Header>
                  <Drawer.Heading>Pago de Factura</Drawer.Heading>
                </Drawer.Header>
                <InvoicePanelDrawerBody>{panelBody}</InvoicePanelDrawerBody>
                <InvoicePanelDrawerFooter>{panelFooter}</InvoicePanelDrawerFooter>
              </InvoicePanelDrawerDialog>
            </Drawer.Content>
          </Drawer.Backdrop>
        </Drawer>
      ) : (
        <Modal>
          <Modal.Backdrop isOpen={invoicePanel} onOpenChange={handleOpenChange}>
            <Modal.Container placement="center" scroll="inside">
              <InvoicePanelDialog>
                <Modal.CloseTrigger />
                <Modal.Header>
                  <Modal.Heading>Pago de Factura</Modal.Heading>
                </Modal.Header>
                <InvoicePanelBody>{panelBody}</InvoicePanelBody>
                <InvoicePanelFooter>{panelFooter}</InvoicePanelFooter>
              </InvoicePanelDialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      )}
      <TaxReceiptDepletedModal
        open={taxReceiptModalOpen}
        receipts={taxReceiptState?.data}
        currentReceipt={ncfType}
        loading={loading.status}
        onSelectReceipt={handleSelectTaxReceiptFromModal}
        onRetry={retryWithTaxReceipt}
        onCancel={closeTaxReceiptModal}
      />
    </>
  );
};
