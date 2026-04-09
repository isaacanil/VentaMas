import {
  EyeOutlined,
  PrinterOutlined,
  ShoppingCartOutlined,
} from '@/constants/icons/antd';
import { notification } from 'antd';
import type { MenuProps } from 'antd';
import { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { icons } from '@/constants/icons/icons';
import { ConfirmModal } from '@/components/modals/ConfirmModal/ConfirmModal';
import PreorderModal from '@/components/modals/PreorderModal/PreorderModal';
import { selectAR } from '@/features/accountsReceivable/accountsReceivableSlice';
import { selectBusinessData } from '@/features/auth/businessSlice';
import { selectUser } from '@/features/auth/userSlice';
import { SelectCartData, SelectSettingCart } from '@/features/cart/cartSlice';
import { selectClient } from '@/features/clientCart/clientCartSlice';
import { selectAppMode } from '@/features/appModes/appModeSlice';
import {
  selectNcfType,
  selectTaxReceiptData,
  selectTaxReceiptEnabled,
} from '@/features/taxReceipt/taxReceiptSlice';
import { fbCancelPreorder } from '@/firebase/invoices/fbCancelPreorder';
import { Invoice } from '@/modules/invoice/components/Invoice/components/Invoice/Invoice';
import { MiniClientSelector } from '@/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/components/Body/components/MarkAsReceivableButton/components/ARValidateMessage/components/MiniClientSelector/MiniClientSelector';
import { ReceivableManagementPanel } from '@/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/components/Body/components/ReceivableManagementPanel/ReceivableManagementPanel';
import { TaxReceiptDepletedModal } from '@/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/components/TaxReceiptDepletedModal/TaxReceiptDepletedModal';
import type { InvoiceBusinessInfo } from '@/types/invoice';
import type { TaxReceiptItem } from '@/types/taxReceipt';
import type { UserIdentity } from '@/types/users';
import { calculateInvoiceChange } from '@/utils/invoice';

import { ActionButtons } from './components/ActionButtons';
import { ReceivableDecisionModal } from './components/ReceivableDecisionModal';
import { usePreorderCartActions } from './hooks/usePreorderCartActions';
import { usePreorderPrint } from './hooks/usePreorderPrint';
import { usePreorderReceivableFlow } from './hooks/usePreorderReceivableFlow';
import type {
  AccountsReceivableState,
  ClientLike,
  PreorderActionCellValue,
} from './types';
import { resolveClientId } from './utils';

export const PreorderActionsCell = ({
  value,
}: {
  value: PreorderActionCellValue;
}) => {
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();
  const data = value.data ?? null;

  const user = useSelector(selectUser) as UserIdentity | null;
  const businessData = useSelector(
    selectBusinessData,
  ) as InvoiceBusinessInfo | null;
  const business = useMemo<InvoiceBusinessInfo>(
    () => businessData || {},
    [businessData],
  );

  const cartSettings = useSelector(SelectSettingCart) as ReturnType<
    typeof SelectSettingCart
  >;
  const cartData = useSelector(SelectCartData);
  const accountsReceivable = useSelector(selectAR) as AccountsReceivableState;
  const selectedClient = useSelector(selectClient);
  const taxReceiptEnabled = useSelector(selectTaxReceiptEnabled);
  const ncfType = useSelector(selectNcfType) as string | null;
  const taxReceiptData = useSelector(selectTaxReceiptData) as TaxReceiptItem[];
  const isTestMode = useSelector(selectAppMode) as boolean;

  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [isPreorderModalOpen, setIsPreorderModalOpen] = useState(false);

  const isValidClient = useCallback((client?: ClientLike | null) => {
    const clientId = resolveClientId(client);
    return Boolean(clientId && clientId !== 'GC-0000');
  }, []);

  const effectiveClient = useMemo(() => {
    if (isValidClient(selectedClient)) return selectedClient;
    if (isValidClient(data?.client)) return data?.client ?? null;
    return null;
  }, [data?.client, isValidClient, selectedClient]);

  const change = useMemo(() => calculateInvoiceChange(cartData), [cartData]);
  const isChangeNegative = change < 0;
  const receivableStatus = Boolean(cartData?.isAddedToReceivables);

  const invoiceTiming = useMemo(
    () =>
      (
        cartSettings as {
          billing?: { invoiceGenerationTiming?: string | null };
        } | null
      )?.billing?.invoiceGenerationTiming ?? 'first-payment',
    [cartSettings],
  );

  const { convertToCart, handleInvoicePanelOpen, handlePreloadPreorder } =
    usePreorderCartActions({ data, dispatch, navigate });

  const {
    closeClientSelector,
    closeReceivableConfig,
    closeReceivableDecision,
    closeTaxReceiptModal,
    handleCompletePreorder,
    handleConfirmReceivable,
    handleContinueAutoCompleteWithoutReceipt,
    handleRetryAutoCompleteWithSelectedReceipt,
    handleSelectInvoiceDecision,
    handleSelectTaxReceiptFromModal,
    handleSelectReceivableDecision,
    isAutoCompletingPreorder,
    isClientSelectorOpen,
    isCompletingPreorder,
    isDecisionLoading,
    isReceivableConfigOpen,
    isReceivableDecisionOpen,
    isReceivableLoading,
    isTaxReceiptModalOpen,
    openClientSelector,
    receivableForm,
  } = usePreorderReceivableFlow({
    accountsReceivable,
    change,
    convertToCart,
    data,
    dispatch,
    effectiveClient,
    handleInvoicePanelOpen,
    invoiceTiming,
    isTestMode,
    isValidClient,
    ncfType,
    taxReceiptData,
    taxReceiptEnabled: Boolean(taxReceiptEnabled),
    user,
  });

  const {
    handlePrintPreorder,
    printRef,
    printableData,
    printableTemplate,
    shouldRenderPrintable,
  } = usePreorderPrint({
    business,
    cartSettings,
    data,
  });

  const handleCancelPreorder = useCallback(async () => {
    try {
      await fbCancelPreorder(user, data);
      setIsCancelConfirmOpen(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Intenta nuevamente.';
      notification.error({
        message: 'No se pudo cancelar la preventa',
        description: errorMessage,
      });
    }
  }, [data, user]);

  const menuItems: MenuProps['items'] = useMemo(
    () => [
      {
        key: 'view',
        label: 'Ver detalles de preventa',
        onClick: () => setIsPreorderModalOpen(true),
        icon: <EyeOutlined />,
      },
      {
        key: 'preload',
        label: 'Cargar preventa en ventas',
        onClick: handlePreloadPreorder,
        icon: <ShoppingCartOutlined />,
        disabled: isCompletingPreorder,
      },
      {
        key: 'complete',
        label: isCompletingPreorder ? 'Completando...' : 'Completar preventa',
        onClick: () => {
          void handleCompletePreorder();
        },
        icon: icons.editingActions.complete,
        disabled: isCompletingPreorder,
      },
      {
        key: 'print',
        label: 'Imprimir preventa',
        onClick: () => {
          void handlePrintPreorder();
        },
        icon: <PrinterOutlined />,
      },
      {
        key: 'cancel',
        label: 'Cancelar preventa',
        onClick: () => setIsCancelConfirmOpen(true),
        icon: icons.editingActions.cancel,
        danger: true,
      },
    ],
    [
      handleCompletePreorder,
      handlePreloadPreorder,
      handlePrintPreorder,
      isCompletingPreorder,
    ],
  );

  return (
    <div
      style={{
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
      }}
      onClick={(event) => event.stopPropagation()}
    >
      {shouldRenderPrintable ? (
        <div
          style={{ position: 'absolute', top: -9999, left: -9999 }}
          aria-hidden="true"
        >
          <Invoice
            ref={printRef}
            data={printableData}
            template={printableTemplate || undefined}
            ignoreHidden
          />
        </div>
      ) : null}

      <ActionButtons
        menuItems={menuItems}
        onComplete={() => {
          void handleCompletePreorder();
        }}
        isCompletingPreorder={isCompletingPreorder}
      />

      {isPreorderModalOpen ? (
        <PreorderModal
          preorder={data}
          open={isPreorderModalOpen}
          onCancel={() => setIsPreorderModalOpen(false)}
        />
      ) : null}

      {isCancelConfirmOpen ? (
        <ConfirmModal
          open={isCancelConfirmOpen}
          onConfirm={handleCancelPreorder}
          onCancel={() => setIsCancelConfirmOpen(false)}
          title="Cancelar preventa"
          message={`¿Estás seguro de que deseas cancelar la preorden ${data?.preorderDetails?.numberID} para el cliente ${data?.client?.name}?`}
          confirmText="Cancelar Preorden"
          cancelText="Volver"
          danger
          data={data?.preorderDetails?.numberID}
        />
      ) : null}

      {isReceivableDecisionOpen ? (
        <ReceivableDecisionModal
          open={isReceivableDecisionOpen}
          decisionLoading={isDecisionLoading}
          clientName={effectiveClient?.name}
          onCancel={closeReceivableDecision}
          onChangeClient={openClientSelector}
          onSelectInvoice={handleSelectInvoiceDecision}
          onSelectReceivable={handleSelectReceivableDecision}
        />
      ) : null}

      {isReceivableConfigOpen ? (
        <ReceivableManagementPanel
          form={receivableForm}
          creditLimit={null}
          isChangeNegative={isChangeNegative}
          receivableStatus={receivableStatus}
          firstPaymentMode="today"
          isOpen={isReceivableConfigOpen}
          closePanel={closeReceivableConfig}
          showActions
          confirmText="Crear CxC y cobrar"
          cancelText="Cancelar"
          confirmLoading={isReceivableLoading}
          onConfirm={handleConfirmReceivable}
        />
      ) : null}

      {isClientSelectorOpen ? (
        <MiniClientSelector
          isOpen={isClientSelectorOpen}
          onClose={closeClientSelector}
        />
      ) : null}

      {isTaxReceiptModalOpen ? (
        <TaxReceiptDepletedModal
          open={isTaxReceiptModalOpen}
          receipts={taxReceiptData}
          currentReceipt={ncfType || undefined}
          loading={isAutoCompletingPreorder}
          onSelectReceipt={handleSelectTaxReceiptFromModal}
          onRetry={() => void handleRetryAutoCompleteWithSelectedReceipt()}
          onContinueWithout={() =>
            void handleContinueAutoCompleteWithoutReceipt()
          }
          onCancel={closeTaxReceiptModal}
        />
      ) : null}
    </div>
  );
};
