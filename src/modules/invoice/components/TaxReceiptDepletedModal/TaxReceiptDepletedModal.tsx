import type { Key } from 'react';
import styled from 'styled-components';
import {
  VmButton,
  VmLabel,
  VmListBox,
  VmModal,
  VmSelect,
} from '@/components/heroui';
import type { TaxReceiptItem } from '@/types/taxReceipt';
import { getSelectableTaxReceiptData } from '@/utils/taxReceipt';

type ReceiptOption = {
  id: string;
  label: string;
  remaining?: string | number;
};
type TaxReceiptDepletedModalProps = {
  open: boolean;
  receipts?: TaxReceiptItem[];
  currentReceipt?: string;
  loading?: boolean;
  onSelectReceipt?: (value: string) => void;
  onRetry?: () => void;
  onContinueWithout?: () => void;
  onCancel?: () => void;
};

const EMPTY_TAX_RECEIPT_ITEMS: TaxReceiptItem[] = [];

const isReceiptOption = (
  option: ReceiptOption | null,
): option is ReceiptOption => option !== null;

const buildOptions = (receipts: TaxReceiptItem[]): ReceiptOption[] => {
  if (!Array.isArray(receipts)) return [];

  return getSelectableTaxReceiptData(receipts, {
    excludeCreditNotes: true,
    requireAvailable: true,
  })
    .map((data) => {
      const name = data.name?.trim();

      if (!name) return null;

      return {
        id: name,
        label: name,
        remaining: data?.quantity,
      };
    })
    .filter(isReceiptOption);
};

const OptionLabel = styled.div`
  display: flex;
  width: 100%;
  gap: var(--ds-space-3);
  justify-content: space-between;
`;

const RemainingTag = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  white-space: nowrap;
`;

const ContentWrapper = styled.div`
  display: grid;
  gap: 1rem;
`;

const Highlight = styled.span`
  font-weight: 600;
`;

const BodyText = styled.p`
  margin: 0;
  color: var(--ds-color-text-primary);
  line-height: var(--ds-line-height-normal);
`;

const MutedText = styled.p`
  margin: 0;
  color: var(--ds-color-text-secondary);
  line-height: var(--ds-line-height-normal);
`;

const ReceiptField = styled.div`
  display: grid;
  gap: var(--ds-space-2);
`;

const FieldLabel = styled(VmLabel)`
  font-weight: var(--ds-font-weight-semibold);
`;

export const TaxReceiptDepletedModal = ({
  open,
  receipts = EMPTY_TAX_RECEIPT_ITEMS,
  currentReceipt = undefined,
  loading = false,
  onSelectReceipt = () => undefined,
  onRetry = () => undefined,
  onContinueWithout = undefined,
  onCancel = () => undefined,
}: TaxReceiptDepletedModalProps) => {
  const options = buildOptions(receipts);
  const selectedOption = options.find((option) => option.id === currentReceipt);
  const selectedKey = selectedOption?.id ?? null;
  const handleSelectionChange = (key: Key | null) => {
    if (key !== null) {
      onSelectReceipt(String(key));
    }
  };
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onCancel();
    }
  };
  const footer = (
    <>
      <VmButton variant="outline" onPress={onCancel} isDisabled={loading}>
        Volver
      </VmButton>
      {onContinueWithout ? (
        <VmButton
          variant="secondary"
          onPress={onContinueWithout}
          isDisabled={loading}
        >
          Continuar sin comprobante
        </VmButton>
      ) : null}
      <VmButton
        variant="primary"
        onPress={onRetry}
        isDisabled={!selectedOption || loading}
        isPending={loading}
      >
        Continuar con comprobante
      </VmButton>
    </>
  );

  return (
    <VmModal
      isOpen={open}
      onOpenChange={handleOpenChange}
      title="Sin comprobantes"
      size="sm"
      footer={footer}
      isDismissable={false}
    >
      <ContentWrapper>
        <BodyText>
          No hay comprobantes del tipo{' '}
          <Highlight>{currentReceipt || 'actual'}</Highlight>. Debes elegir otro
          comprobante disponible para continuar.
        </BodyText>

        {options.length > 0 ? (
          <ReceiptField>
            <VmSelect
              selectedKey={selectedKey}
              onSelectionChange={handleSelectionChange}
              placeholder="Elige un comprobante"
              fullWidth
            >
              <FieldLabel>Elige un comprobante</FieldLabel>
              <VmSelect.Trigger>
                <VmSelect.Value />
                <VmSelect.Indicator />
              </VmSelect.Trigger>
              <VmSelect.Popover>
                <VmListBox
                  aria-label="Comprobantes disponibles"
                  items={options}
                >
                  {(option) => (
                    <VmListBox.Item id={option.id} textValue={option.label}>
                      <OptionLabel>
                        <span>{option.label}</span>
                        {option.remaining ? (
                          <RemainingTag>
                            Quedan: {option.remaining}
                          </RemainingTag>
                        ) : null}
                      </OptionLabel>
                      <VmListBox.ItemIndicator />
                    </VmListBox.Item>
                  )}
                </VmListBox>
              </VmSelect.Popover>
            </VmSelect>
          </ReceiptField>
        ) : (
          <MutedText>
            No hay otros comprobantes con numeración disponible. No puedes
            completar la venta sin comprobante mientras la facturación fiscal
            esté activa.
          </MutedText>
        )}
      </ContentWrapper>
    </VmModal>
  );
};
