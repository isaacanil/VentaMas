import React, { useState } from 'react'
import { Upload, Button, message, Select } from 'antd'
import styled from 'styled-components'

const { Option } = Select

const Container = styled.div`
  margin-top: 20px;
`

const Section = styled.div`
  margin-top: 20px;
`

const Title = styled.h3`
  font-size: 16px;
  margin-bottom: 10px;
`

const List = styled.ul`
  list-style-type: none;
  padding: 0;
`

const EvidenceUpload = () => {
  const [files, setFiles] = useState({ recibos: [], facturas: [], otros: [] })
  const [fileType, setFileType] = useState('recibos')

  const handleChange = ({ fileList }) => {
    const newFiles = { ...files }
    fileList.forEach(file => {
      if (fileType === 'recibos') {
        newFiles.recibos.push(file)
      } else if (fileType === 'facturas') {
        newFiles.facturas.push(file)
      } else {
        newFiles.otros.push(file)
      }
    })
    setFiles(newFiles)
    message.success('Files uploaded successfully')
  }
  // console.log(filesType)

  const handleFileTypeChange = value => {
    setFileType(value)
  }

  return (
    <div style={{padding: '1em'}}>
      <Select defaultValue="recibos" style={{ width: 120, marginRight: 10 }} onChange={handleFileTypeChange}>
        <Option value="recibos">Recibos</Option>
        <Option value="facturas">Facturas</Option>
        <Option value="otros">Otros</Option>
      </Select>
      <Upload multiple onChange={handleChange}>
        <Button>Subir Archivos</Button>
      </Upload>
      <Container>
        {files.recibos.length > 0 && (
          <Section>
            <Title>Recibos</Title>
            <List>
              {files.recibos.map(file => (
                <li key={file.uid}>{file.name}</li>
              ))}
            </List>
          </Section>
        )}
        {files.facturas.length > 0 && (
          <Section>
            <Title>Facturas</Title>
            <List>
              {files.facturas.map(file => (
                <li key={file.uid}>{file.name}</li>
              ))}
            </List>
          </Section>
        )}
        {files.otros.length > 0 && (
          <Section>
            <Title>Otros</Title>
            <List>
              {files.otros.map(file => (
                <li key={file.uid}>{file.name}</li>
              ))}
            </List>
          </Section>
        )}
      </Container>
    </div>
  )
}

export default EvidenceUpload