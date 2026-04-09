import { message, Upload } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UploadProps } from 'antd/es/upload/interface';
import { useMemo, useReducer } from 'react';

import { getAvailableHeaders } from '@/utils/import/product/filterEssentialHeaders';
import { productHeaderMappings } from '@/utils/import/product/headerMappings';

import type { ImportLanguage, ImportModalProps, PreviewRow } from '../types';
import {
  PREVIEW_LIMIT,
  flattenPreviewObject,
  importModalUiReducer,
  initialImportModalUiState,
} from '../utils/importModal';

const isValidFileType = (file: File) => {
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/csv',
    'text/x-csv',
    'application/x-csv',
    'text/comma-separated-values',
    'text/x-comma-separated-values',
  ];

  if (file.type && validTypes.includes(file.type)) {
    return true;
  }

  const validExtensions = ['xlsx', 'csv'];
  const extension = file.name?.split('.').pop()?.toLowerCase() || '';

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

export const useImportModalController = ({
  onClose,
  onCreateTemplate,
  onImport,
}: Pick<ImportModalProps, 'onClose' | 'onCreateTemplate' | 'onImport'>) => {
  const [uiState, dispatchUi] = useReducer(
    importModalUiReducer,
    initialImportModalUiState,
  );
  const {
    activeTab,
    fileList,
    isImporting,
    isPreviewing,
    previewData,
    selectedOptionalFields,
  } = uiState;
  const language: ImportLanguage = 'es';
  const { essential, optionalGroups } = getAvailableHeaders(
    productHeaderMappings,
    language,
  );

  const handleImportClick = () => {
    if (!fileList.length || !fileList[0].originFileObj) {
      message.error('Por favor, selecciona un archivo válido para importar.');
      return;
    }

    const selectedFile = fileList[0].originFileObj as File;
    dispatchUi({ type: 'patch', patch: { isImporting: true } });

    void Promise.resolve()
      .then(() => onImport(selectedFile))
      .then(
        () => {
          dispatchUi({ type: 'resetImportState' });
          onClose();
          message.success('Datos importados exitosamente');
        },
        (error) => {
          console.error('Error al importar datos:', error);
          message.error(
            'Hubo un problema al importar los datos. Por favor, verifica el archivo e intenta de nuevo.',
          );
        },
      )
      .then(() => {
        dispatchUi({ type: 'patch', patch: { isImporting: false } });
      });
  };

  const handleCreateTemplateClick = () => {
    void Promise.resolve()
      .then(() => onCreateTemplate(language, selectedOptionalFields))
      .then(
        () => {
          message.success('Plantilla creada exitosamente.');
        },
        (error) => {
          console.error('Error al crear la plantilla:', error);
          message.error('Hubo un problema al crear la plantilla.');
        },
      );
  };

  const handlePreviewClick = () => {
    if (!fileList.length || !fileList[0].originFileObj) {
      message.error(
        'Por favor, selecciona un archivo válido para previsualizar.',
      );
      return;
    }

    const selectedFile = fileList[0].originFileObj as File;
    dispatchUi({ type: 'patch', patch: { isPreviewing: true } });

    void Promise.resolve()
      .then(() =>
        onImport(selectedFile, {
          dryRun: true,
        }),
      )
      .then(
        (data) => {
          const dataArray = Array.isArray(data) ? data : [];
          dispatchUi({ type: 'patch', patch: { previewData: dataArray } });
          if (!dataArray.length) {
            message.warning('El archivo no contiene filas para mostrar.');
          }
        },
        (error) => {
          console.error('Error al generar vista previa:', error);
          message.error('No se pudo generar la vista previa del archivo.');
        },
      )
      .then(() => {
        dispatchUi({ type: 'patch', patch: { isPreviewing: false } });
      });
  };

  const handleFieldsChange = (fields: string[]) => {
    dispatchUi({ type: 'patch', patch: { selectedOptionalFields: fields } });
  };

  const handleFileChange: UploadProps['onChange'] = ({
    file,
    fileList: nextFileList,
  }) => {
    dispatchUi({
      type: 'patch',
      patch: {
        fileList: nextFileList,
        previewData: [],
      },
    });

    if (file.status === 'done') {
      message.success(`${file.name} se ha seleccionado correctamente.`);
    } else if (file.status === 'error') {
      message.error(`${file.name} no se pudo seleccionar.`);
    }
  };

  const handleAfterClose = () => {
    dispatchUi({ type: 'resetImportState' });
  };

  const handleTabChange = (key: string) => {
    dispatchUi({
      type: 'patch',
      patch: { activeTab: key as 'import' | 'template' },
    });
  };

  const uploadProps: UploadProps = {
    onRemove: () => {
      dispatchUi({ type: 'resetImportState' });
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
      return false;
    },
    fileList,
  };

  const previewRows = useMemo<PreviewRow[]>(
    () =>
      previewData.slice(0, PREVIEW_LIMIT).map((row, index) => ({
        key: index,
        ...flattenPreviewObject(row),
      })),
    [previewData],
  );

  const previewColumns = useMemo<ColumnsType<PreviewRow>>(() => {
    if (!previewRows.length) return [];
    return Object.keys(previewRows[0]).map((dataIndex) => ({
      title: dataIndex,
      dataIndex,
      ellipsis: true,
    }));
  }, [previewRows]);

  return {
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
  };
};
