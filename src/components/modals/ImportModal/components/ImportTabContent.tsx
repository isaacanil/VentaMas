import { UploadOutlined } from '@/constants/icons/antd';
import { Button, Table, Upload } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UploadProps } from 'antd/es/upload/interface';
import styled from 'styled-components';

import { PREVIEW_LIMIT } from '../utils/importModal';
import type { PreviewRow } from '../types';

interface ImportTabContentProps {
  onFileChange: UploadProps['onChange'];
  previewColumns: ColumnsType<PreviewRow>;
  previewRows: PreviewRow[];
  uploadProps: UploadProps;
}

export const ImportTabContent = ({
  onFileChange,
  previewColumns,
  previewRows,
  uploadProps,
}: ImportTabContentProps) => {
  return (
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
        Asegúrate de que los datos estén organizados de acuerdo a la plantilla
        de importación.
      </p>

      <Upload {...uploadProps} onChange={onFileChange} maxCount={1}>
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
  );
};

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
