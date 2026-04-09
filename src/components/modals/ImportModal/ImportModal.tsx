import { UploadOutlined } from '@/constants/icons/antd';
import { Button, Modal, Tabs } from 'antd';
import type { TabsProps } from 'antd';
import React, { useMemo } from 'react';
import styled from 'styled-components';

import { ImportTabContent } from './components/ImportTabContent';
import { TemplateTabContent } from './components/TemplateTabContent';
import { useImportModalController } from './hooks/useImportModalController';
import type { ImportModalProps } from './types';

export default function ImportModal({
  open,
  onClose,
  onImport,
  onCreateTemplate,
}: ImportModalProps) {
  const {
    activeTab,
    essential,
    fileList,
    handleAfterClose,
    handleCreateTemplateClick,
    handleFieldsChange,
    handleFileChange,
    handleImportClick,
    handlePreviewClick,
    handleTabChange,
    isImporting,
    isPreviewing,
    language,
    optionalGroups,
    previewColumns,
    previewRows,
    uploadProps,
  } = useImportModalController({
    onClose,
    onCreateTemplate,
    onImport,
  });

  const items: TabsProps['items'] = [
    {
      key: 'import',
      label: 'Importar Datos',
      children: (
        <ImportTabContent
          uploadProps={uploadProps}
          onFileChange={handleFileChange}
          previewRows={previewRows}
          previewColumns={previewColumns}
        />
      ),
    },
    {
      key: 'template',
      label: 'Crear Plantilla',
      children: (
        <TemplateTabContent
          essentialFields={essential}
          optionalGroups={optionalGroups}
          onFieldsChange={handleFieldsChange}
          language={language}
          onCreateTemplateClick={handleCreateTemplateClick}
        />
      ),
    },
  ];

  return (
    <StyledModal
      title="Importar Datos"
      open={open}
      onCancel={onClose}
      afterClose={handleAfterClose}
      footer={
        activeTab === 'import'
          ? [
              <Button key="cancel" onClick={onClose}>
                Cancelar
              </Button>,
              <Button
                key="preview"
                onClick={handlePreviewClick}
                disabled={fileList.length === 0 || isImporting}
                loading={isPreviewing}
              >
                Vista previa
              </Button>,
              <Button
                key="import"
                type="primary"
                onClick={handleImportClick}
                disabled={fileList.length === 0 || isImporting}
                loading={isImporting}
              >
                <UploadOutlined />
                {isImporting ? 'Importando...' : 'Importar'}
              </Button>,
            ]
          : [
              <Button key="cancel" onClick={onClose}>
                Cerrar
              </Button>,
            ]
      }
    >
      <Body>
        <Tabs activeKey={activeTab} onChange={handleTabChange} items={items} />
      </Body>
    </StyledModal>
  );
}

const StyledModal = styled(Modal)`
  .ant-modal-footer {
    display: flex;
    justify-content: space-between;
  }
`;

const Body = styled.div`
  min-height: 15em;
`;
