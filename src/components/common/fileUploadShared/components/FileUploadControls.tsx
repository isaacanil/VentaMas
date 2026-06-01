import { Select, Form } from 'antd';
import type { ChangeEvent } from 'react';
import styled from 'styled-components';

import UploadButton from './UploadButton';

const { Option } = Select;
const EMPTY_FILE_TYPES: string[] = [];
const EMPTY_FILE_TYPE_LABELS: Record<string, string> = {};

const ControlsRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const ControlFormItem = styled(Form.Item)`
  margin-bottom: 0;
`;

const TypeSelect = styled(Select)`
  width: 120px;
`;

export type FileUploadControlsProps = {
  fileType: string;
  setFileType: (value: string) => void;
  handleFileInput?: (event: ChangeEvent<HTMLInputElement>) => void;
  fileTypes?: string[];
  fileTypeLabels?: Record<string, string>;
  title?: string;
  acceptedFileTypes?: string | null;
  compact?: boolean;
  alwaysShowTypeSelector?: boolean;
  typeSelectorLabel?: string | null;
};

const FileUploadControls = ({
  fileType,
  setFileType,
  handleFileInput,
  fileTypes = EMPTY_FILE_TYPES,
  fileTypeLabels = EMPTY_FILE_TYPE_LABELS,
  title = 'Adjuntar archivo',
  acceptedFileTypes = null,
  compact = false,
  alwaysShowTypeSelector = false,
  typeSelectorLabel = null,
}: FileUploadControlsProps) => {
  if (!handleFileInput) {
    return null;
  }

  return (
    <ControlsRow>
      {(fileTypes.length > 1 || alwaysShowTypeSelector) && (
        <ControlFormItem label={compact ? null : typeSelectorLabel}>
          <TypeSelect
            value={fileType}
            onChange={(value) => setFileType(String(value))}
          >
            {fileTypes.map((type) => (
              <Option key={type} value={type}>
                {fileTypeLabels[type] || type}
              </Option>
            ))}
          </TypeSelect>
        </ControlFormItem>
      )}
      <ControlFormItem label={compact ? null : title}>
        <UploadButton
          onFileInput={handleFileInput}
          acceptedFileTypes={acceptedFileTypes}
          buttonText={compact ? title : 'Cargar'}
        />
      </ControlFormItem>
    </ControlsRow>
  );
};

export default FileUploadControls;
