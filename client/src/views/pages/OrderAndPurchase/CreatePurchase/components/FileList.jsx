import React from 'react';
import * as antd from 'antd';
import { FilePdfOutlined, FileImageOutlined, FileOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const { Image, Card } = antd;

const FileList = ({ files = [] }) => {

  const getFileTypeIcon = (type) => {
    if (type.includes('image')) {
      return <FileImageOutlined />;
    } else if (type.includes('pdf')) {
      return <FilePdfOutlined />;
    }
    return <FileOutlined />; // Icono genérico para otros tipos de archivos
  };

  const renderFileItem = (file) => {
    const { name, type, size, url } = file;

    const isImage = type.includes('image');
    const coverContent = isImage ? (
      <Image alt={name} src={url} style={{ height: 110, objectFit: 'cover' }} />
    ) : (
      <div style={{ height: 110, display: 'flex', fontSize: "3em", alignItems: 'center', justifyContent: 'center' }}>
        {getFileTypeIcon(type)}
      </div>
    );

    return (
      <Col  key={url}>
        <Card
          hoverable
          size='small'
          style={{ width: '100%', marginBottom: '10px' }}
          cover={coverContent}
          onClick={() => isImage ? {} : window.open(url, '_blank')}
        >
          <Card.Meta title={name} description={`Size: ${size} bytes`} />
        </Card>
      </Col>
    );
  };

  return (
    <Row gutter={16}>
      {files.map(renderFileItem)}
    </Row>
  );
};

export default FileList;
const Row = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
`
const Col = styled.div`
`