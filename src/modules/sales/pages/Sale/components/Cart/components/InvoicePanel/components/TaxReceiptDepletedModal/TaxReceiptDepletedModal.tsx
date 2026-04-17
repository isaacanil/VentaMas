import { Modal, Select, Typography, Button } from 'antd';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import type { TaxReceiptData, TaxReceiptItem } from '@/types/taxReceipt';

type ReceiptOption = {
  value?: string;
  label?: string;
  remaining?: string | number;
};

type TaxReceiptDepletedModalProps = {
  open: boolean;
  receipts?: TaxReceiptItem[];
  currentReceipt?: string;
  loading?: boolean;
  onSelectReceipt?: (value: string) => void;
  onRetry?: () => void;
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
    .map((receipt) => ({
      value: resolveReceiptData(receipt)?.name,
      label: resolveReceiptData(receipt)?.name,
      remaining: resolveReceiptData(receipt)?.quantity,
    }));
};

const FooterContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: flex-end;
`;

const OptionLabel = styled.div`
  display: flex;
  justify-content: space-between;
`;

const RemainingTag = styled.span`
  font-size: 12px;
  color: var(--text-secondary-color, #595959);
`;

const ContentWrapper = styled.div`
  display: grid;
  gap: 1rem;
`;

const Highlight = styled.span`
  font-weight: 600;
`;

export const TaxReceiptDepletedModal = ({
  open,
  receipts = EMPTY_TAX_RECEIPT_ITEMS,
  currentReceipt = undefined,
  loading = false,
  onSelectReceipt = () => undefined,
  onRetry = () => undefined,
  onCancel = () => undefined,
}: TaxReceiptDepletedModalProps) => {
  const options = buildOptions(receipts);
  const selectedOption = options.find(
    (option) => option.value === currentReceipt,
  );

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      title="Sin comprobantes"
      destroyOnHidden
    >
      <ContentWrapper>
        <Typography.Paragraph>
          No hay comprobantes del tipo{' '}
          <Highlight>{currentReceipt || 'actual'}</Highlight>. Debes elegir otro
          comprobante disponible para continuar.
        </Typography.Paragraph>

        {options.length > 0 ? (
          <div>
            <Typography.Text strong>Elige un comprobante</Typography.Text>
            <Select
              value={currentReceipt}
              style={{ width: '100%', marginTop: '0.5rem' }}
              placeholder="Elige un comprobante"
              showSearch
              optionFilterProp="label"
              onChange={onSelectReceipt}
              filterOption={(input, option) =>
                typeof option?.label === 'string' &&
                option.label.toLowerCase().includes(input.toLowerCase())
              }
              options={options.map((option) => ({
                value: option.value,
                label: option.label,
                remaining: option.remaining,
              }))}
              optionRender={(opt) => (
                <OptionLabel>
                  <span>{opt.data.label as string}</span>
                  {(opt.data as any).remaining && (
                    <RemainingTag>Quedan: {(opt.data as any).remaining}</RemainingTag>
                  )}
                </OptionLabel>
              )}
            />
          </div>
        ) : (
          <Typography.Text type="secondary">
            No hay otros comprobantes con numeración disponible. No puedes
            completar la venta sin comprobante mientras la facturación fiscal
            esté activa.
          </Typography.Text>
        )}

        <FooterContainer>
          <Button onClick={onCancel} disabled={loading}>
            Volver
          </Button>
          <Button
            type="primary"
            onClick={onRetry}
            disabled={!selectedOption || loading}
            loading={loading}
          >
            Continuar con comprobante
          </Button>
        </FooterContainer>
      </ContentWrapper>
    </Modal>
  );
};

TaxReceiptDepletedModal.propTypes = {
  open: PropTypes.bool.isRequired,
  receipts: PropTypes.arrayOf(
    PropTypes.shape({
      data: PropTypes.shape({
        name: PropTypes.string,
        quantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        disabled: PropTypes.bool,
        serie: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      }),
    }),
  ),
  currentReceipt: PropTypes.string,
  loading: PropTypes.bool,
  onSelectReceipt: PropTypes.func,
  onRetry: PropTypes.func,
  onCancel: PropTypes.func,
};
