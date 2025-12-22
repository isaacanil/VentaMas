import { Select, Form } from 'antd';
import React from 'react';

import UploadButton from './UploadButton';

const { Option } = Select;

const fileTypeOptions = [
  { value: 'receipts', label: 'Recibos' },
  { value: 'invoices', label: 'Facturas' },
  { value: 'others', label: 'Otros' },
];

const FileUploadControls = ({ fileType, setFileType, handleFileInput }) => {
  if (!handleFileInput) {
    return null;
  }

  return (
    <div style={{ display: 'flex', gap: '10px' }}>
      <Form.Item label="Tipo">
        <Select
          value={fileType}
          style={{ width: '120px' }}
          onChange={(value) => setFileType(value)}
        >
          {fileTypeOptions.map((option) => (
            <Option key={option.value} value={option.value}>
              {option.label}
            </Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item label="Adjuntar Evidencia">
        <UploadButton onFileInput={handleFileInput} />
      </Form.Item>
    </div>
  );
};

export default FileUploadControls;
