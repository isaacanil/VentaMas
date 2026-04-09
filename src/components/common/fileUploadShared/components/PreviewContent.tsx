import { Alert, Drawer, Image, Spin } from 'antd';
import { useCallback, useState } from 'react';
import styled from 'styled-components';

import type { PreviewableFile } from '../types';

const PreviewContainer = styled.div`
  max-width: 100%;
  height: 100%;
`;

const PDFContainer = styled.div`
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;

  iframe {
    width: 100%;
    height: 100%;
    border: 1px solid rgb(0 0 0 / 10%);
    border-radius: 4px;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
`;

const AccessibleStatus = styled.div`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  border: 0;
  clip-path: inset(50%);
`;

export type PreviewContentProps<TFile extends PreviewableFile = PreviewableFile> = {
  previewFile: TFile | null;
  previewVisible: boolean;
  setPreviewVisible: (value: boolean) => void;
  setPreviewFile: (file: TFile | null) => void;
};

const PreviewContentInner = <TFile extends PreviewableFile>({
  previewFile,
  previewVisible,
  setPreviewVisible,
  setPreviewFile,
}: PreviewContentProps<TFile>) => {
  const [isLoading, setIsLoading] = useState(
    Boolean(previewVisible && previewFile),
  );
  const [error, setError] = useState<string | null>(null);
  const [pdfLoadAttempts, setPdfLoadAttempts] = useState(0);

  const handlePdfLoad = useCallback(() => {
    setIsLoading(false);
    setPdfLoadAttempts(0);
  }, []);

  const handlePdfError = useCallback(() => {
    if (pdfLoadAttempts < 2) {
      setPdfLoadAttempts((prev) => prev + 1);
      window.setTimeout(() => setIsLoading(true), 1000);
      return;
    }

    setIsLoading(false);
    setError(
      'No se pudo cargar el PDF. Por favor, verifique su conexión o intente abrirlo en una nueva pestaña.',
    );
  }, [pdfLoadAttempts]);

  const fileName = previewFile?.name ?? 'Archivo';
  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
  const fileUrl = previewFile?.url ?? previewFile?.preview ?? '';
  const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(extension);
  const imageStatus = isLoading
    ? 'Cargando imagen...'
    : error
      ? error
      : 'Imagen cargada';
  const pdfStatus = isLoading ? 'Cargando PDF...' : error ? error : 'PDF cargado';

  const previewContent = !previewFile ? null : isImage ? (
    <>
      <AccessibleStatus role="status" aria-live="polite">
        {imageStatus}
      </AccessibleStatus>
      <Image
        src={fileUrl}
        alt={fileName}
        style={{ maxWidth: '100%', height: 'auto' }}
        placeholder={
          <LoadingContainer>
            <Spin size="large" tip="Cargando imagen...">
              <div style={{ width: '100%', minHeight: 160 }} />
            </Spin>
          </LoadingContainer>
        }
        onError={() =>
          setError(
            'No se pudo cargar la imagen. Verifique su conexión o permisos de acceso.',
          )
        }
      />
    </>
  ) : extension === 'pdf' ? (
    <PDFContainer>
      <AccessibleStatus role="status" aria-live="polite">
        {pdfStatus}
      </AccessibleStatus>
      {isLoading && (
        <LoadingContainer>
          <Spin
            size="large"
            tip={`Cargando PDF${pdfLoadAttempts > 0 ? ` (intento ${pdfLoadAttempts + 1}/3)` : ''}`}
          >
            <div style={{ width: '100%', minHeight: 160 }} />
          </Spin>
        </LoadingContainer>
      )}
      <iframe
        title={`${fileName} preview`}
        src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1&zoom=100`}
        style={{ display: isLoading ? 'none' : 'block' }}
        onLoad={handlePdfLoad}
        onError={handlePdfError}
      />
      {error && (
        <Alert
          message="Error al cargar el PDF"
          description={
            <>
              {error}
              <br />
              <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                Abrir en nueva pestaña
              </a>
            </>
          }
          type="error"
          showIcon
          style={{ margin: '20px' }}
        />
      )}
    </PDFContainer>
  ) : (
    <p>No hay vista previa disponible para este tipo de archivo</p>
  );

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  return (
    <Drawer
      open={previewVisible}
      onClose={() => {
        setPreviewVisible(false);
        setPreviewFile(null);
        setPdfLoadAttempts(0);
      }}
      width={isMobile ? '100%' : '80%'}
      height="100%"
      title={previewFile?.name}
      placement={isMobile ? 'right' : 'bottom'}
      footer={null}
      styles={{
        body: {
          padding: '0',
          margin: '0',
          height: '100%',
          overflow: 'hidden',
        },
      }}
    >
      <PreviewContainer>{previewContent}</PreviewContainer>
    </Drawer>
  );
};

const PreviewContent = <TFile extends PreviewableFile>(
  props: PreviewContentProps<TFile>,
) => {
  const { previewFile, previewVisible } = props;
  const previewKey =
    previewVisible && previewFile
      ? `${previewFile.id ?? previewFile.name ?? 'archivo'}|${
          previewFile.url ?? previewFile.preview ?? ''
        }`
      : 'empty';

  return <PreviewContentInner key={previewKey} {...props} />;
};

export default PreviewContent;
