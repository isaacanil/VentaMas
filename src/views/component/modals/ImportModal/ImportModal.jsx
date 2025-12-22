import { FileAddOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Upload, Modal, message, Tabs, Table } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { getAvailableHeaders } from '../../../../utils/import/product/filterEssentialHeaders';
import { productHeaderMappings } from '../../../../utils/import/product/headerMappings';

import FieldSelector from './FieldSelector';

const PREVIEW_LIMIT = 20;

export default function ImportModal({
  open,
  onClose,
  onImport,
  onCreateTemplate,
}) {
  const [fileList, setFileList] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [activeTab, setActiveTab] = useState('import');
  const [selectedOptionalFields, setSelectedOptionalFields] = useState([]);
  const [language] = useState('es'); // Por defecto español, podría ser configurable en el futuro

  // Obtener los campos disponibles
  const { essential, optionalGroups } = getAvailableHeaders(
    productHeaderMappings,
    language,
  );

  const handleImportClick = async () => {
    if (fileList.length > 0 && fileList[0].originFileObj) {
      setIsImporting(true);
      try {
        await onImport(fileList[0].originFileObj);
        setFileList([]);
        setPreviewData([]);
        onClose();
        message.success('Datos importados exitosamente');
      } catch (error) {
        console.error('Error al importar datos:', error);
        message.error(
          'Hubo un problema al importar los datos. Por favor, verifica el archivo e intenta de nuevo.',
        );
      } finally {
        setIsImporting(false);
      }
    } else {
      message.error('Por favor, selecciona un archivo válido para importar.');
    }
  };

  const handleCreateTemplateClick = async () => {
    try {
      await onCreateTemplate(language, selectedOptionalFields);
      message.success('Plantilla creada exitosamente.');
    } catch (error) {
      console.error('Error al crear la plantilla:', error);
      message.error('Hubo un problema al crear la plantilla.');
    }
  };

  const handlePreviewClick = async () => {
    if (!fileList.length || !fileList[0].originFileObj) {
      message.error('Por favor, selecciona un archivo válido para previsualizar.');
      return;
    }
    setIsPreviewing(true);
    try {
      const data = await onImport(fileList[0].originFileObj, { dryRun: true });
      setPreviewData(Array.isArray(data) ? data : []);
      if (!data?.length) {
        message.warning('El archivo no contiene filas para mostrar.');
      }
    } catch (error) {
      console.error('Error al generar vista previa:', error);
      message.error('No se pudo generar la vista previa del archivo.');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleFieldsChange = (fields) => {
    setSelectedOptionalFields(fields);
  };

  const handleFileChange = ({ file, fileList }) => {
    setFileList(fileList);
    setPreviewData([]);

    if (file.status === 'done') {
      message.success(`${file.name} se ha seleccionado correctamente.`);
    } else if (file.status === 'error') {
      message.error(`${file.name} no se pudo seleccionar.`);
    }
  };

  useEffect(() => {
    if (!open) {
      setFileList([]);
      setPreviewData([]);
    }
  }, [open]);

  const isValidFileType = (file) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/csv',
      'text/x-csv',
      'application/x-csv',
      'text/comma-separated-values',
      'text/x-comma-separated-values',
    ];

    if (validTypes.includes(file.type)) {
      return true;
    }

    const validExtensions = ['xlsx', 'csv'];
    const extension = file.name.split('.').pop().toLowerCase();

    // Verificar específicamente archivos .xls y mostrar error informativo
    if (extension === 'xls') {
      message.error({
        content: (
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
              ❌ Archivo .xls no compatible
            </div>
            <div style={{ marginBottom: '4px' }}>
              💡 <strong>Soluciones:</strong>
            </div>
            <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
              • Guarda el archivo como .xlsx desde Excel
              <br />
              • Exporta como CSV desde Excel
              <br />• Usa LibreOffice para convertir a .xlsx
            </div>
          </div>
        ),
        duration: 8,
      });
      return false;
    }

    return validExtensions.includes(extension);
  };

  const uploadProps = {
    onRemove: () => {
      setFileList([]);
      setPreviewData([]);
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

  const flattenObject = useCallback(function flattenObjectInner(
    obj,
    parentKey = '',
    result = {},
  ) {
    if (obj === null || obj === undefined) {
      result[parentKey || 'valor'] = obj;
      return result;
    }

    if (Array.isArray(obj)) {
      result[parentKey || '[]'] = obj
        .map((item) => (typeof item === 'object' ? JSON.stringify(item) : item))
        .join(', ');
      return result;
    }

    if (typeof obj !== 'object') {
      result[parentKey || 'valor'] = obj;
      return result;
    }

    Object.entries(obj || {}).forEach(([key, value]) => {
      const newKey = parentKey ? `${parentKey}.${key}` : key;

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        flattenObjectInner(value, newKey, result);
      } else if (Array.isArray(value)) {
        result[newKey] = value
          .map((item) =>
            typeof item === 'object' ? JSON.stringify(item) : item,
          )
          .join(', ');
      } else {
        result[newKey] = value;
      }
    });

    return result;
  }, []);

  const previewRows = useMemo(
    () =>
      previewData.slice(0, PREVIEW_LIMIT).map((row, index) => ({
        key: index,
        ...flattenObject(row),
      })),
    [previewData, flattenObject],
  );

  const previewColumns = useMemo(() => {
    if (!previewRows.length) return [];
    return Object.keys(previewRows[0]).map((dataIndex) => ({
      title: dataIndex,
      dataIndex,
      ellipsis: true,
    }));
  }, [previewRows]);

  const items = [
    {
      key: 'import',
      label: 'Importar Datos',
      children: (
        <Section>
          <p>
            Selecciona un archivo Excel (.xlsx) o CSV para importar datos al
            sistema.
          </p>
          <p>
            ⚠️ <strong>Nota:</strong> Los archivos .xls antiguos no son
            compatibles. Por favor, guárdalos como .xlsx o CSV desde Excel.
          </p>
          <p>
            Asegúrate de que los datos estén organizados de acuerdo a la
            plantilla de importación.
          </p>

          <Upload {...uploadProps} onChange={handleFileChange} maxCount={1}>
            <Button icon={<UploadOutlined />}>Elegir archivo</Button>
          </Upload>

          {previewRows.length > 0 && (
            <PreviewSection>
              <p>
                Vista previa (primeras {PREVIEW_LIMIT} filas). Confirma que los
                datos se ven correctos antes de importar.
              </p>
              <Table
                size="small"
                pagination={false}
                dataSource={previewRows}
                columns={previewColumns}
                scroll={{ x: true, y: 320 }}
              />
            </PreviewSection>
          )}
        </Section>
      ),
    },
    {
      key: 'template',
      label: 'Crear Plantilla',
      children: (
        <Section>
          <p>
            Crea una plantilla personalizada seleccionando los campos que
            necesitas.
          </p>
          <p>Los campos esenciales siempre se incluirán en la plantilla.</p>

          <FieldSelector
            essentialFields={essential}
            optionalGroups={optionalGroups}
            onFieldsChange={handleFieldsChange}
            language={language}
          />

          <Button
            type="primary"
            onClick={handleCreateTemplateClick}
            icon={<FileAddOutlined />}
          >
            Crear Plantilla
          </Button>
        </Section>
      ),
    },
  ];

  return (
    <StyledModal
      title="Importar Datos"
      open={open}
      onCancel={onClose}
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
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} />
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

const PreviewSection = styled.div`
  margin-top: 1.5em;

  .ant-table {
    background: #fff;
  }
`;
