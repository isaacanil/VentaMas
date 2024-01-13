
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import * as antd from 'antd';
import { fbAddRncData } from '../../../../firebase/rnc/fbAddRncData';
const { Table, Button, Input } = antd;
const { Search } = Input;

import { SearchOutlined } from '@ant-design/icons'


export const Prueba = () => {
  const ultimo = 154500;
  const [data, setData] = useState([]);
  const [state, setState] = useState("");
  const [linesProcessed, setLinesProcessed] = useState(0);
  const [currentLine, setCurrentLine] = useState("");
  const [searchText, setSearchText] = useState('');

  let tempCurrentLine = "";
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      readFile(file);
    }
  };
  const buscarRNC = (rncBuscado) => {
    console.log("Buscando RNC: " + rncBuscado);
    const indice = data.findIndex(elemento => elemento.rnc === rncBuscado);
    console.log("Indice: " + indice);
   // return indice; // Retorna -1 si no se encuentra el RNC
  }
   const readFile = (file) => {
    const reader = new FileReader();
    setState("Leyendo archivo");
    reader.onload = (e) => {
      const fileContent = e.target.result;
      processData(fileContent);
    };
    reader.onerror = (e) => {
      // Manejar errores de lectura de archivo aquí
    };
    reader.readAsText(file);
  };

  const processData = (fileContent) => {
    const lines = fileContent.split("\n");
    const processedData = [];
    
    lines.forEach((line, index) => {
      const fields = line.split("|");
      const rnc = fields[0] ? fields[0].trim() : '';
      processedData.push({
        rnc: fields[0] ? fields[0].trim() : '',
        nombre: fields[1] ? fields[1].trim() : '',
        actividad: fields[3] ? fields[3].trim() : '',
        fecha: fields[8] ? fields[8].trim() : '',
        estado: fields[9] ? fields[9].trim() : '',
        condicion: fields[10] ? fields[10].trim() : '',
        // otros campos
      });

      console.log(`Índice: ${index}, RNC: ${rnc}`);

      if (index % 100 === 0 ) {
        // console.log(`Procesando línea ${index}: ${line}`);
        setLinesProcessed(index);
        tempCurrentLine = line;
      }
    });
    setData(processedData);
    setCurrentLine(tempCurrentLine);
    setState("Archivo procesado");
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    let prueba = data.slice(ultimo);
    try {
      await fbAddRncData(prueba);
      alert("Datos enviados");
      console.log("Datos enviados");
    } catch (error) {
      alert(error);
      console.error(error);
    }

  }
  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText('');
  };
  const handleSearch = (selectedKeys, confirm) => {
    confirm();
    setSearchText(selectedKeys[0]);
  };
  const getColumnSearchProps = dataIndex => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Search
          placeholder={`Buscar ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onSearch={() => handleSearch(selectedKeys, confirm)}
          style={{ width: 188, marginBottom: 8, display: 'block' }}
        />
        <Button
          type="primary"
          onClick={() => handleSearch(selectedKeys, confirm)}
          size="small"
          style={{ width: 90, marginRight: 8 }}
        >
          Buscar
        </Button>
        <Button onClick={() => handleReset(clearFilters)} size="small" style={{ width: 90 }}>
          Reset
        </Button>
      </div>
    ),
    filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    onFilter: (value, record) =>
      record[dataIndex]
        ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
        : '',
  });
  const columns = [
    {
      title: 'RNC',
      dataIndex: 'rnc',
      key: 'rnc',
      ...getColumnSearchProps('rnc'),
    },
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
    },
    {
      title: 'Actividad',
      dataIndex: 'actividad',
      key: 'actividad',
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
    },
    {
      title: 'Condicion',
      dataIndex: 'condicion',
      key: 'condicion',
    },
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      key: 'fecha',
    }
    // Puedes añadir más columnas aquí
  ];
 
 
  console.log(data)
  return (
    <div>
         <input type="file" onChange={handleFileChange} />
      <p>{state}</p>
      <p>Lineas totales: {data.length}</p>
      <p>ultimo {ultimo}</p>
      <p>Líneas procesadas: {linesProcessed}</p>
      <p>Última línea procesada: {currentLine}</p>
      <antd.Button type="primary" onClick={handleSubmit}>Enviar</antd.Button>
      <antd.Button type="primary" onClick={() => buscarRNC("00111056610")}>Buscar </antd.Button>
      <Table columns={columns} dataSource={data} pagination={{ pageSize: 20 }} />

    </div>
  )
}


const ModalWrapper = styled.div`
  max-height: 100vh;
  overflow: auto;
  overflow-x: hidden;
`;
