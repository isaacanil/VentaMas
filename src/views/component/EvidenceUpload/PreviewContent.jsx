import { Drawer, Image, Spin, Alert } from 'antd';
import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';

const PreviewContainer = styled.div`
  max-width: 100%;
  height: 100%;
`;

const PDFContainer = styled.div`
  height: 100%;
  margin: 0;
  padding: 0;
  width: 100%;
  
  embed {
    width: 100%;
    height: 100%;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 4px;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
`;

const AccessibleStatus = styled.div`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
`;

const PreviewContent = ({ previewFile, previewVisible, setPreviewVisible, setPreviewFile }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pdfLoadAttempts, setPdfLoadAttempts] = useState(0);

  const handlePdfLoad = useCallback(() => {
    setIsLoading(false);
    setPdfLoadAttempts(0);
  }, []);

  const handlePdfError = useCallback(() => {
    if (pdfLoadAttempts < 2) {
      setPdfLoadAttempts(prev => prev + 1);
      // Reintento con un pequeño delay
      setTimeout(() => setIsLoading(true), 1000);
    } else {
      setIsLoading(false);
      setError('No se pudo cargar el PDF. Por favor, verifique su conexión o intente abrirlo en una nueva pestaña.');
    }
  }, [pdfLoadAttempts]);

  const renderPreview = () => {
    if (!previewFile) return null;
    
    const extension = previewFile.name.split('.').pop().toLowerCase();
    const fileUrl = previewFile.url || previewFile.preview || (previewFile.file && URL.createObjectURL(previewFile.file));
    
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
      return (
        <>
          <AccessibleStatus role="status" aria-live="polite">
            {isLoading ? 'Cargando imagen...' : error ? error : 'Imagen cargada'}
          </AccessibleStatus>
          <Image
            src={fileUrl}
            alt={previewFile.name}
            style={{ maxWidth: '100%', height: 'auto' }}
            placeholder={
              <LoadingContainer>
                <Spin size="large" tip="Cargando imagen..." />
              </LoadingContainer>
            }
            onError={() => setError('No se pudo cargar la imagen. Verifique su conexión o permisos de acceso.')}
          />
        </>
      );
    }
    
    if (extension === 'pdf') {
      return (
        <PDFContainer>
          <AccessibleStatus role="status" aria-live="polite">
            {isLoading ? 'Cargando PDF...' : error ? error : 'PDF cargado'}
          </AccessibleStatus>
          {isLoading && (
            <LoadingContainer>
              <Spin size="large" tip={`Cargando PDF${pdfLoadAttempts > 0 ? ` (intento ${pdfLoadAttempts + 1}/3)` : ''}`} />
            </LoadingContainer>
          )}
          <embed
            src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1&zoom=100`}
            type="application/pdf"
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
      );
    }

    return <p>No hay vista previa disponible para este tipo de archivo</p>;
  };

  useEffect(() => {
    let localUrl;
    if (previewFile) {
      setIsLoading(true);
      setError(null);
      
      if (previewFile.file instanceof File) {
        localUrl = URL.createObjectURL(previewFile.file);
      }
    }
    
    return () => {
      if (localUrl) URL.revokeObjectURL(localUrl);
      setError(null);
      setIsLoading(false);
    };
  }, [previewFile]);

  return (
    <Drawer
      open={previewVisible}
      onClose={() => {
        setPreviewVisible(false);
        setPreviewFile(null);
        setPdfLoadAttempts(0);
      }}
      width={window.innerWidth <= 768 ? '100%' : '80%'}
      height='100%'
      title={previewFile?.name}
      placement={window.innerWidth <= 768 ? "right" : "bottom"}
      footer={null}
      styles={{
        content: {
          height: '100%',
          padding: 0,
          margin: 0
        },
        body: {
          padding: '0',
          margin: '0',
          height: '100%',
          overflow: 'hidden',
        }
      }}
    >
      <PreviewContainer>
        {renderPreview()}
      </PreviewContainer>
    </Drawer>
  );
};

export default PreviewContent;