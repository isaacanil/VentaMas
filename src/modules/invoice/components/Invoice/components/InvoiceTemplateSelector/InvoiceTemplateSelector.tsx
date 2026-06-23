import {
  autoUpdate,
  flip,
  offset as floatingOffset,
  shift,
  size,
  useFloating,
} from '@floating-ui/react';
import { Button, message, Tooltip, Typography, Tag } from 'antd';
import {
  DownOutlined,
  EyeOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import {
  SelectSettingCart,
  setBillingSettings as setCartBillingSettings,
} from '@/features/cart/cartSlice';
import { setBillingSettings as saveBillingSettings } from '@/firebase/billing/billingSetting';
import { useClickOutSide } from '@/hooks/useClickOutSide';
import type { UserIdentity } from '@/types/users';
import { hasDeveloperAccess } from '@/utils/access/developerAccess';
import { isFrontendFeatureEnabled } from '@/utils/runtime/frontendFeatureAccess';
import {
  PAGINATED_DOM_INVOICE_TEMPLATE_KEY,
  isDeprecatedInvoiceTemplate,
  type InvoiceTemplateStorageKey,
} from '@/utils/invoice/template';

const { Text } = Typography;

const StyledContainer = styled.div`
  width: 100%;
`;

const SummaryButton = styled.button`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  padding: 12px;
  border: 1px solid #d9d9d9;
  border-radius: 10px;
  background: #fafafa;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.16s ease,
    background-color 0.16s ease;

  &:hover {
    border-color: #bfbfbf;
  }
`;

const SummaryContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
`;

const SummaryHeading = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SummaryMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
`;

const SummaryFooter = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
`;

const SummaryTemplateName = styled.span`
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  color: rgba(0, 0, 0, 0.65);
  font-size: 14px;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: help;
`;

const Chevron = styled(DownOutlined)<{ $expanded: boolean }>`
  color: rgba(0, 0, 0, 0.45);
  transition: transform 0.16s ease;
  transform: rotate(${({ $expanded }) => ($expanded ? '180deg' : '0deg')});
`;

const StatusIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(0, 0, 0, 0.45);
`;

const FloatingPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0;
  overflow: hidden;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 10px 30px rgb(0 0 0 / 12%);
  z-index: 1200;
`;

const ActionsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 0 12px 12px;
`;

const PreviewButton = styled(Button)`
  border-radius: 8px;
`;

type InvoiceTemplateOption = {
  id: InvoiceTemplateStorageKey;
  name: string;
  description: string;
};

const BASE_INVOICE_TEMPLATES: InvoiceTemplateOption[] = [
  {
    id: 'template1',
    name: 'Plantilla Compacta 1',
    description: 'Impresora Térmica 80mm',
  },
  {
    id: 'template4',
    name: 'Plantilla Compacta 2',
    description: 'Impresora Matricial',
  },
  {
    id: 'template2',
    name: 'Plantilla Carta',
    description: 'Impresora Regular / PDF',
  },
];

const LETTER_INVOICE_TEMPLATE_OPTIONS: InvoiceTemplateOption[] = [
  {
    id: PAGINATED_DOM_INVOICE_TEMPLATE_KEY,
    name: 'Plantilla Carta Paginada',
    description: 'Motor DOM propio con header y footer por página',
  },
];

interface InvoiceTemplateSelectorProps {
  onSave?: (value: InvoiceTemplateStorageKey) => void;
  onPreview?: () => void;
  template?: InvoiceTemplateStorageKey;
  hidePreviewButton?: boolean;
}

const InvoiceTemplateSelector = ({
  onSave,
  onPreview,
  template,
  hidePreviewButton,
}: InvoiceTemplateSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const user = useSelector(selectUser) as UserIdentity | null;
  const currentBillingSettings = useSelector(SelectSettingCart).billing;
  const { refs, floatingStyles } = useFloating({
    placement: 'bottom-start',
    whileElementsMounted: autoUpdate,
    middleware: [
      floatingOffset(10),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      size({
        apply({ rects, elements }) {
          Object.assign(elements.floating.style, {
            width: `${rects.reference.width}px`,
          });
        },
      }),
    ],
  });
  const isTemplateV2Enabled =
    isFrontendFeatureEnabled('invoiceTemplateV2Beta') ||
    hasDeveloperAccess(user);
  const isHiddenLetterTemplate = isDeprecatedInvoiceTemplate(template);
  const selectedTemplate =
    !isTemplateV2Enabled &&
    (isHiddenLetterTemplate || template === PAGINATED_DOM_INVOICE_TEMPLATE_KEY)
      ? 'template2'
      : isTemplateV2Enabled && isHiddenLetterTemplate
        ? PAGINATED_DOM_INVOICE_TEMPLATE_KEY
        : template;

  const invoiceTemplates = useMemo(
    () =>
      isTemplateV2Enabled
        ? [...BASE_INVOICE_TEMPLATES, ...LETTER_INVOICE_TEMPLATE_OPTIONS]
        : BASE_INVOICE_TEMPLATES,
    [isTemplateV2Enabled],
  );
  const selectedTemplateMeta = useMemo(
    () =>
      invoiceTemplates.find((item) => item.id === selectedTemplate) ??
      invoiceTemplates[0],
    [invoiceTemplates, selectedTemplate],
  );
  const setReference = useCallback(
    (node: HTMLElement | null) => refs.setReference(node),
    [refs],
  );
  const setFloating = useCallback(
    (node: HTMLElement | null) => refs.setFloating(node),
    [refs],
  );

  useClickOutSide(containerRef, isOpen, () => setIsOpen(false));

  const handleTemplateChange = (value: InvoiceTemplateStorageKey) => {
    void saveBillingSettings(user, { invoiceType: value }).then(
      () => {
        dispatch(
          setCartBillingSettings({
            ...currentBillingSettings,
            invoiceType: value,
            isError: false,
            isLoading: false,
          }),
        );
        onSave?.(value);
        message.success('Plantilla de factura actualizada');
        setIsOpen(false);
      },
      () => {
        message.error('Error al actualizar la plantilla');
      },
    );
  };

  const formatTag =
    selectedTemplateMeta?.id === PAGINATED_DOM_INVOICE_TEMPLATE_KEY
      ? 'Paginada'
      : selectedTemplateMeta?.id === 'template2'
        ? 'Carta'
        : 'Compacta';

  return (
    <StyledContainer ref={containerRef}>
      <SummaryButton
        ref={setReference}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <SummaryContent>
          <SummaryHeading>
            <FileTextOutlined />
            <Text strong>Plantilla de factura</Text>
          </SummaryHeading>
          <SummaryMeta>
            <Tag>{formatTag}</Tag>
            {!hidePreviewButton && onPreview && (
              <Tooltip title="Abrir vista previa de la factura">
                <StatusIcon>
                  <EyeOutlined />
                </StatusIcon>
              </Tooltip>
            )}
            <Tooltip title="Selecciona el formato de impresión o PDF de la factura.">
              <StatusIcon>
                <InfoCircleOutlined />
              </StatusIcon>
            </Tooltip>
            <Chevron $expanded={isOpen} />
          </SummaryMeta>
        </SummaryContent>
        <SummaryFooter>
          {selectedTemplateMeta ? (
            <Tooltip title={selectedTemplateMeta.description}>
              <SummaryTemplateName>
                {selectedTemplateMeta.name}
              </SummaryTemplateName>
            </Tooltip>
          ) : (
            <Text type="secondary">
              Configura el formato de salida del documento.
            </Text>
          )}
        </SummaryFooter>
      </SummaryButton>

      {isOpen && (
        <FloatingPanel ref={setFloating} style={floatingStyles}>
          <OptionList>
            {invoiceTemplates.map((item) => (
              <OptionItem
                key={item.id}
                $selected={selectedTemplate === item.id}
                onClick={() => handleTemplateChange(item.id)}
              >
                <OptionName>{item.name}</OptionName>
                <OptionDescription>{item.description}</OptionDescription>
              </OptionItem>
            ))}
          </OptionList>
          {!hidePreviewButton && onPreview && (
            <ActionsRow>
              <PreviewButton
                type="default"
                icon={<EyeOutlined />}
                onClick={(event) => {
                  event.stopPropagation();
                  onPreview();
                }}
              >
                Vista previa
              </PreviewButton>
            </ActionsRow>
          )}
        </FloatingPanel>
      )}
    </StyledContainer>
  );
};

const OptionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 220px;
  overflow-y: auto;
  padding: 12px 0 12px 12px;
`;

const OptionItem = styled.button<{ $selected: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding: 10px 12px;
  border: 1.5px solid ${({ $selected }) => ($selected ? '#1677ff' : '#d9d9d9')};
  border-radius: 8px;
  background: ${({ $selected }) => ($selected ? '#e6f4ff' : '#fff')};
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;

  &:hover {
    border-color: #1677ff;
  }
`;

const OptionName = styled.div`
  font-weight: 600;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.88);
`;

const OptionDescription = styled.div`
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
`;

export default InvoiceTemplateSelector;
