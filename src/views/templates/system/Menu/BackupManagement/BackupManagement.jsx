import { Button, message, Progress, Card, Typography, Space } from 'antd';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../../../../../features/auth/userSlice';

import { createBackup } from './backupService';

const { Title, Text } = Typography;

const BackupManagement = () => {
  const user = useSelector(selectUser);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);
  
  const handleBackup = async () => {
    try {
      setLoading(true);
      setProgress(0);
      setStatus('Iniciando proceso de backup...');
      setResult(null);
      
      // Creamos un intervalo que simula el avance (ya que no podemos obtener el progreso real en tiempo real)
      // Esto solo da una idea aproximada al usuario de que el proceso está avanzando
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          // Avanzamos lentamente hasta 90%, el 100% lo reservamos para el éxito final
          const newProgress = prev + (Math.random() * 2);
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 500);
      
      message.loading({ content: 'Creando backup...', key: 'backup' });
      const result = await createBackup(user);
      
      clearInterval(progressInterval);
      
      if (result.success) {
        setProgress(100);
        setStatus('Backup completado con éxito');
        setResult(result);
        message.success({ 
          content: result.message, 
          key: 'backup',
          duration: 3 
        });
      } else {
        setProgress(0);
        setStatus('Error al crear backup');
        message.error({ 
          content: 'Error al crear backup: ' + result.error, 
          key: 'backup',
          duration: 3 
        });
      }
    } catch (error) {
      setProgress(0);
      setStatus('Error inesperado');
      message.error({ 
        content: 'Error inesperado al crear backup', 
        key: 'backup',
        duration: 3 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Button 
          type="primary" 
          onClick={handleBackup} 
          loading={loading}
          disabled={loading}
        >
          Crear Backup
        </Button>
        
        {loading && (
          <Card style={{ marginTop: '20px' }}>
            <Title level={5}>Progreso del Backup</Title>
            <Text>{status}</Text>
            <Progress percent={Math.round(progress)} status="active" />
            <Text type="secondary">
              El backup se está realizando. Puedes ver el progreso detallado en la consola del navegador (F12).
            </Text>
          </Card>
        )}
        
        {result && (
          <Card style={{ marginTop: '20px' }}>
            <Title level={5}>Resultado del Backup</Title>
            <Text>ID del Backup: {result.timestamp}</Text>
            <br />
            <Text>Documentos respaldados: {result.totalBackedUp}</Text>
            <br />
            <Text>Documentos eliminados: {result.totalDeleted}</Text>
          </Card>
        )}
      </Space>
    </div>
  );
};

export default BackupManagement;