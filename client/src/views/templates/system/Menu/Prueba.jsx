
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../../../features/auth/userSlice';
import { fbGetStructureData } from './fbGetStructure';
import * as antd from 'antd';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const { message } = antd

export const Prueba = () => {
  const user = useSelector(selectUser)
  const [ref, setRef] = useState()
  const [data, setData] = useState()
  const navigate = useNavigate()
  useEffect(() => {
    if (user.businessID) {
      setRef(`businesses/${user?.businessID}/`)
    }
  }, [user])
  const handleSubmit = async () => {
    const data = await fbGetStructureData(ref)
    setData(data[0])
  }
  const resetInput = () => {
    setRef(`businesses/${user?.businessID}/`)
  }

  function handleCopyData() {
    navigator.clipboard.writeText(JSON.stringify(data)).then(() => {
      message.success('Copiado al portapapeles')
    })
  }
  return (
    <div>
      <h1>Obtener estructura de documentos</h1>
      <button onClick={resetInput}>Limpiar campo</button>
      <input type="text" value={ref} onChange={(e) => setRef(e.target.value)} />
      <CodeContainer>
        <Code>
          {data ? JSON.stringify(data, null, 2) : 'No data'}
        </Code>
      </CodeContainer>
      <button
        onClick={handleCopyData}
      >
        copiar a portapapeles
      </button>
      <button
        onClick={handleSubmit}
      >
        obtener un documento
      </button>
    </div>
  )
}

const CodeContainer = styled.div`
  background-color: #f4f4f4;
  border-radius: 5px;
  padding: 10px;
  margin-top: 10px;
  white-space: pre-wrap;
  overflow-x: auto;
`;

const Code = styled.code`
  font-family: 'Source Code Pro', monospace;
  font-size: 14px;
  color: #333;
  user-select: all;
`;
