import { CalculatorOutlined, DisconnectOutlined } from '@/constants/icons/antd';
import { Modal, Form, Button, Space, Typography, notification } from 'antd';
import React, { useCallback, useEffect, useReducer, useRef } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { selectUpdateProductData } from '@/features/updateProduct/updateProductSlice';
import type { BarcodeSettings } from '@/firebase/barcode/types';
import { generateNextItemReference } from '@/firebase/barcode/barcodeGeneration';
import { fbUpdateProduct } from '@/firebase/products/fbUpdateProduct';
import useBarcodeSettings from '@/hooks/barcode/useBarcodeSettings';
import useProductRealtimeListener from '@/hooks/product/useProductRealtimeListener';
import {
  generateGTIN13RD,
  generateInternalGTIN13RD,
  generateGTIN13US,
  generateGTIN13MX,
  generateGTIN13CO,
  generateGTIN13AR,
  generateGTIN13CL,
  generateGTIN13PE,
} from '@/utils/barcode/barcode';
import {
  isGS1RDCode,
  extractCompanyPrefix,
} from '@/utils/barcode/barcode';
import type { ProductRecord } from '@/types/products';
import type { UserIdentity, UserWithBusiness } from '@/types/users';

import ConfigurationTab from './components/ConfigurationTab';
import GenerateTab from './components/GenerateTab';

const { Text } = Typography;

type Gs1StandardKey =
  | 'gs1rd'
  | 'gs1us'
  | 'gs1mx'
  | 'gs1co'
  | 'gs1ar'
  | 'gs1cl'
  | 'gs1pe';

type ManualValues = {
  companyPrefix: string;
  itemReference: string;
};

type InternalManualValues = {
  itemReference: string;
};

type ProductListenerError = {
  type: 'not_found' | 'listener_error';
  message: string;
  details?: string;
};

type BarcodeGeneratorProps = {
  visible: boolean;
  onClose: () => void;
  onGenerate?: (code: string | null) => void;
  currentBarcode?: string | null;
};

type GeneratorFn = (companyPrefix: string, itemReference: string) => string;
type InternalGeneratorFn = (
  categoryPrefix: string,
  itemReference: string,
) => string;

const GS1_PREFIXES: Record<Gs1StandardKey, string> = {
  gs1rd: '746',
  gs1us: '0',
  gs1mx: '750',
  gs1co: '770',
  gs1ar: '778',
  gs1cl: '780',
  gs1pe: '775',
};

const syncTrackedBarcodeRefs = (
  lastKnownRef: React.MutableRefObject<string | null>,
  lastDatabaseRef: React.MutableRefObject<string | null>,
  barcode: string | null | undefined,
) => {
  const nextBarcode = barcode ?? null;
  lastKnownRef.current = nextBarcode;
  lastDatabaseRef.current = nextBarcode;
};

interface BarcodeGeneratorState {
  generatedCode: string;
  showConfigModal: boolean;
  autoMode: boolean;
  loadingGenerate: boolean;
  selectedStandard: Gs1StandardKey;
  useCompanyPrefix: boolean;
  internalManualValues: InternalManualValues;
  companyPrefixValid: boolean | null;
  itemReferenceValid: boolean | null;
  manualValues: ManualValues;
  selectedConfig: BarcodeSettings | null;
  companyPrefixConfigValid: boolean;
}

type BarcodeGeneratorStateUpdate =
  | Partial<BarcodeGeneratorState>
  | ((state: BarcodeGeneratorState) => Partial<BarcodeGeneratorState>);

const initialBarcodeGeneratorState: BarcodeGeneratorState = {
  generatedCode: '',
  showConfigModal: false,
  autoMode: true,
  loadingGenerate: false,
  selectedStandard: 'gs1rd',
  useCompanyPrefix: false,
  internalManualValues: {
    itemReference: '',
  },
  companyPrefixValid: null,
  itemReferenceValid: null,
  manualValues: {
    companyPrefix: '',
    itemReference: '',
  },
  selectedConfig: null,
  companyPrefixConfigValid: false,
};

const barcodeGeneratorStateReducer = (
  state: BarcodeGeneratorState,
  update: BarcodeGeneratorStateUpdate,
): BarcodeGeneratorState => ({
  ...state,
  ...(typeof update === 'function' ? update(state) : update),
});

/**
 * Genera un código de barras GTIN-13 siguiendo el estándar GS1 de República Dominicana
 */
export const BarcodeGenerator = ({
  visible,
  onClose,
  onGenerate,
  currentBarcode,
}: BarcodeGeneratorProps) => {
  const user = useSelector(selectUser) as UserIdentity | null;
  const hasBusiness = (
    candidate: UserIdentity | null,
  ): candidate is UserWithBusiness => Boolean(candidate?.businessID);
  const { product, status } = useSelector(selectUpdateProductData) as {
    product: ProductRecord | null;
    status: string | boolean;
  };
  const [form] = Form.useForm();
  const [state, setState] = useReducer(
    barcodeGeneratorStateReducer,
    initialBarcodeGeneratorState,
  );
  const {
    generatedCode,
    showConfigModal,
    autoMode,
    loadingGenerate,
    selectedStandard,
    useCompanyPrefix,
    internalManualValues,
    companyPrefixValid,
    itemReferenceValid,
    manualValues,
    selectedConfig,
    companyPrefixConfigValid,
  } = state;
  const setGeneratedCode: React.Dispatch<React.SetStateAction<string>> = (
    update,
  ) =>
    setState((prev) => ({
      generatedCode:
        typeof update === 'function' ? update(prev.generatedCode) : update,
    }));
  const setShowConfigModal: React.Dispatch<React.SetStateAction<boolean>> = (
    update,
  ) =>
    setState((prev) => ({
      showConfigModal:
        typeof update === 'function' ? update(prev.showConfigModal) : update,
    }));
  const setAutoMode: React.Dispatch<React.SetStateAction<boolean>> = (update) =>
    setState((prev) => ({
      autoMode: typeof update === 'function' ? update(prev.autoMode) : update,
    }));
  const setLoadingGenerate = (value: boolean) =>
    setState({ loadingGenerate: value });
  const setSelectedStandard: React.Dispatch<
    React.SetStateAction<Gs1StandardKey>
  > = (update) =>
    setState((prev) => ({
      selectedStandard:
        typeof update === 'function' ? update(prev.selectedStandard) : update,
    }));
  const setUseCompanyPrefix: React.Dispatch<React.SetStateAction<boolean>> = (
    update,
  ) =>
    setState((prev) => ({
      useCompanyPrefix:
        typeof update === 'function' ? update(prev.useCompanyPrefix) : update,
    }));
  const setInternalManualValues: React.Dispatch<
    React.SetStateAction<InternalManualValues>
  > = (update) =>
    setState((prev) => ({
      internalManualValues:
        typeof update === 'function'
          ? update(prev.internalManualValues)
          : update,
    }));
  const setCompanyPrefixValid = (value: boolean | null) =>
    setState({ companyPrefixValid: value });
  const setItemReferenceValid = (value: boolean | null) =>
    setState({ itemReferenceValid: value });
  const setManualValues: React.Dispatch<React.SetStateAction<ManualValues>> = (
    update,
  ) =>
    setState((prev) => ({
      manualValues:
        typeof update === 'function' ? update(prev.manualValues) : update,
    }));

  // Seguimiento local del último código conocido y del baseline de DB.
  const lastDatabaseBarcodeRef = useRef<string | null>(currentBarcode ?? null);
  const lastKnownBarcodeRef = useRef<string | null>(currentBarcode ?? null);

  // Hook para listener en tiempo real del producto
  const shouldListen = Boolean(visible && status === 'update' && product?.id);
  const {
    productData: realtimeProduct,
    loading: realtimeLoading,
    error: realtimeError,
    isConnected,
    currentBarcode: realtimeCurrentBarcode,
    isUpdating,
  } = useProductRealtimeListener(
    user?.businessID,
    product?.id,
    shouldListen, // Solo activar si estamos en modo actualización
  ) as {
    productData: ProductRecord | null;
    loading: boolean;
    error: ProductListenerError | null;
    isConnected: boolean;
    currentBarcode: string | null;
    isUpdating: boolean;
  };

  // Hook para manejar configuración de códigos de barras
  const {
    settings,
    loading: settingsLoading,
    nextItemReference,
    saveSettings,
    isConfigured,
    refresh,
  } = useBarcodeSettings();

  // Estado local para configuración temporal
  const setSelectedConfig: React.Dispatch<
    React.SetStateAction<BarcodeSettings | null>
  > = (update) =>
    setState((prev) => ({
      selectedConfig:
        typeof update === 'function' ? update(prev.selectedConfig) : update,
    }));
  const setCompanyPrefixConfigValid = (value: boolean) =>
    setState({ companyPrefixConfigValid: value });

  // Cargar configuración guardada al abrir el modal (evitar sobreescribir mientras se edita)
  React.useEffect(() => {
    if (visible && settings && !showConfigModal) {
      console.log('Cargando configuración al abrir modal:', settings);
      setSelectedConfig(settings);
      // Inicializar validez si ya hay configuración guardada
      setCompanyPrefixConfigValid(
        settings.companyPrefix
          ? /^\d{4,7}$/.test(settings.companyPrefix)
          : true,
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

  // Efecto adicional para sincronizar cuando settings cambia (después de guardar)
  React.useEffect(() => {
    if (settings && visible && !showConfigModal) {
      // Sincronizar solo cuando no se está editando manualmente
      const savedPrefix = settings.companyPrefix;
      const localPrefix = selectedConfig?.companyPrefix;

      if (savedPrefix && savedPrefix !== localPrefix) {
        console.log(
          'Sincronizando configuración guardada desde DB:',
          savedPrefix,
        );
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

  const getInitialCompanyPrefix = useCallback(
    (barcode: string | null | undefined) => {
      if (!barcode || !settings || !isGS1RDCode(barcode)) {
        return '';
      }

      return (
        extractCompanyPrefix(barcode, settings.companyPrefixLength || 4) || ''
      );
    },
    [settings],
  );

  const handleMainModalOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setShowConfigModal(false);
        return;
      }

      syncTrackedBarcodeRefs(
        lastKnownBarcodeRef,
        lastDatabaseBarcodeRef,
        currentBarcode,
      );
      setManualValues({
        companyPrefix: getInitialCompanyPrefix(currentBarcode),
        itemReference: '',
      });
      setInternalManualValues({ itemReference: '' });
    },
    [currentBarcode, getInitialCompanyPrefix],
  );

  // Efecto para manejar cambios en tiempo real del código de barras
  useEffect(() => {
    if (!visible || status !== 'update') return;

    const hasPendingManualChanges =
      currentBarcode !== lastDatabaseBarcodeRef.current ||
      (currentBarcode !== realtimeCurrentBarcode &&
        realtimeCurrentBarcode !== null);

    // Solo actualizar si hay cambios desde la base de datos y NO hay cambios manuales pendientes
    if (
      realtimeProduct &&
      realtimeCurrentBarcode !== lastKnownBarcodeRef.current &&
      !hasPendingManualChanges
    ) {
      if (
        lastKnownBarcodeRef.current !== null &&
        lastKnownBarcodeRef.current !== currentBarcode
      ) {
        notification.info({
          message: '🔄 Código de Barras Actualizado',
          description: (
            <div>
              <div>El código de barras se actualizó en tiempo real:</div>
              <div
                style={{
                  fontFamily: 'monospace',
                  backgroundColor: '#f6ffed',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  marginTop: '8px',
                  border: '1px solid #b7eb8f',
                }}
              >
                {realtimeCurrentBarcode || 'Sin código'}
              </div>
            </div>
          ),
          duration: 6,
          placement: 'topRight',
        });
      }

      syncTrackedBarcodeRefs(
        lastKnownBarcodeRef,
        lastDatabaseBarcodeRef,
        realtimeCurrentBarcode,
      );

      // Llamar al callback para sincronizar con el componente padre solo si no hay cambios manuales
      if (onGenerate && realtimeCurrentBarcode !== currentBarcode) {
        onGenerate(realtimeCurrentBarcode);
      }
    }
  }, [
    realtimeCurrentBarcode,
    visible,
    status,
    realtimeProduct,
    currentBarcode,
    onGenerate,
  ]);

  // Mostrar errores del listener en tiempo real
  useEffect(() => {
    if (realtimeError && visible) {
      console.warn('Error en listener de producto:', realtimeError);
      // Solo mostrar errores críticos al usuario
      if (realtimeError.type === 'listener_error') {
        notification.warning({
          message: 'Conexión Interrumpida',
          description:
            'La conexión en tiempo real se interrumpió. Los cambios pueden no reflejarse inmediatamente.',
          duration: 4,
        });
      }
    }
  }, [realtimeError, visible, realtimeProduct]);

  // Función helper para obtener la función de generación correcta según el país
  function getGeneratorFunction(standard: Gs1StandardKey): GeneratorFn {
    const generators: Record<Gs1StandardKey, GeneratorFn> = {
      gs1rd: generateGTIN13RD,
      gs1us: generateGTIN13US,
      gs1mx: generateGTIN13MX,
      gs1co: generateGTIN13CO,
      gs1ar: generateGTIN13AR,
      gs1cl: generateGTIN13CL,
      gs1pe: generateGTIN13PE,
    };
    return generators[standard] || generateGTIN13RD; // Default to RD
  }

  function getInternalGeneratorFunction(
    standard: Gs1StandardKey,
  ): InternalGeneratorFn {
    const generators: Record<Gs1StandardKey, InternalGeneratorFn> = {
      gs1rd: generateInternalGTIN13RD,
      gs1us: (categoryPrefix, itemReference) =>
        generateGTIN13US(categoryPrefix, itemReference),
      gs1mx: (categoryPrefix, itemReference) =>
        generateGTIN13MX(categoryPrefix, itemReference),
      gs1co: (categoryPrefix, itemReference) =>
        generateGTIN13CO(categoryPrefix, itemReference),
      gs1ar: (categoryPrefix, itemReference) =>
        generateGTIN13AR(categoryPrefix, itemReference),
      gs1cl: (categoryPrefix, itemReference) =>
        generateGTIN13CL(categoryPrefix, itemReference),
      gs1pe: (categoryPrefix, itemReference) =>
        generateGTIN13PE(categoryPrefix, itemReference),
    };
    return generators[standard] || generateInternalGTIN13RD; // Default to RD
  }

  // Función para crear previsualización en tiempo real
  const createLivePreview = useCallback(
    (companyPrefix: string, itemReference: string) => {
      if (!companyPrefix || !itemReference) {
        return '';
      }

      const prefix = GS1_PREFIXES[selectedStandard] || '746';

      try {
        const generator = getGeneratorFunction(selectedStandard);
        const fullCode = generator(companyPrefix, itemReference);
        const checkDigit = fullCode.slice(-1);

        return `${prefix} | ${companyPrefix} | ${itemReference} | ${checkDigit}`;
      } catch {
        return '';
      }
    },
    [selectedStandard],
  );

  // Función para crear previsualización en modo interno
  const createInternalLivePreview = useCallback(
    (itemReference: string) => {
      if (!itemReference) {
        return '';
      }

      const prefix = GS1_PREFIXES[selectedStandard] || '746';

      try {
        const internalGenerator =
          getInternalGeneratorFunction(selectedStandard);
        const fullCode = internalGenerator('', itemReference);
        const checkDigit = fullCode.slice(-1);

        return `${prefix} | ${itemReference} | ${checkDigit}`;
      } catch {
        return '';
      }
    },
    [selectedStandard],
  );

  const validateItemReference = (
    value: string,
    config: BarcodeSettings | null,
  ) => {
    if (!value) return null;
    if (!/^\d+$/.test(value)) return false;
    if (config && value.length !== config.itemReferenceLength) return false;
    return true;
  };

  // Función para generar código (unificada)
  const handleGenerateCode = async () => {
    setLoadingGenerate(true);

    const generationError = await (async () => {
      let finalCode = '';

      if (!useCompanyPrefix) {
        // Modo interno
        const internalGenerator =
          getInternalGeneratorFunction(selectedStandard);
        if (autoMode) {
          let reservedRef = nextItemReference || '000000001';
          try {
            reservedRef = await generateNextItemReference(user);
          } catch (err) {
            const messageText =
              err instanceof Error ? err.message : String(err);
            console.warn('generateNextItemReference fallback:', messageText);
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
        const finalCompanyPrefix =
          selectedConfig?.companyPrefix || settings?.companyPrefix || '';
        if (autoMode) {
          const reservedRef = await generateNextItemReference(user);
          finalCode = standardGenerator(finalCompanyPrefix, reservedRef);
        } else {
          finalCode = standardGenerator(
            finalCompanyPrefix,
            manualValues.itemReference,
          );
        }
      }

      // Aplicar directamente
      if (status === 'update' && product?.id) {
        if (!hasBusiness(user)) {
          notification.error({
            message: 'Negocio no encontrado',
            description: 'No se pudo actualizar el código de barras.',
            duration: 4,
          });
          return;
        }
        const updatedProduct = {
          ...product,
          id: String(product.id),
          barcode: finalCode,
        };
        await fbUpdateProduct(updatedProduct, user);
        notification.success({
          message: 'Código de Barras Actualizado',
          description: `El código de barras del producto "${product.name}" ha sido actualizado en la base de datos.`,
          duration: 4,
        });
      } else {
        onGenerate?.(finalCode);
        notification.success({
          message: 'Código Generado',
          description: 'El código se asignará al guardar el producto.',
          duration: 3,
        });
      }

      // Cerrar y limpiar
      onClose();
      setManualValues({ companyPrefix: '', itemReference: '' });
      setInternalManualValues({ itemReference: '' });
      setItemReferenceValid(null);
      setCompanyPrefixValid(null);
      setAutoMode(
        typeof settings?.autoModeDefault === 'boolean'
          ? settings.autoModeDefault
          : true,
      );
      setUseCompanyPrefix(
        typeof settings?.useCompanyPrefixDefault === 'boolean'
          ? settings.useCompanyPrefixDefault
          : false,
      );
      refresh?.();
    })()
      .then(() => null)
      .catch((error) => error);

    if (generationError) {
      console.error('Error al generar código:', generationError);
      notification.error({
        message: 'Error al Generar',
        description: 'Hubo un error al generar el código de barras.',
        duration: 4,
      });
    }

    setLoadingGenerate(false);
  };

  // Company Prefix es readonly en GenerateTab, se maneja solo en ConfigurationTab

  // Función para manejar cambios en Item Reference manual
  const handleManualItemReferenceChange = (value: string) => {
    const newValues = { ...manualValues, itemReference: value };
    setManualValues(newValues);

    const isValid = validateItemReference(value, selectedConfig);
    setItemReferenceValid(isValid);
  };

  // Funciones para manejar el modo interno (simplificado)
  const handleInternalItemReferenceChange = (value: string) => {
    const newValues = { ...internalManualValues, itemReference: value };
    setInternalManualValues(newValues);

    const isValid = validateInternalItemReference(value);
    setItemReferenceValid(isValid);
  };

  const validateInternalItemReference = (value: string) => {
    if (!value) return null;
    if (!/^\d+$/.test(value)) return false;
    if (value.length !== 9) return false;
    return true;
  };

  const livePreview = (() => {
    if (useCompanyPrefix) {
      if (!selectedConfig?.companyPrefix) {
        return '';
      }

      if (autoMode) {
        return nextItemReference
          ? createLivePreview(selectedConfig.companyPrefix, nextItemReference)
          : '';
      }

      return itemReferenceValid === true && manualValues.itemReference
        ? createLivePreview(
            selectedConfig.companyPrefix,
            manualValues.itemReference,
          )
        : '';
    }

    if (autoMode) {
      return nextItemReference
        ? createInternalLivePreview(nextItemReference)
        : '';
    }

    return itemReferenceValid === true && internalManualValues.itemReference
      ? createInternalLivePreview(internalManualValues.itemReference)
      : '';
  })();

  // Función para manejar cambios en el Company Prefix
  const handleCompanyPrefixChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const companyPrefix = e.target.value;

    // Crear nueva configuración con el valor actualizado
    let newConfig: BarcodeSettings = {
      ...(selectedConfig ?? {}), // Mantener configuración existente
      companyPrefix,
    };

    // Si es numérico, calcular configuración automática válida
    if (/^\d+$/.test(companyPrefix)) {
      const companyPrefixLength = companyPrefix.length;
      const itemReferenceLength = 9 - companyPrefixLength;
      if (itemReferenceLength >= 2 && itemReferenceLength <= 5) {
        const maxProducts = Math.pow(10, itemReferenceLength);
        newConfig = {
          ...newConfig,
          companyPrefixLength,
          itemReferenceLength,
          maxProducts,
          name: `Empresa ${companyPrefixLength}+${itemReferenceLength}`,
          description: `Configuración automática para ${maxProducts.toLocaleString()} productos`,
        };
      }
    }

    // Actualizar la configuración local inmediatamente
    setSelectedConfig(newConfig);

    // La validación ahora se maneja en ConfigurationTab
    // Validación: solo números, longitud entre 4 y 7
    const isValidConfig =
      companyPrefix === '' || /^\d{4,7}$/.test(companyPrefix);
    setCompanyPrefixConfigValid(isValidConfig);

    // Limpiar código generado
    setGeneratedCode('');
    form.resetFields();
  };

  // Función para guardar configuración
  const handleSaveConfiguration = async () => {
    if (!companyPrefixConfigValid) {
      notification.warning({
        message: 'Prefijo inválido',
        description:
          'Ingresa 4-7 dígitos o deja el campo vacío para eliminar el prefijo.',
        duration: 3,
      });
      return;
    }

    if (!selectedConfig) {
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
        duration: 4,
      });
    }
  };

  // Guardar preferencia: usar o no Prefijo de Empresa (GS1)
  const handleToggleUseCompanyPrefix = async (checked: boolean) => {
    setUseCompanyPrefix(checked);
    const nextSettings = {
      ...(settings || {}),
      useCompanyPrefixDefault: checked,
    };

    try {
      await saveSettings(nextSettings);
    } catch (error) {
      console.error('Error al guardar preferencia useCompanyPrefix:', error);
    }
  };

  const handleToggleAutoMode = async (checked: boolean) => {
    setAutoMode(checked);

    if (!checked) {
      // Automático → Manual: dejar el input vacío
      if (useCompanyPrefix) {
        setManualValues((v) => ({ ...v, itemReference: '' }));
      } else {
        setInternalManualValues({ itemReference: '' });
      }
      setItemReferenceValid(null);
    }

    const nextSettings = { ...(settings || {}), autoModeDefault: checked };

    try {
      await saveSettings(nextSettings);
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
    // Mantener la configuración actual para no perderla al reabrir
    setSelectedConfig(settings || null);
    // reset to generate view
    setShowConfigModal(false);
    // Restaurar preferencias guardadas o valores por defecto
    setAutoMode(
      typeof settings?.autoModeDefault === 'boolean'
        ? settings.autoModeDefault
        : true,
    );
    setSelectedStandard('gs1rd');
    setCompanyPrefixValid(null);
    setItemReferenceValid(null);
    setManualValues({ companyPrefix: '', itemReference: '' });

    // Reset interno
    setUseCompanyPrefix(
      typeof settings?.useCompanyPrefixDefault === 'boolean'
        ? settings.useCompanyPrefixDefault
        : false,
    );
    setInternalManualValues({ itemReference: '' });

    // Resetear baseline del listener
    syncTrackedBarcodeRefs(
      lastKnownBarcodeRef,
      lastDatabaseBarcodeRef,
      currentBarcode,
    );
  };

  return (
    <Modal
      width={500}
      title={
        <Space>
          <CalculatorOutlined />
          Generación de Código de Barras
          {/* Indicador de conexión en tiempo real */}
          {status === 'update' && product?.id && (
            <Space size={4}>
              {isConnected ? (
                <Space></Space>
              ) : realtimeLoading ? (
                <Text
                  type="secondary"
                  style={{ fontSize: '12px', color: '#faad14' }}
                >
                  Conectando...
                </Text>
              ) : (
                <Space size={4} style={{ color: '#ff4d4f' }}>
                  <DisconnectOutlined />
                  <Text
                    type="secondary"
                    style={{ fontSize: '12px', color: '#ff4d4f' }}
                  >
                    Desconectado
                  </Text>
                </Space>
              )}
              {isUpdating && (
                <Text
                  type="secondary"
                  style={{ fontSize: '12px', color: '#1890ff' }}
                >
                  Actualizando...
                </Text>
              )}
            </Space>
          )}
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      afterOpenChange={handleMainModalOpenChange}
      style={{ top: '20px' }}
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
                  ? useCompanyPrefix
                    ? !selectedConfig?.companyPrefix
                    : false
                  : useCompanyPrefix
                    ? !(
                        selectedConfig?.companyPrefix &&
                        itemReferenceValid === true
                      )
                    : itemReferenceValid !== true
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
            handleInternalItemReferenceChange={
              handleInternalItemReferenceChange
            }
            nextItemReference={nextItemReference}
            livePreview={livePreview}
            handleGenerateCode={handleGenerateCode}
            loadingGenerate={loadingGenerate}
            generatedCode={generatedCode}
            onOpenConfig={() => setShowConfigModal(true)}
            selectedStandard={selectedStandard}
            onStandardChange={setSelectedStandard}
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
            setCompanyPrefixConfigValid(
              /^\d{4,7}$/.test(settings.companyPrefix),
            );
          }
        }}
        footer={
          <Space>
            <Button
              onClick={() => {
                setShowConfigModal(false);
                // Revertir cambios locales al cerrar sin guardar
                if (settings) {
                  setSelectedConfig(settings);
                  setCompanyPrefixConfigValid(
                    /^\d{4,7}$/.test(settings.companyPrefix),
                  );
                }
              }}
            >
              Cancelar
            </Button>
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
            setCompanyPrefixConfigValid(
              /^\d{4,7}$/.test(settings.companyPrefix),
            );
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
