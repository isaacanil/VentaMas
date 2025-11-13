import { Modal, Select, Typography, Button } from 'antd';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const buildOptions = (receipts) => {
  if (!Array.isArray(receipts)) return [];

  return receipts
    .filter((receipt) => receipt?.data && !receipt.data.disabled)
    .filter((receipt) => {
      const rawName = receipt?.data?.name || '';
      const name = rawName
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase();
      const serie = (receipt?.data?.serie || '').toString().padStart(2, '0');
      const containsNota = name.includes('nota');
      const containsCredito = name.includes('credito');
      const isCreditNoteBySerie = serie === '04';
      const isCreditNoteByName = containsNota && containsCredito;
      return !(isCreditNoteBySerie || isCreditNoteByName);
    })
    .map((receipt) => ({
      value: receipt?.data?.name,
      label: receipt?.data?.name,
      remaining: receipt?.data?.quantity,
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
  receipts = [],
  currentReceipt = undefined,
  loading = false,
  onSelectReceipt = () => {},
  onRetry = () => {},
  onContinueWithout = () => {},
  onCancel = () => {},
}) => {
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
          <Highlight>{currentReceipt || 'actual'}</Highlight>. Elige otro o
          continúa sin comprobante.
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
            >
              {options.map((option) => (
                <Select.Option
                  key={option.value}
                  value={option.value}
                  label={option.label}
                >
                  <OptionLabel>
                    <span>{option.label}</span>
                    {option.remaining && (
                      <RemainingTag>Quedan: {option.remaining}</RemainingTag>
                    )}
                  </OptionLabel>
                </Select.Option>
              ))}
            </Select>
          </div>
        ) : (
          <Typography.Text type="secondary">
            No hay otros comprobantes. Puedes continuar sin comprobante.
          </Typography.Text>
        )}

        <FooterContainer>
          <Button
            type="primary"
            onClick={onRetry}
            disabled={!selectedOption || loading}
            loading={loading}
          >
            Continuar con comprobante
          </Button>
          <Button
            danger
            type="primary"
            ghost
            onClick={onContinueWithout}
            disabled={loading}
            loading={loading}
          >
            Continuar sin comprobante
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
  onContinueWithout: PropTypes.func,
  onCancel: PropTypes.func,
};
