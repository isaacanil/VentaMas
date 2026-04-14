import {
  autoUpdate,
  flip,
  offset as floatingOffset,
  shift,
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
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import { setBillingSettings } from '@/firebase/billing/billingSetting';
import { useClickOutSide } from '@/hooks/useClickOutSide';
import type { UserIdentity } from '@/types/users';
import { hasDeveloperAccess } from '@/utils/access/developerAccess';
import { isFrontendFeatureEnabled } from '@/utils/runtime/frontendFeatureAccess';
import {
  LETTER_INVOICE_TEMPLATE_V2_KEY,
  LETTER_INVOICE_TEMPLATE_V3_KEY,
  LETTER_INVOICE_TEMPLATE_V3_1_KEY,
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

const BASE_INVOICE_TEMPLATES: Array<{
  id: InvoiceTemplateStorageKey;
  name: string;
  description: string;
}> = [
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
  const user = useSelector(selectUser) as UserIdentity | null;
  const { refs, floatingStyles } = useFloating({
    placement: 'bottom-start',
    whileElementsMounted: autoUpdate,
    middleware: [floatingOffset(10), flip({ padding: 8 }), shift({ padding: 8 })],
  });
  const isTemplateV2Enabled =
    isFrontendFeatureEnabled('invoiceTemplateV2Beta') ||
    hasDeveloperAccess(user);
  const selectedTemplate =
    !isTemplateV2Enabled &&
    (template === LETTER_INVOICE_TEMPLATE_V2_KEY ||
      template === LETTER_INVOICE_TEMPLATE_V3_KEY ||
      template === LETTER_INVOICE_TEMPLATE_V3_1_KEY)
      ? 'template2'
      : template;

  const invoiceTemplates = useMemo(
    () =>
      isTemplateV2Enabled
        ? [
            ...BASE_INVOICE_TEMPLATES,
            {
              id: LETTER_INVOICE_TEMPLATE_V2_KEY,
              name: 'Plantilla Carta V2',
              description: 'Beta para pruebas internas en dev/staging',
            },
            {
              id: LETTER_INVOICE_TEMPLATE_V3_KEY,
              name: 'Plantilla Carta V3 HTML',
              description: 'Beta HTML/CSS con impresión del navegador',
            },
            {
              id: LETTER_INVOICE_TEMPLATE_V3_1_KEY,
              name: 'Plantilla Carta V3.1 HTML',
              description: 'Beta HTML/CSS paginada para evitar saltos rotos',
            },
          ]
        : BASE_INVOICE_TEMPLATES,
    [isTemplateV2Enabled],
  );
  const selectedTemplateMeta = useMemo(
    () =>
      invoiceTemplates.find((item) => item.id === selectedTemplate) ??
      invoiceTemplates[0],
    [invoiceTemplates, selectedTemplate],
  );
  const referenceWidth =
    refs.reference.current instanceof HTMLElement
      ? refs.reference.current.getBoundingClientRect().width
      : null;
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
    void setBillingSettings(user, { invoiceType: value }).then(
      () => {
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
    selectedTemplateMeta?.id === 'template2' ||
    selectedTemplateMeta?.id === LETTER_INVOICE_TEMPLATE_V2_KEY ||
    selectedTemplateMeta?.id === LETTER_INVOICE_TEMPLATE_V3_KEY ||
    selectedTemplateMeta?.id === LETTER_INVOICE_TEMPLATE_V3_1_KEY
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
              <SummaryTemplateName>{selectedTemplateMeta.name}</SummaryTemplateName>
            </Tooltip>
          ) : (
            <Text type="secondary">
              Configura el formato de salida del documento.
            </Text>
          )}
        </SummaryFooter>
      </SummaryButton>

      {isOpen && (
        <FloatingPanel
          ref={setFloating}
          style={{
            ...floatingStyles,
            width: referenceWidth ?? undefined,
          }}
        >
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
