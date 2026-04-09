import {
  MinusOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Button, Modal, Slider, Tooltip } from 'antd';
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { useSelector } from 'react-redux';
import { useReactToPrint } from 'react-to-print';
import styled from 'styled-components';

import { SelectSettingCart } from '@/features/cart/cartSlice';
import { useElementSize } from '@/hooks/useElementSize';
import { Invoice } from '../Invoice/Invoice';
import InvoiceTemplateSelector from '../InvoiceTemplateSelector/InvoiceTemplateSelector';
import {
  LETTER_INVOICE_TEMPLATE_V3_KEY,
  resolveInvoicePreviewTemplate,
  resolveInvoiceSelectionTemplate,
  type InvoicePreviewTemplateKey,
  type InvoiceTemplateStorageKey,
} from '@/utils/invoice/template';
import type { InvoiceSignatureAssets } from '@/types/invoice';

const TEMPLATES_CONFIG = {
  template1: {
    format: 'THERMAL',
    width: '80mm',
    height: 'auto',
    minHeight: '120mm',
    padding: '4mm',
    defaultZoom: 0.8,
  },
  template2: {
    format: 'A4',
    width: '210mm',
    height: '240mm',
    minHeight: 'auto',
    padding: '10mm',
    defaultZoom: 0.5,
  },
  template4: {
    format: '80mm',
    width: '80mm',
    height: 'auto',
    minHeight: '120mm',
    padding: '4mm',
    defaultZoom: 0.8,
  },
} satisfies Record<
  InvoicePreviewTemplateKey,
  {
    format: string;
    width: string;
    height: string;
    minHeight?: string;
    padding: string;
    defaultZoom: number;
  }
>;

const MM_TO_PX = 96 / 25.4;
const MIN_MANUAL_ZOOM = 0.6;
const MAX_MANUAL_ZOOM = 1.8;
const MANUAL_ZOOM_STEP = 0.05;

const PreviewPanel = styled.div`
  display: grid;
  grid-template-rows: min-content minmax(0, 1fr);
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
`;

const PreviewToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;

  @media (width <= 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const PreviewToolbarMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #4b5563;
  font-size: 13px;
  font-weight: 500;
`;

const ZoomControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  min-width: 0;

  @media (width <= 768px) {
    justify-content: space-between;
  }
`;

const ZoomValue = styled.span`
  min-width: 56px;
  color: #111827;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
`;

const ZoomSlider = styled(Slider)`
  width: 160px;
  margin: 0 4px;

  @media (width <= 768px) {
    flex: 1;
    width: auto;
  }
`;

const PreviewViewport = styled.div`
  min-height: 0;
  overflow-x: scroll;
  overflow-y: scroll;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
  background: #f5f5f5;
`;

const PreviewStage = styled.div<{ $width: number; $height: number }>`
  width: max(100%, ${({ $width }) => `${$width}px`});
  height: max(100%, ${({ $height }) => `${$height}px`});
  display: flex;
  justify-content: center;
  align-items: flex-start;
`;

const PaperFrame = styled.div<{ $width: number; $height: number }>`
  position: relative;
  width: ${({ $width }) => `${$width}px`};
  height: ${({ $height }) => `${$height}px`};
  flex: 0 0 auto;
`;

const PaperWrapper = styled.div<{
  $scale: number;
  $naturalWidth: number;
  $naturalHeight: number;
}>`
  position: absolute;
  top: 0;
  left: 0;
  width: ${({ $naturalWidth }) => `${$naturalWidth}px`};
  height: ${({ $naturalHeight }) => `${$naturalHeight}px`};
  transform: scale(${({ $scale }) => $scale});
  transform-origin: top left;
`;

const InvoicePaper = styled.div<{
  $template: InvoicePreviewTemplateKey;
  $selectionTemplate: InvoiceTemplateStorageKey;
}>`
  width: ${({ $template }) => TEMPLATES_CONFIG[$template].width};
  height: ${({ $template }) => TEMPLATES_CONFIG[$template].height};
  min-height: ${({ $template }) =>
    TEMPLATES_CONFIG[$template].minHeight || 'auto'};
  padding: ${({ $template, $selectionTemplate }) =>
    $selectionTemplate === LETTER_INVOICE_TEMPLATE_V3_KEY
      ? '0'
      : TEMPLATES_CONFIG[$template].padding};
  background: white;
  box-shadow: 0 15px 45px rgb(0 0 0 / 12%);
  margin: 0 auto;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  border: 1px solid #e0e0e0;

  @media print {
    width: 100% !important;
    height: auto !important;
    min-height: 0 !important;
    box-shadow: none;
    margin: 0;
    padding: 0;
    border: none;
  }
`;

const PreviewContainer = styled.div`
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
`;

const ModalPreviewShell = styled.div`
  display: flex;
  flex-direction: column;
  height: 70vh;
  min-height: 520px;
  overflow: hidden;
  border-radius: 8px;
  background: #f5f5f5;
`;

const clampZoom = (value: number) =>
  Math.min(MAX_MANUAL_ZOOM, Math.max(MIN_MANUAL_ZOOM, value));

const parseLengthToPx = (value?: string): number | null => {
  if (!value || value === 'auto') return null;

  if (value.endsWith('mm')) {
    return Number.parseFloat(value) * MM_TO_PX;
  }

  if (value.endsWith('px')) {
    return Number.parseFloat(value);
  }

  return Number.isFinite(Number.parseFloat(value))
    ? Number.parseFloat(value)
    : null;
};

type InvoicePreviewWorkspaceProps = {
  componentRef: RefObject<HTMLDivElement | null>;
  template: InvoiceTemplateStorageKey;
  previewTemplate: InvoicePreviewTemplateKey;
  forcedZoom?: number;
  previewSignatureAssets?: InvoiceSignatureAssets;
};

const useClientSize = (ref: RefObject<HTMLElement | null>) => {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const updateSize = () => {
      setSize({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    };

    updateSize();

    const observer = new ResizeObserver(() => {
      updateSize();
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [ref]);

  return size;
};

const StableInvoiceDocument = memo(function StableInvoiceDocument({
  componentRef,
  template,
  previewSignatureAssets,
}: {
  componentRef: RefObject<HTMLDivElement | null>;
  template: InvoiceTemplateStorageKey;
  previewSignatureAssets?: InvoiceSignatureAssets;
}) {
  return (
    <Invoice
      ref={componentRef}
      template={template}
      data={{}}
      ignoreHidden
      previewSignatureAssets={previewSignatureAssets}
    />
  );
});

const InvoicePreviewWorkspace = ({
  componentRef,
  template,
  previewTemplate,
  forcedZoom,
  previewSignatureAssets,
}: InvoicePreviewWorkspaceProps) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const viewportSize = useClientSize(viewportRef);
  const paperSize = useElementSize(paperRef);
  const [manualZoom, setManualZoom] = useState(1);

  const fallbackWidth = useMemo(
    () => parseLengthToPx(TEMPLATES_CONFIG[previewTemplate].width) ?? 640,
    [previewTemplate],
  );
  const fallbackHeight = useMemo(
    () =>
      parseLengthToPx(TEMPLATES_CONFIG[previewTemplate].height) ??
      parseLengthToPx(TEMPLATES_CONFIG[previewTemplate].minHeight) ??
      960,
    [previewTemplate],
  );

  const naturalWidth = paperSize.width || fallbackWidth;
  const naturalHeight = paperSize.height || fallbackHeight;

  const fitScale = useMemo(() => {
    if (!viewportSize.width || !viewportSize.height) {
      return TEMPLATES_CONFIG[previewTemplate].defaultZoom;
    }

    const widthRatio = viewportSize.width / naturalWidth;
    const heightRatio = viewportSize.height / naturalHeight;
    const nextScale = Math.min(widthRatio, heightRatio, 1);
    const roundedScale = Math.round(nextScale * 1000) / 1000;

    return Number.isFinite(roundedScale) && roundedScale > 0
      ? roundedScale
      : TEMPLATES_CONFIG[previewTemplate].defaultZoom;
  }, [
    naturalHeight,
    naturalWidth,
    previewTemplate,
    viewportSize.height,
    viewportSize.width,
  ]);

  const effectiveScale =
    forcedZoom !== undefined ? forcedZoom : fitScale * manualZoom;

  const scaledWidth = naturalWidth * effectiveScale;
  const scaledHeight = naturalHeight * effectiveScale;
  const zoomPercent = Math.round(effectiveScale * 100);

  const handleManualZoomChange = useCallback((value: number) => {
    setManualZoom(clampZoom(value));
  }, []);

  const applyWheelZoom = useCallback((deltaY: number) => {
    setManualZoom((current) =>
      clampZoom(
        current + (deltaY < 0 ? MANUAL_ZOOM_STEP : -MANUAL_ZOOM_STEP),
      ),
    );
  }, []);

  useEffect(() => {
    if (forcedZoom !== undefined) return;

    const viewportNode = viewportRef.current;

    if (!viewportNode) return;

    const handleViewportWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;

      event.preventDefault();
      event.stopPropagation();
      applyWheelZoom(event.deltaY);
    };

    viewportNode.addEventListener('wheel', handleViewportWheel, {
      passive: false,
      capture: true,
    });

    return () => {
      viewportNode.removeEventListener('wheel', handleViewportWheel, true);
    };
  }, [applyWheelZoom, forcedZoom]);

  return (
    <PreviewPanel>
      <PreviewToolbar>
        <PreviewToolbarMeta>
          Vista previa
        </PreviewToolbarMeta>
        {forcedZoom === undefined ? (
          <ZoomControls>
            <Tooltip title="Reducir zoom">
              <Button
                aria-label="Reducir zoom"
                icon={<MinusOutlined />}
                onClick={() =>
                  handleManualZoomChange(manualZoom - MANUAL_ZOOM_STEP)
                }
              />
            </Tooltip>
            <ZoomSlider
              min={MIN_MANUAL_ZOOM}
              max={MAX_MANUAL_ZOOM}
              step={MANUAL_ZOOM_STEP}
              value={manualZoom}
              onChange={(value) =>
                handleManualZoomChange(Array.isArray(value) ? value[0] : value)
              }
              tooltip={{
                formatter: (value) => `${Math.round((value ?? 1) * 100)}%`,
              }}
            />
            <Tooltip title="Aumentar zoom">
              <Button
                aria-label="Aumentar zoom"
                icon={<PlusOutlined />}
                onClick={() =>
                  handleManualZoomChange(manualZoom + MANUAL_ZOOM_STEP)
                }
              />
            </Tooltip>
            <ZoomValue>{zoomPercent}%</ZoomValue>
            <Tooltip title="Volver al ajuste automático">
              <Button
                aria-label="Restablecer zoom"
                icon={<ReloadOutlined />}
                onClick={() => setManualZoom(1)}
              />
            </Tooltip>
          </ZoomControls>
        ) : (
          <ZoomControls>
            <ZoomValue>{zoomPercent}%</ZoomValue>
          </ZoomControls>
        )}
      </PreviewToolbar>
      <PreviewViewport ref={viewportRef}>
        <PreviewStage $width={scaledWidth} $height={scaledHeight}>
          <PaperFrame $width={scaledWidth} $height={scaledHeight}>
            <PaperWrapper
              $scale={effectiveScale}
              $naturalWidth={naturalWidth}
              $naturalHeight={naturalHeight}
            >
              <InvoicePaper
                ref={paperRef}
                $template={previewTemplate}
                $selectionTemplate={template}
              >
                <StableInvoiceDocument
                  componentRef={componentRef}
                  template={template}
                  previewSignatureAssets={previewSignatureAssets}
                />
              </InvoicePaper>
            </PaperWrapper>
          </PaperFrame>
        </PreviewStage>
      </PreviewViewport>
    </PreviewPanel>
  );
};

export default function InvoiceTemplates({
  previewInModal = true,
  hidePreviewButton = false,
  onlySelector = false,
  onlyPreview = false,
  zoom,
  previewSignatureAssets,
}: {
  previewInModal?: boolean;
  hidePreviewButton?: boolean;
  onlySelector?: boolean;
  onlyPreview?: boolean;
  zoom?: number;
  previewSignatureAssets?: InvoiceSignatureAssets;
}) {
  const {
    billing: { invoiceType },
  } = useSelector(SelectSettingCart);

  const derivedTemplate = resolveInvoiceSelectionTemplate(invoiceType);
  const [templateState, setTemplateState] = useState<{
    sourceInvoiceType: InvoiceTemplateStorageKey;
    selectedTemplate: InvoiceTemplateStorageKey;
  }>(() => ({
    sourceInvoiceType: derivedTemplate,
    selectedTemplate: derivedTemplate,
  }));

  const effectiveTemplate =
    templateState.sourceInvoiceType === derivedTemplate
      ? templateState.selectedTemplate
      : derivedTemplate;
  const previewTemplate = resolveInvoicePreviewTemplate(effectiveTemplate);
  const pageStyle = useMemo(
    () =>
      effectiveTemplate === LETTER_INVOICE_TEMPLATE_V3_KEY
        ? '@page { size: A4 portrait; margin: 0; } body { margin: 0 !important; }'
        : undefined,
    [effectiveTemplate],
  );

  const componentRef = useRef<HTMLDivElement | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleTemplateChange = (value: InvoiceTemplateStorageKey) => {
    setTemplateState({
      sourceInvoiceType: derivedTemplate,
      selectedTemplate: value,
    });
  };

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    pageStyle,
  });

  const handlePreview = () => {
    setIsModalVisible(true);
  };

  // Usar el zoom proporcionado o el default de la plantilla
  const previewContent = (
    <PreviewContainer>
      <InvoicePreviewWorkspace
        componentRef={componentRef}
        template={effectiveTemplate}
        previewTemplate={previewTemplate}
        forcedZoom={zoom}
        previewSignatureAssets={previewSignatureAssets}
      />
    </PreviewContainer>
  );

  if (onlySelector) {
    return (
      <InvoiceTemplateSelector
        onSave={handleTemplateChange}
        template={effectiveTemplate}
        onPreview={handlePreview}
        hidePreviewButton={hidePreviewButton || !previewInModal}
      />
    );
  }

  if (onlyPreview) {
    return previewContent;
  }

  return (
    <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
      <InvoiceTemplateSelector
        onSave={handleTemplateChange}
        template={effectiveTemplate}
        onPreview={handlePreview}
        hidePreviewButton={hidePreviewButton}
      />

      <Modal
        title="Previsualización de Factura"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        width={'1100px'}
        centered
        destroyOnHidden
        footer={[
          <Button key="print" onClick={handlePrint} type="primary">
            Imprimir
          </Button>,
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Cerrar
          </Button>,
        ]}
      >
        <ModalPreviewShell>{previewContent}</ModalPreviewShell>
      </Modal>

      {!previewInModal && previewContent}
    </div>
  );
}
