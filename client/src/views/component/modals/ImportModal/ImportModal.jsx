import React, { useEffect, useState } from 'react';
import * as antd from 'antd';
const { Button, Upload, Modal, message } = antd;
import { FileAddOutlined, UploadOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { importProductData } from '../../../../utils/import/product';


export default function ImportModal({ open, onClose, onImport, onCreateTemplate }) {
  const [fileList, setFileList] = useState([]);
  const [isImporting, setIsImporting] = useState(false);

  const handleImportClick = async () => {
    if (fileList.length > 0 && fileList[0].originFileObj) {
      setIsImporting(true);
      try {
 
       await onImport(fileList[0].originFileObj,);
       setFileList([]);
        onClose();
        message.success('Datos importados exitosamente');
      } catch (error) {
        console.error('Error al importar datos:', error);
        message.error('Hubo un problema al importar los datos. Por favor, verifica el archivo e intenta de nuevo.');
      } finally {
        setIsImporting(false);
      }
    } else {
      message.error('Por favor, selecciona un archivo válido para importar.');
    }
  };

  const handleCreateTemplateClick = async () => {
    try {
      await onCreateTemplate(); 
      message.success('Plantilla creada exitosamente.');
    } catch (error) {
      console.error('Error al crear la plantilla:', error);
      message.error('Hubo un problema al crear la plantilla.');
    }
  };

  const handleFileChange = ({ file, fileList }) => {
    setFileList(fileList);

    if (file.status === 'done') {
      message.success(`${file.name} se ha seleccionado correctamente.`);
    } else if (file.status === 'error') {
      message.error(`${file.name} no se pudo seleccionar.`);
    }
  };
  useEffect(() => {
    if (!open) {
      setFileList([]);
    }
  }, [open]);

  const isValidFileType = (file) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/x-excel',
      'application/x-msexcel',
      'application/excel',
      'application/spreadsheet',
      'text/csv',
      'application/csv',
      'text/x-csv',
      'application/x-csv',
      'text/comma-separated-values',
      'text/x-comma-separated-values'
    ];

    if (validTypes.includes(file.type)) {
      return true;
    }

    const validExtensions = ['xlsx', 'xls', 'csv'];
    const extension = file.name.split('.').pop().toLowerCase();
    return validExtensions.includes(extension);
  };

  const uploadProps = {
    onRemove: () => {
      setFileList([]);
    },
    beforeUpload: (file) => {
      if (!isValidFileType(file)) {
        message.error('Solo se permiten archivos Excel (.xlsx, .xls) o CSV.');
        return Upload.LIST_IGNORE;
      }
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('El archivo debe ser menor a 10MB.');
        return Upload.LIST_IGNORE;
      }
      return false; // Prevent auto upload
    },
    fileList,
  };

  return (
    <StyledModal
      title="Importar Datos"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancelar
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
      ]}
    >
      <Body>
      <Section>
          <p>Si aún no tienes una plantilla, puedes crear una para asegurarte de que los datos se importen correctamente.</p>
          <Button 
            type="dashed" 
            onClick={handleCreateTemplateClick} 
            icon={<FileAddOutlined />}
          >
            Crear Plantilla
          </Button>
        </Section>
        <Section>
          <p>Selecciona un archivo Excel (.xlsx, .xls)  para importar datos al sistema.</p>
          <p> Asegúrate de que los datos estén organizados de acuerdo a la plantilla de importación.</p>
          
          <Upload
            {...uploadProps}
            onChange={handleFileChange}
            maxCount={1}
          >
            <Button icon={<UploadOutlined />}>Elegir archivo</Button>
          </Upload>
        </Section>
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

const Section = styled.div`
  margin-bottom: 2em;
  p {
    margin-bottom: 1em;
  }
`;