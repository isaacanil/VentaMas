import { FileOutlined, DeleteOutlined, EyeOutlined, FileImageOutlined, FilePdfOutlined } from '@ant-design/icons';
import { Tag, Empty, Tooltip } from 'antd';
import { useMemo } from 'react';
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
  background: none;
  border: none;
  color: #ff4d4f;
  cursor: pointer;
  padding: 5px;
  
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
  background: none;
  border: none;
  color: #1890ff;
  cursor: pointer;
  padding: 5px;
  margin-right: 8px;
  
  &:hover {
    color: #40a9ff;
  }
`;

const GroupTitle = styled.h4`
  margin: 12px 0;
  color: #666;
  font-weight: 500;
`;

const FileIcon = styled.span`
  margin-right: 8px;
  font-size: 16px;
  display: flex;
  align-items: center;
`;

const FileList = ({ files = [], removeFile, handlePreview }) => {
  const getTagColor = (type) => {
    const colors = {
      receipts: 'green',
      invoices: 'blue',
      others: 'orange',
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
    const groups = {
      receipts: { title: 'Recibos', files: [] },
      invoices: { title: 'Facturas', files: [] },
      others: { title: 'Otros Documentos', files: [] },
    };

    files?.forEach(file => {
      const type = file.type?.toLowerCase() || 'others';
      const targetGroup = groups[type] || groups.others;
      targetGroup.files.push(file);
    });

    return Object.entries(groups).filter(([_, group]) => group.files.length > 0);
  }, [files]);

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
        <Tooltip title={file.name}>
          {file.name}
        </Tooltip>
        <TypeTag color={getTagColor(file.type)}>
          {file.type}
        </TypeTag>
        <TypeTag color={file.url ? "purple" : "blue"}>
          {file.url ? "Remoto" : "Local"}
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

FileList.defaultProps = {
  files: [],
  removeFile: () => {},
  handlePreview: () => {}
};

export default FileList;