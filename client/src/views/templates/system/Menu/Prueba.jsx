
import React, { useState } from 'react';
import * as antd from 'antd';
import styled from 'styled-components';
import { fbUpdateClientsWithIncrementalNumber } from '@fbConfig/client/fbUpdateClientsWithIncrementalNumber';
import { fbDeleteFieldFromAllClients } from '../../../../firebase/client/fbDeleteFieldFromAllClient';

const { message } = antd

export const Prueba = () => {
  const [message, setMessage] = useState("")
  async function handleSubmit() {
    await fbDeleteFieldFromAllClients("numberId")
  }
  return (
    <div>
      <h1>Obtener estructura de documentos</h1>
      <p>Mensaje: {message}</p>
      <button
        onClick={handleSubmit}
      >
        obtener un documento
      </button>
    </div>
  )
}


