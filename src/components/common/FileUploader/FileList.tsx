import {
  FileOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileImageOutlined,
  FilePdfOutlined,
} from '@/constants/icons/antd';
import { Empty, Tooltip } from 'antd';
import React, { useMemo } from 'react';

import { isImageFile, isPDFFile } from '@/utils/fileUtils';
import {
  DeleteButton,
  FileGroup,
  FileIcon,
  FileInfo,
  FileItem,
  FileListContainer,
  GroupTitle,
  PreviewButton,
  TypeTag,
} from '@/components/common/FileList/FileList.styles';

type FileListItem = {
  id?: string;
  url?: string;
  name: string;
  type?: string;
  file?: File;
  preview?: string | null;
};

type FileListProps = {
  files?: FileListItem[];
  removeFile?: (fileId: string) => void;
  handlePreview?: (file: FileListItem) => void;
  fileTypeLabels?: Record<string, string>;
};

const EMPTY_FILE_LIST: FileListItem[] = [];
const EMPTY_FILE_TYPE_LABELS: Record<string, string> = {};

const FileList = ({
  files = EMPTY_FILE_LIST,
  removeFile,
  handlePreview,
  fileTypeLabels = EMPTY_FILE_TYPE_LABELS,
}: FileListProps) => {
  const getTagColor = (type?: string) => {
    const colors = {
      document: 'default',
      receipts: 'green',
      invoices: 'blue',
      others: 'orange',
      imagen: 'purple',
      pdf: 'red',
    };
    return colors[type?.toLowerCase()] || 'default';
  };

  const groupedFiles = useMemo(() => {
    const groups: Record<string, { title: string; files: FileListItem[] }> = {};

    files?.forEach((file) => {
      const type = file.type?.toLowerCase() || 'document';

      if (!groups[type]) {
        groups[type] = {
          title:
            fileTypeLabels[type] ||
            type.charAt(0).toUpperCase() + type.slice(1),
          files: [],
        };
      }

      groups[type].files.push(file);
    });

    return Object.entries(groups);
  }, [files, fileTypeLabels]);

  const renderFileItem = (file: FileListItem) => (
    <FileItem key={file.id || file.url || file.name}>
      <FileIcon>
        {isImageFile(file.name) ? (
          <FileImageOutlined style={{ color: '#52c41a' }} />
        ) : isPDFFile(file.name) ? (
          <FilePdfOutlined style={{ color: '#ff4d4f' }} />
        ) : (
          <FileOutlined />
        )}
      </FileIcon>
      <FileInfo>
        <Tooltip title={file.name}>{file.name}</Tooltip>
        <TypeTag color={getTagColor(file.type)}>{file.type}</TypeTag>
        <TypeTag color={file.url ? 'purple' : 'blue'}>
          {file.url ? 'Remoto' : 'Local'}
        </TypeTag>
      </FileInfo>
      <div>
        {(isImageFile(file.name) || isPDFFile(file.name)) && (
          <PreviewButton onClick={() => handlePreview?.(file)}>
            <EyeOutlined />
          </PreviewButton>
        )}
        {removeFile && (
          <DeleteButton
            onClick={() => {
              const id = file.id ?? file.url;
              if (id) {
                removeFile(id);
              }
            }}
          >
            <DeleteOutlined />
          </DeleteButton>
        )}
      </div>
    </FileItem>
  );

  if (!files?.length) {
    return <Empty description="No hay archivos adjuntos" />;
  }

  return (
    <FileListContainer>
      {groupedFiles.map(([type, group]) => (
        <FileGroup key={type}>
          <GroupTitle>{group.title}</GroupTitle>
          {group.files.map(renderFileItem)}
        </FileGroup>
      ))}
    </FileListContainer>
  );
};

export default FileList;
