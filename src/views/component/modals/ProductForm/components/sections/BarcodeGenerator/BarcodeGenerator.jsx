import { CalculatorOutlined, DisconnectOutlined } from '@ant-design/icons';
import { Modal, Form, Button, Space, Typography, notification } from 'antd';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '../../../../../../../features/auth/userSlice';
import { selectUpdateProductData } from '../../../../../../../features/updateProduct/updateProductSlice';
import { generateNextItemReference } from '../../../../../../../firebase/barcode/barcodeGeneration';
import { fbUpdateProduct } from '../../../../../../../firebase/products/fbUpdateProduct';
import useBarcodeSettings from '../../../../../../../hooks/barcode/useBarcodeSettings';
import useProductRealtimeListener from '../../../../../../../hooks/product/useProductRealtimeListener';
import { 
  generateGTIN13RD,
  generateInternalGTIN13RD,
  generateGTIN13US,
  generateGTIN13MX,
  generateGTIN13CO,
  generateGTIN13AR,
  generateGTIN13CL,
  generateGTIN13PE
} from '../../../../../../../utils/barcode/barcode';
import {
  analyzeBarcodeStructure,
  isGS1RDCode,
  extractCompanyPrefix,
  extractItemReference
} from '../../../../../../../utils/barcode/barcode';

import { GenerateTab, ConfigurationTab } from './components';


const { Text } = Typography;

// Styled components para el selector de modo
const ModeSelector = styled.div`
  display: flex;
  background: #f5f5f5;
  border-radius: 12px;
  padding: 6px;
  margin-bottom: 24px;
  gap: 6px;
  border: 1px solid #e8e8e8;
`;

const ModeOption = styled.div`
  flex: 1;
  padding: 16px 20px;
  text-align: center;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
  position: relative;
  
  ${props => props.selected ? `
    background: white;
    color: #1890ff;
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
    transform: translateY(-1px);
  ` : `
    background: transparent;
    color: #666;
    
    &:hover {
      background: rgba(255, 255, 255, 0.7);
      color: #333;
      transform: translateY(-0.5px);
    }
  `}
`;

const ModeTitle = styled.div`
  font-size: 14px;
  margin-bottom: 6px;
  font-weight: 600;
`;

const ModeDescription = styled.div`
  font-size: 12px;
  opacity: 0.75;
  font-weight: 400;
  line-height: 1.4;
`;

/**
 * Genera un código de barras GTIN-13 siguiendo el estándar GS1 de República Dominicana
 */
export const BarcodeGenerator = ({ visible, onClose, onGenerate, currentBarcode }) => {
  const user = useSelector(selectUser);
  const { product, status } = useSelector(selectUpdateProductData);
  const [form] = Form.useForm();
  const [generatedCode, setGeneratedCode] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [autoMode, setAutoMode] = useState(true);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [selectedStandard, setSelectedStandard] = useState('gs1rd');
  // Unificar en un solo flujo: usar o no Company Prefix
  const [useCompanyPrefix, setUseCompanyPrefix] = useState(false);
  
  
  // Estados para el modo interno
  const [internalManualValues, setInternalManualValues] = useState({ 
    itemReference: '' 
  });
  
  // Estados para validación en tiempo real
  const [companyPrefixValid, setCompanyPrefixValid] = useState(null);
  const [itemReferenceValid, setItemReferenceValid] = useState(null);
  const [livePreview, setLivePreview] = useState('');
  const [manualValues, setManualValues] = useState({ companyPrefix: '', itemReference: '' });
  
  // Estados para manejar cambios manuales vs automáticos
  const [hasManualChanges, setHasManualChanges] = useState(false);
  const [lastDatabaseBarcode, setLastDatabaseBarcode] = useState(currentBarcode);
  const [currentDisplayBarcode, setCurrentDisplayBarcode] = useState(currentBarcode);
  
  // Análisis del código actual
  const [barcodeAnalysis, setBarcodeAnalysis] = useState(null);
  
  // Hook para listener en tiempo real del producto
  const {
    productData: realtimeProduct,
    loading: realtimeLoading,
    error: realtimeError,
    isConnected,
    hasBarcode: realtimeHasBarcode,
    currentBarcode: realtimeCurrentBarcode,
    isUpdating
  } = useProductRealtimeListener(
    user?.businessID,
    product?.id,
    visible && status === "update" && product?.id // Solo activar si estamos en modo actualización
  );

  // Estado para mostrar notificaciones de cambios en tiempo real
  const [lastKnownBarcode, setLastKnownBarcode] = useState(currentBarcode);
  
  // Hook para manejar configuración de códigos de barras
  const {
    settings,
    loading: settingsLoading,
    nextItemReference,
    saveSettings,
    generateBarcode,
    updateCompanyPrefix,
    isConfigured,
    refresh
  } = useBarcodeSettings();

  // Estado local para configuración temporal
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [companyPrefixConfigValid, setCompanyPrefixConfigValid] = useState(false); // Declaración única

  // Efecto para analizar el código actual cuando se abre el modal
  useEffect(() => {
    if (visible && currentDisplayBarcode) {
      const analysis = analyzeBarcodeStructure(currentDisplayBarcode);
      setBarcodeAnalysis(analysis);
      
      // Si es un código GS1 RD válido, extraer los componentes para mostrar
      if (isGS1RDCode(currentDisplayBarcode) && settings) {
        const companyPrefix = extractCompanyPrefix(currentDisplayBarcode, settings.companyPrefixLength || 4);
        const itemReference = extractItemReference(currentDisplayBarcode, settings.companyPrefixLength || 4);
        
        if (companyPrefix && itemReference) {
          // Solo prefijar valores si el modo automático está activo; de lo contrario, dejar el campo vacío
          if (autoMode) {
            setManualValues({ companyPrefix, itemReference });
          } else {
            setManualValues({ companyPrefix, itemReference: '' });
          }
        }
      }
    }
  }, [visible, currentDisplayBarcode, settings, autoMode]);

  // Efecto para detectar cambios manuales en el código
  useEffect(() => {
    if (visible) {
      const isDifferentFromDatabase = currentBarcode !== lastDatabaseBarcode;
      const hasLocalChanges = currentBarcode !== realtimeCurrentBarcode && realtimeCurrentBarcode !== undefined;
      
      setHasManualChanges(isDifferentFromDatabase || hasLocalChanges);
      setCurrentDisplayBarcode(currentBarcode); // Usar siempre el código del estado local/Redux
    }
  }, [visible, currentBarcode, lastDatabaseBarcode, realtimeCurrentBarcode]);

  // Limpiar siempre Item Reference manual al abrir
  useEffect(() => {
    if (visible) {
      // Al abrir, usar siempre el código manual actual (Redux) y marcar sin cambios pendientes
      setLastKnownBarcode(currentBarcode);
      setLastDatabaseBarcode(currentBarcode);
      setCurrentDisplayBarcode(currentBarcode);
      setHasManualChanges(false);
      // Limpiar siempre Item Reference manual al abrir
      setManualValues(prev => ({ ...prev, itemReference: '' }));
      setInternalManualValues({ itemReference: '' });
    }
  }, [visible]);

  // Cargar configuración guardada al abrir el modal (evitar sobreescribir mientras se edita)
  React.useEffect(() => {
    if (visible && settings && !showConfigModal) {
      console.log('Cargando configuración al abrir modal:', settings);
      setSelectedConfig(settings);
      // Inicializar validez si ya hay configuración guardada
      setCompanyPrefixConfigValid(
        settings.companyPrefix
          ? /^\d{4,7}$/.test(settings.companyPrefix)
          : true
      );
      // Inicializar switches desde configuración
      if (typeof settings.useCompanyPrefixDefault === 'boolean') {
        setUseCompanyPrefix(settings.useCompanyPrefixDefault);
      } else {
        setUseCompanyPrefix(false); // por defecto desactivado
      }
      // Si no hay Company Prefix configurado, no forzamos ningún modo; será responsabilidad del usuario
      if (typeof settings.autoModeDefault === 'boolean') {
        setAutoMode(settings.autoModeDefault);
      }
    }
  }, [visible, settings, showConfigModal]);

  // Si el generador se cierra desde el padre, asegurar que los sub-modales también se cierren
  useEffect(() => {
    if (!visible) {
      setShowConfigModal(false);
    }
  }, [visible]);

  // Efecto adicional para sincronizar cuando settings cambia (después de guardar)
  React.useEffect(() => {
    if (settings && visible && !showConfigModal) {
      // Sincronizar solo cuando no se está editando manualmente
      const savedPrefix = settings.companyPrefix;
      const localPrefix = selectedConfig?.companyPrefix;
      
      if (savedPrefix && savedPrefix !== localPrefix) {
        console.log('Sincronizando configuración guardada desde DB:', savedPrefix);
        setSelectedConfig(settings);
        setCompanyPrefixConfigValid(/^\d{4,7}$/.test(savedPrefix));
      }
      // Mantener la preferencia del usuario aunque no exista Company Prefix
      // Nota: se eliminó la lógica que deshabilitaba automáticamente `useCompanyPrefix` cuando no existía Company Prefix
      // if (!settings.companyPrefix) {
      //   setUseCompanyPrefix(false);
      // }
    }
  }, [settings, visible, showConfigModal, selectedConfig?.companyPrefix]);

  // Efecto para manejar cambios en tiempo real del código de barras
  useEffect(() => {
    if (!visible || status !== "update") return;

    // Solo actualizar si hay cambios desde la base de datos y NO hay cambios manuales pendientes
    if (realtimeProduct && realtimeCurrentBarcode !== lastKnownBarcode && !hasManualChanges) {
      if (lastKnownBarcode !== null && lastKnownBarcode !== currentBarcode) {
        notification.info({
          message: '🔄 Código de Barras Actualizado',
          description: (
            <div>
              <div>El código de barras se actualizó en tiempo real:</div>
              <div style={{ 
                fontFamily: 'monospace', 
                backgroundColor: '#f6ffed',
                padding: '4px 8px',
                borderRadius: '4px',
                marginTop: '8px',
                border: '1px solid #b7eb8f'
              }}>
                {realtimeCurrentBarcode || 'Sin código'}
              </div>
            </div>
          ),
          duration: 6,
          placement: 'topRight'
        });
      }
      
      // Actualizar los estados
      setLastKnownBarcode(realtimeCurrentBarcode);
      setLastDatabaseBarcode(realtimeCurrentBarcode);
      setCurrentDisplayBarcode(realtimeCurrentBarcode);
      
      // Llamar al callback para sincronizar con el componente padre solo si no hay cambios manuales
      if (onGenerate && realtimeCurrentBarcode !== currentBarcode) {
        onGenerate(realtimeCurrentBarcode);
      }
    }
  }, [realtimeCurrentBarcode, visible, status, lastKnownBarcode, currentBarcode, onGenerate, hasManualChanges]);

  // Resetear el código conocido cuando se abre/cierra el modal
  useEffect(() => {
    if (visible) {
      // Al abrir, usar siempre el código manual actual (Redux) y marcar sin cambios pendientes
      setLastKnownBarcode(currentBarcode);
      setLastDatabaseBarcode(currentBarcode);
      setCurrentDisplayBarcode(currentBarcode);
      setHasManualChanges(false);
    }
  }, [visible]);

  // Mostrar errores del listener en tiempo real
  useEffect(() => {
    if (realtimeError && visible) {
      console.warn('Error en listener de producto:', realtimeError);
      // Solo mostrar errores críticos al usuario
      if (realtimeError.type === 'listener_error') {
        notification.warning({
          message: 'Conexión Interrumpida',
          description: 'La conexión en tiempo real se interrumpió. Los cambios pueden no reflejarse inmediatamente.',
          duration: 4
        });
      }
    }
  }, [realtimeError, visible]);

  // Función para crear previsualización en tiempo real
  const createLivePreview = (companyPrefix, itemReference) => {
    if (!companyPrefix || !itemReference) {
      return '';
    }
    
    try {
      const generator = getGeneratorFunction(selectedStandard);
      const fullCode = generator(companyPrefix, itemReference);
      const checkDigit = fullCode.slice(-1);
      
      // Obtener el prefijo GS1 según el país
      const prefixes = {
        'gs1rd': '746',
        'gs1us': '0',
        'gs1mx': '750',
        'gs1co': '770',
        'gs1ar': '778',
        'gs1cl': '780',
        'gs1pe': '775',
      };
      const prefix = prefixes[selectedStandard] || '746';
      
      return `${prefix} | ${companyPrefix} | ${itemReference} | ${checkDigit}`;
    } catch {
      return '';
    }
  };

  // Función para crear previsualización en modo interno
  const createInternalLivePreview = (itemReference) => {
    if (!itemReference) {
      return '';
    }
    
    try {
      const internalGenerator = getInternalGeneratorFunction(selectedStandard);
      const fullCode = internalGenerator('', itemReference);
      const checkDigit = fullCode.slice(-1);
      
      // Obtener el prefijo GS1 según el país para modo interno
      const prefixes = {
        'gs1rd': '746',
        'gs1us': '0',
        'gs1mx': '750',
        'gs1co': '770',
        'gs1ar': '778',
        'gs1cl': '780',
        'gs1pe': '775',
      };
      const prefix = prefixes[selectedStandard] || '746';
      
      return `${prefix} | ${itemReference} | ${checkDigit}`;
    } catch {
      return '';
    }
  };

  // Validación en tiempo real
  const validateCompanyPrefix = (value, config) => {
    if (!value) return null;
    if (!/^\d+$/.test(value)) return false;
    if (config && value.length !== config.companyPrefixLength) return false;
    return true;
  };

  const validateItemReference = (value, config) => {
    if (!value) return null;
    if (!/^\d+$/.test(value)) return false;
    if (config && value.length !== config.itemReferenceLength) return false;
    return true;
  };
  
  // Función helper para obtener la función de generación correcta según el país
  const getGeneratorFunction = (standard) => {
    const generators = {
      'gs1rd': generateGTIN13RD,
      'gs1us': generateGTIN13US,
      'gs1mx': generateGTIN13MX,
      'gs1co': generateGTIN13CO,
      'gs1ar': generateGTIN13AR,
      'gs1cl': generateGTIN13CL,
      'gs1pe': generateGTIN13PE,
    };
    return generators[standard] || generateGTIN13RD; // Default to RD
  };

  const getInternalGeneratorFunction = (standard) => {
    const generators = {
      'gs1rd': generateInternalGTIN13RD,
      'gs1us': (categoryPrefix, itemReference) => generateGTIN13US(categoryPrefix, itemReference),
      'gs1mx': (categoryPrefix, itemReference) => generateGTIN13MX(categoryPrefix, itemReference),
      'gs1co': (categoryPrefix, itemReference) => generateGTIN13CO(categoryPrefix, itemReference),
      'gs1ar': (categoryPrefix, itemReference) => generateGTIN13AR(categoryPrefix, itemReference),
      'gs1cl': (categoryPrefix, itemReference) => generateGTIN13CL(categoryPrefix, itemReference),
      'gs1pe': (categoryPrefix, itemReference) => generateGTIN13PE(categoryPrefix, itemReference),
    };
    return generators[standard] || generateInternalGTIN13RD; // Default to RD
  };
  
  
  // Función para generar código (unificada)
  const handleGenerateCode = async () => {
    try {
      setLoadingGenerate(true);
      let finalCode = '';
      
      if (!useCompanyPrefix) {
        // Modo interno
        const internalGenerator = getInternalGeneratorFunction(selectedStandard);
        if (autoMode) {
          let reservedRef = nextItemReference || '000000001';
          try {
            reservedRef = await generateNextItemReference(user);
          } catch (err) {
            console.warn('generateNextItemReference fallback:', err?.message);
          }
          // Asegurar 9 dígitos con padding
          reservedRef = reservedRef.toString().padStart(9, '0');
          finalCode = internalGenerator('', reservedRef);
        } else {
          finalCode = internalGenerator('', internalManualValues.itemReference);
        }
      } else {
        // Modo GS1
        const standardGenerator = getGeneratorFunction(selectedStandard);
        const finalCompanyPrefix = selectedConfig?.companyPrefix || settings?.companyPrefix || '';
        if (autoMode) {
          const reservedRef = await generateNextItemReference(user);
          finalCode = standardGenerator(finalCompanyPrefix, reservedRef);
        } else {
          finalCode = standardGenerator(finalCompanyPrefix, manualValues.itemReference);
        }
      }

      // Aplicar directamente
      if (status === "update" && product?.id) {
        const updatedProduct = { ...product, barcode: finalCode };
        await fbUpdateProduct(updatedProduct, user);
        notification.success({
          message: 'Código de Barras Actualizado',
          description: `El código de barras del producto "${product.name}" ha sido actualizado en la base de datos.`,
          duration: 4
        });
      } else {
        onGenerate?.(finalCode);
        notification.success({
          message: 'Código Generado',
          description: 'El código se asignará al guardar el producto.',
          duration: 3
        });
      }

      // Cerrar y limpiar
      onClose();
      setManualValues({ companyPrefix: '', itemReference: '' });
      setInternalManualValues({ itemReference: '' });
      setLivePreview('');
      setItemReferenceValid(null);
      setCompanyPrefixValid(null);
      setAutoMode(settings?.autoModeDefault ?? true);
      setUseCompanyPrefix(settings?.useCompanyPrefixDefault ?? false);
      refresh?.();
      
    } catch (error) {
      console.error('Error al generar código:', error);
      notification.error({
        message: 'Error al Generar',
        description: 'Hubo un error al generar el código de barras.',
        duration: 4
      });
    } finally {
      setLoadingGenerate(false);
    }
  };

  // Company Prefix es readonly en GenerateTab, se maneja solo en ConfigurationTab

  // Función para manejar cambios en Item Reference manual
  const handleManualItemReferenceChange = (value) => {
    const newValues = { ...manualValues, itemReference: value };
    setManualValues(newValues);
    
    const isValid = validateItemReference(value, selectedConfig);
    setItemReferenceValid(isValid);
    
    // Actualizar previsualización usando el Company Prefix de selectedConfig
    if (isValid && selectedConfig?.companyPrefix) {
      setLivePreview(createLivePreview(selectedConfig.companyPrefix, value));
    } else {
      setLivePreview('');
    }
  };

  // Funciones para manejar el modo interno (simplificado)
  const handleInternalItemReferenceChange = (value) => {
    const newValues = { ...internalManualValues, itemReference: value };
    setInternalManualValues(newValues);
    
    const isValid = validateInternalItemReference(value);
    setItemReferenceValid(isValid);
    
    // Actualizar previsualización
    if (isValid) {
      setLivePreview(createInternalLivePreview(value));
    } else {
      setLivePreview('');
    }
  };

  const validateInternalItemReference = (value) => {
    if (!value) return null;
    if (!/^\d+$/.test(value)) return false;
    if (value.length !== 9) return false;
    return true;
  };

  // Función para manejar cambios en el Company Prefix
  const handleCompanyPrefixChange = (e) => {
    const companyPrefix = e.target.value;
    
    // Crear nueva configuración con el valor actualizado
    let newConfig = { 
      ...selectedConfig, // Mantener configuración existente
      companyPrefix 
    };
    
    // Si es numérico, calcular configuración automática válida
    if (/^\d+$/.test(companyPrefix)) {
      const companyPrefixLength = companyPrefix.length;
      const itemReferenceLength = 9 - companyPrefixLength;
      if (itemReferenceLength >= 2 && itemReferenceLength <= 5) {
        const maxProducts = Math.pow(10, itemReferenceLength);
        Object.assign(newConfig, {
          companyPrefixLength,
          itemReferenceLength,
          maxProducts,
          name: `Empresa ${companyPrefixLength}+${itemReferenceLength}`,
          description: `Configuración automática para ${maxProducts.toLocaleString()} productos`
        });
      }
    }
    
    // Actualizar la configuración local inmediatamente
    setSelectedConfig(newConfig);
    
    // La validación ahora se maneja en ConfigurationTab
    // Validación: solo números, longitud entre 4 y 7
    const isValidConfig = companyPrefix === '' || /^\d{4,7}$/.test(companyPrefix);
    setCompanyPrefixConfigValid(isValidConfig);
    
    // Limpiar código generado
    setGeneratedCode('');
    setIsValid(false);
    form.resetFields();
  };

  // Función para guardar configuración
  const handleSaveConfiguration = async () => {
    if (!companyPrefixConfigValid) {
      notification.warning({
        message: 'Prefijo inválido',
        description: 'Ingresa 4-7 dígitos o deja el campo vacío para eliminar el prefijo.',
        duration: 3
      });
      return;
    }

    try {
      console.log('Guardando configuración:', selectedConfig);
      
      // Guardar en Firebase a través del hook
      await saveSettings(selectedConfig);
      
      // El hook automáticamente actualizará el estado 'settings'
      // Sincronizar el estado local con el estado del hook
      setSelectedConfig(selectedConfig);
      
      // Cerrar el modal automáticamente después de guardar
      setShowConfigModal(false);
      
      // El mensaje de éxito ya se muestra en el hook
      console.log('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      notification.error({
        message: 'Error al Guardar',
        description: 'No se pudo guardar la configuración. Intenta nuevamente.',
        duration: 4
      });
    }
  };

  // Guardar preferencia: usar o no Prefijo de Empresa (GS1)
  const handleToggleUseCompanyPrefix = async (checked) => {
    setUseCompanyPrefix(checked);
    try {
      await saveSettings({ ...(settings || {}), useCompanyPrefixDefault: checked });
    } catch (error) {
      console.error('Error al guardar preferencia useCompanyPrefix:', error);
    }
  };

  const handleToggleAutoMode = async (checked) => {
    setAutoMode(checked);
  
    if (!checked) {
      // Automático → Manual: dejar el input vacío
      if (useCompanyPrefix) {
        setManualValues(v => ({ ...v, itemReference: '' }));
      } else {
        setInternalManualValues({ itemReference: '' });
      }
      setItemReferenceValid(null);
      setLivePreview('');
    } else {
      // Manual → Automático: (opcional) refrescar la vista previa
      if (useCompanyPrefix && selectedConfig?.companyPrefix && nextItemReference) {
        setLivePreview(createLivePreview(selectedConfig.companyPrefix, nextItemReference));
      } else if (!useCompanyPrefix && nextItemReference) {
        setLivePreview(createInternalLivePreview(nextItemReference));
      } else {
        setLivePreview('');
      }
    }
  
    try {
      await saveSettings({ ...(settings || {}), autoModeDefault: checked });
    } catch (error) {
      console.error('Error al guardar preferencia autoMode:', error);
    }
  };
  

  // Eliminado: flujo de confirmación separado (ahora se genera/aplica directamente)

  // Función para cancelar
  const handleCancel = () => {
    handleReset();
    onClose();
  };

  // Función para resetear
  const handleReset = () => {
    form.resetFields();
    setGeneratedCode('');
    setIsValid(false);
    // Mantener la configuración actual para no perderla al reabrir
    setSelectedConfig(settings || null);
    // reset to generate view
    setShowConfigModal(false);
    // Restaurar preferencias guardadas o valores por defecto
    setAutoMode(settings?.autoModeDefault ?? true);
    setSelectedStandard('gs1rd');
    setCompanyPrefixValid(null);
    setItemReferenceValid(null);
    setLivePreview('');
    setManualValues({ companyPrefix: '', itemReference: '' });
    
    // Reset interno
    setUseCompanyPrefix(settings?.useCompanyPrefixDefault ?? false);
    setInternalManualValues({ itemReference: '' });
    
    // Resetear estado del listener y cambios manuales
    setLastKnownBarcode(currentBarcode);
    setLastDatabaseBarcode(currentBarcode);
    setCurrentDisplayBarcode(currentBarcode);
    setHasManualChanges(false);
    setBarcodeAnalysis(null);
  };

  // Recalcular previsualización al cambiar estándar (country) o el uso de Company Prefix
  useEffect(() => {
    if (useCompanyPrefix) {
      if (!autoMode && selectedConfig?.companyPrefix && manualValues.itemReference) {
        setLivePreview(createLivePreview(selectedConfig.companyPrefix, manualValues.itemReference));
      } else {
        setLivePreview('');
      }
    } else {
      if (!autoMode && internalManualValues?.itemReference) {
        setLivePreview(createInternalLivePreview(internalManualValues.itemReference));
      } else {
        setLivePreview('');
      }
    }
  }, [selectedStandard, useCompanyPrefix]);

  // Actualizar previsualización al cambiar configuración o valores
  useEffect(() => {
    if (useCompanyPrefix) {
      // Modo estándar - siempre usar selectedConfig para Company Prefix
      if (autoMode && nextItemReference && selectedConfig?.companyPrefix) {
        setLivePreview(createLivePreview(selectedConfig.companyPrefix, nextItemReference));
      } else if (!autoMode && selectedConfig?.companyPrefix && manualValues.itemReference) {
        setLivePreview(createLivePreview(selectedConfig.companyPrefix, manualValues.itemReference));
      } else {
        setLivePreview('');
      }
    } else {
      // Modo interno
      if (autoMode && nextItemReference) {
        setLivePreview(createInternalLivePreview(nextItemReference));
      } else if (!autoMode && internalManualValues?.itemReference) {
        setLivePreview(createInternalLivePreview(internalManualValues.itemReference));
      } else {
        setLivePreview('');
      }
    }
  }, [selectedStandard, useCompanyPrefix, autoMode, nextItemReference, selectedConfig?.companyPrefix, manualValues.itemReference, internalManualValues?.itemReference]);

  return (
    <Modal
      width={500}
      title={
        <Space>
          <CalculatorOutlined />
          Generación de Código de Barras
          {/* Indicador de conexión en tiempo real */}
          {status === "update" && product?.id && (
            <Space size={4}>
              {isConnected ? (
                <Space>
              
                </Space>
              ) : realtimeLoading ? (
                <Text type="secondary" style={{ fontSize: '12px', color: '#faad14' }}>
                  Conectando...
                </Text>
              ) : (
                <Space size={4} style={{ color: '#ff4d4f' }}>
                  <DisconnectOutlined />
                  <Text type="secondary" style={{ fontSize: '12px', color: '#ff4d4f' }}>
                    Desconectado
                  </Text>
                </Space>
              )}
              {isUpdating && (
                <Text type="secondary" style={{ fontSize: '12px', color: '#1890ff' }}>
                  Actualizando...
                </Text>
              )}
            </Space>
          )}
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      style={{top: "20px"}}
      footer={
        <Space>
          <Button onClick={handleCancel}>Cancelar</Button>
          {(isConfigured || !useCompanyPrefix) && (
            <Button
              type="primary"
              onClick={handleGenerateCode}
              loading={loadingGenerate}
              disabled={
                autoMode
                  ? (useCompanyPrefix ? !selectedConfig?.companyPrefix : false)
                  : (useCompanyPrefix ? !(selectedConfig?.companyPrefix && itemReferenceValid === true) : itemReferenceValid !== true)
              }
            >
              {'Generar'}
            </Button>
          )}
        </Space>
      }
      afterClose={handleReset}
    >
      {settingsLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Text>Cargando configuración...</Text>
        </div>
      ) : (
        <>
          {/* Contenido unificado */}
          <GenerateTab
            form={form}
            isConfigured={isConfigured || !useCompanyPrefix}
            autoMode={autoMode}
            setAutoMode={handleToggleAutoMode}
            manualValues={manualValues}
            internalManualValues={internalManualValues}
            selectedConfig={selectedConfig}
            companyPrefixValid={companyPrefixValid}
            itemReferenceValid={itemReferenceValid}
            handleManualItemReferenceChange={handleManualItemReferenceChange}
            handleInternalItemReferenceChange={handleInternalItemReferenceChange}
            nextItemReference={nextItemReference}
            livePreview={livePreview}
            handleGenerateCode={handleGenerateCode}
            loadingGenerate={loadingGenerate}
            generatedCode={generatedCode}
            onOpenConfig={() => setShowConfigModal(true)}
            selectedStandard={selectedStandard}
            onStandardChange={setSelectedStandard}
            currentBarcode={currentDisplayBarcode}
            realtimeStatus={{
              isConnected,
              isUpdating,
              hasRealtimeData: !!realtimeProduct,
              hasManualChanges
            }}
            barcodeAnalysis={barcodeAnalysis}
            useCompanyPrefix={useCompanyPrefix}
            setUseCompanyPrefix={handleToggleUseCompanyPrefix}
            hideGenerateButton={true}
          />
        </>
      )}
      {/* Configuration modal */}
      <Modal
        title="Editar Configuración"
        open={showConfigModal}
        style={{ top: '20px' }}
        onCancel={() => {
          setShowConfigModal(false);
          // Revertir cambios locales al cerrar sin guardar
          if (settings) {
            setSelectedConfig(settings);
            setCompanyPrefixConfigValid(/^\d{4,7}$/.test(settings.companyPrefix));
          }
        }}
        footer={
          <Space>
            <Button onClick={() => {
              setShowConfigModal(false);
              // Revertir cambios locales al cerrar sin guardar
              if (settings) {
                setSelectedConfig(settings);
                setCompanyPrefixConfigValid(/^\d{4,7}$/.test(settings.companyPrefix));
              }
            }}>Cancelar</Button>
            <Button
              type="primary"
              onClick={handleSaveConfiguration}
              disabled={!companyPrefixConfigValid}
              loading={settingsLoading}
            >
              Guardar
            </Button>
          </Space>
        }
        afterClose={() => {
          // Reset configuration modal state
          if (settings) {
            setSelectedConfig(settings);
            setCompanyPrefixConfigValid(/^\d{4,7}$/.test(settings.companyPrefix));
          }
        }}
      >
        <ConfigurationTab
          selectedConfig={selectedConfig}
          handleCompanyPrefixChange={handleCompanyPrefixChange}
          companyPrefixConfigValid={companyPrefixConfigValid}
        />
      </Modal>

      {/* Modal de confirmación eliminado; la generación aplica directamente */}
    </Modal>
  );
};

export default BarcodeGenerator;


