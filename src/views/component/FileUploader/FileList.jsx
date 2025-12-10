import {
  FileOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileImageOutlined,
  FilePdfOutlined,
} from '@ant-design/icons';
import { Tag, Empty, Tooltip } from 'antd';
import React, { useMemo } from 'react';
import styled from 'styled-components';

const FileListContainer = styled.div`
  max-height: 300px;
  overflow-y: auto;
`;

const FileItem = styled.div`
  display: flex;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #f0f0f0;

  &:hover {
    background-color: #f5f5f5;
  }
`;

const FileInfo = styled.div`
  flex: 1;
  margin-left: 10px;
`;

const DeleteButton = styled.button`
  padding: 5px;
  color: #ff4d4f;
  cursor: pointer;
  background: none;
  border: none;

  &:hover {
    color: #cf1322;
  }
`;

const TypeTag = styled(Tag)`
  margin-left: 8px;
  font-size: 11px;
`;

const FileGroup = styled.div`
  margin-bottom: 16px;
`;

const PreviewButton = styled.button`
  padding: 5px;
  margin-right: 8px;
  color: #1890ff;
  cursor: pointer;
  background: none;
  border: none;

  &:hover {
    color: #40a9ff;
  }
`;

const GroupTitle = styled.h4`
  margin: 12px 0;
  font-weight: 500;
  color: #666;
`;

const FileIcon = styled.span`
  display: flex;
  align-items: center;
  margin-right: 8px;
  font-size: 16px;
`;

const FileList = ({
  files = [],
  removeFile,
  handlePreview,
  fileTypeLabels = {},
}) => {
  const getTagColor = (type) => {
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

  const isImageFile = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif'].includes(extension);
  };

  const isPDFFile = (filename) => {
    return filename.split('.').pop().toLowerCase() === 'pdf';
  };

  const groupedFiles = useMemo(() => {
    const groups = {};

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

  const renderFileItem = (file) => (
    <FileItem key={file.id || file.url}>
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
          <PreviewButton onClick={() => handlePreview(file)}>
            <EyeOutlined />
          </PreviewButton>
        )}
        {removeFile && (
          <DeleteButton onClick={() => removeFile(file.id || file.url)}>
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
