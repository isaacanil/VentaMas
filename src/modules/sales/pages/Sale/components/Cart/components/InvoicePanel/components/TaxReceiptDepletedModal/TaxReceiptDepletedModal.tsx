import { Label, ListBox, ListBoxItem } from '@heroui/react';
import type { Key } from 'react';
import styled from 'styled-components';
import { VmButton, VmModal, VmSelect } from '@/components/heroui';
import type { TaxReceiptData, TaxReceiptItem } from '@/types/taxReceipt';

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

const resolveReceiptData = (
  receipt: TaxReceiptItem | null | undefined,
): TaxReceiptData | null => {
  if (!receipt) return null;
  if (typeof receipt === 'object' && 'data' in receipt) {
    return receipt.data ?? null;
  }
  return receipt ?? null;
};

const isReceiptOption = (
  option: ReceiptOption | null,
): option is ReceiptOption => option !== null;

const buildOptions = (receipts: TaxReceiptItem[]): ReceiptOption[] => {
  if (!Array.isArray(receipts)) return [];

  return receipts
    .filter((receipt) => {
      const data = resolveReceiptData(receipt);
      return data && !data.disabled;
    })
    .filter((receipt) => {
      const data = resolveReceiptData(receipt);
      const rawName = data?.name || '';
      const name = rawName
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase();
      const serie = (data?.serie || '').toString().padStart(2, '0');
      const containsNota = name.includes('nota');
      const containsCredito = name.includes('credito');
      const isCreditNoteBySerie = serie === '04';
      const isCreditNoteByName = containsNota && containsCredito;
      return !(isCreditNoteBySerie || isCreditNoteByName);
    })
    .filter((receipt) => {
      const data = resolveReceiptData(receipt);
      const quantity = Number(data?.quantity);
      const increase = Number(data?.increase);
      const normalizedIncrease =
        Number.isFinite(increase) && increase > 0 ? increase : 1;
      const normalizedQuantity = Number.isFinite(quantity) ? quantity : 0;
      return normalizedQuantity >= normalizedIncrease;
    })
    .map((receipt) => {
      const data = resolveReceiptData(receipt);
      const name = data?.name?.trim();

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

const FieldLabel = styled(Label)`
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
                <ListBox aria-label="Comprobantes disponibles" items={options}>
                  {(option) => (
                    <ListBoxItem id={option.id} textValue={option.label}>
                      <OptionLabel>
                        <span>{option.label}</span>
                        {option.remaining ? (
                          <RemainingTag>
                            Quedan: {option.remaining}
                          </RemainingTag>
                        ) : null}
                      </OptionLabel>
                      <ListBoxItem.Indicator />
                    </ListBoxItem>
                  )}
                </ListBox>
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
