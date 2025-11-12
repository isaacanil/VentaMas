import { Drawer, Image } from 'antd';
import { useEffect } from 'react';
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

const PreviewContent = ({
  previewFile,
  previewVisible,
  setPreviewVisible,
  setPreviewFile,
}) => {
  const renderPreview = () => {
    if (!previewFile) return null;

    const extension = previewFile.name.split('.').pop().toLowerCase();
    const fileUrl =
      previewFile.url ||
      previewFile.preview ||
      (previewFile.file && URL.createObjectURL(previewFile.file));

    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
      return (
        <Image
          src={fileUrl}
          alt={previewFile.name}
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      );
    }

    if (extension === 'pdf') {
      return (
        <PDFContainer>
          <embed
            src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1&zoom=100`}
            type="application/pdf"
          />
        </PDFContainer>
      );
    }

    return <p>No hay vista previa disponible para este tipo de archivo</p>;
  };

  // Cleanup function for local URLs
  useEffect(() => {
    let localUrl;
    if (previewFile?.file instanceof File) {
      localUrl = URL.createObjectURL(previewFile.file);
    }
    return () => {
      if (localUrl) URL.revokeObjectURL(localUrl);
    };
  }, [previewFile]);

  return (
    <Drawer
      open={previewVisible}
      onClose={() => {
        setPreviewVisible(false);
        setPreviewFile(null);
      }}
      width="80%"
      height="100%"
      title={previewFile?.name}
      placement="bottom"
      footer={null}
      styles={{
        content: {
          height: '100%',
          padding: 0,
          margin: 0,
        },
        body: {
          padding: '0',
          margin: '0',
          height: '100%',
          overflow: 'hidden',
        },
      }}
    >
      <PreviewContainer>{renderPreview()}</PreviewContainer>
    </Drawer>
  );
};

export default PreviewContent;
