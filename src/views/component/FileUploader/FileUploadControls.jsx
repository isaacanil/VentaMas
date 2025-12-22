import { Select, Form } from 'antd';
import React from 'react';

import UploadButton from './UploadButton';

const { Option } = Select;

const FileUploadControls = ({
  fileType,
  setFileType,
  handleFileInput,
  fileTypes = [],
  fileTypeLabels = {},
  title = 'Adjuntar archivo',
  acceptedFileTypes = null,
  compact = false,
  alwaysShowTypeSelector = false,
}) => {
  if (!handleFileInput) {
    return null;
  }

  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      {(fileTypes.length > 1 || alwaysShowTypeSelector) && (
        <Form.Item label="" style={{ marginBottom: 0 }}>
          <Select
            value={fileType}
            style={{ width: '120px' }}
            onChange={(value) => setFileType(value)}
          >
            {fileTypes.map((type) => (
              <Option key={type} value={type}>
                {fileTypeLabels[type] || type}
              </Option>
            ))}
          </Select>
        </Form.Item>
      )}
      <Form.Item label={compact ? null : title} style={{ marginBottom: 0 }}>
        <UploadButton
          onFileInput={handleFileInput}
          acceptedFileTypes={acceptedFileTypes}
          buttonText={compact ? title : 'Cargar'}
        />
      </Form.Item>
    </div>
  );
};

export default FileUploadControls;
