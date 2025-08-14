import { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'

import { getTaxReceiptData, selectTaxReceiptEnabled } from '../../../../../features/taxReceipt/taxReceiptSlice'
import { fbGetTaxReceipt } from '../../../../../firebase/taxReceipt/fbGetTaxReceipt'
import { fbUpdateTaxReceipt } from '../../../../../firebase/taxReceipt/fbUpdateTaxReceipt'
import { selectUser } from '../../../../../features/auth/userSlice'
import { useCompareArrays } from '../../../../../hooks/useCompareArrays'
import { fbEnabledTaxReceipt } from '../../../../../firebase/Settings/taxReceipt/fbEnabledTaxReceipt'
import { useDialog } from '../../../../../Context/Dialog/DialogContext'
import { serializeFirestoreDocuments } from '../../../../../utils/serialization/serializeFirestoreData'
import { fbUpdateFiscalAlertsConfig } from '../../../../../firebase/Settings/fiscalAlertsConfig/fbUpdateFiscalAlertsConfig'
import { fbGetFiscalAlertsConfig } from '../../../../../firebase/Settings/fiscalAlertsConfig/fbGetFiscalAlertsConfig'
import { FISCAL_RECEIPTS_ALERT_CONFIG } from '../../../../../config/fiscalReceiptsAlertConfig'

import { Spin, Typography } from 'antd'
import AddReceiptDrawer from './components/AddReceiptModal/AddReceiptModal'
import { message } from 'antd'
import { ReceiptSettingsSection } from './components/ReceiptSettingsSection/ReceiptSettingsSection'
import { ReceiptTableSection } from './components/ReceiptTableSection/ReceiptTableSection'
import FiscalReceiptsAlertWidget from './components/FiscalReceiptsAlertWidget/FiscalReceiptsAlertWidget'
import { filterPredefinedReceipts, generateNewTaxReceipt } from './utils/taxReceiptUtils'
import { useLoadingStatus } from '../../../../../hooks/useLoadingStatus'

const { Title, Paragraph } = Typography;

export const TaxReceiptSetting = () => {  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const taxReceiptEnabled = useSelector(selectTaxReceiptEnabled);
  const { taxReceipt, isLoading: loadingReceipts } = fbGetTaxReceipt();
  const { setDialogConfirm, onClose } = useDialog();

  const [taxReceiptLocal, setTaxReceiptLocal] = useState([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [alertConfig, setAlertConfig] = useState(null);
  const [loadingAlertConfig, setLoadingAlertConfig] = useState(true);

  const isUnchanged = useCompareArrays(taxReceiptLocal, taxReceipt);
  useEffect(() => {
    const serializedTaxReceipt = serializeFirestoreDocuments(taxReceipt);
    dispatch(getTaxReceiptData(serializedTaxReceipt))
    setTaxReceiptLocal(serializedTaxReceipt)
  }, [taxReceipt, dispatch])

  // Cargar configuración de alertas al montar el componente
  useEffect(() => {
    const loadAlertConfig = async () => {
      if (user?.id) {
        try {
          setLoadingAlertConfig(true);
          const config = await fbGetFiscalAlertsConfig(user);
          console.log('Configuración de alertas cargada:', config);
          setAlertConfig(config);
        } catch (error) {
          console.error('Error al cargar configuración de alertas:', error);
          // Usar configuración por defecto en caso de error
          const defaultConfig = {
            alertsEnabled: true,
            globalThresholds: {
              warning: FISCAL_RECEIPTS_ALERT_CONFIG.DEFAULT_WARNING_THRESHOLD,
              critical: FISCAL_RECEIPTS_ALERT_CONFIG.DEFAULT_CRITICAL_THRESHOLD
            },
            customThresholds: {}
          };
          setAlertConfig(defaultConfig);
          message.error('Error al cargar la configuración de alertas, usando valores por defecto');
        } finally {
          setLoadingAlertConfig(false);
        }
      } else {
        // Si no hay usuario, usar configuración por defecto inmediatamente
        const defaultConfig = {
          alertsEnabled: true,
          globalThresholds: {
            warning: FISCAL_RECEIPTS_ALERT_CONFIG.DEFAULT_WARNING_THRESHOLD,
            critical: FISCAL_RECEIPTS_ALERT_CONFIG.DEFAULT_CRITICAL_THRESHOLD
          },
          customThresholds: {}
        };
        setAlertConfig(defaultConfig);
        setLoadingAlertConfig(false);
      }
    };

    loadAlertConfig();
  }, [user]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await fbUpdateTaxReceipt(user, taxReceiptLocal);
      message.success('Comprobantes fiscales actualizados correctamente');
    } catch (error) {
      message.error('Error al actualizar los comprobantes fiscales. Por favor, inténtalo de nuevo más tarde.');
    } finally {
      setIsSaving(false);
    }
  }, [user, taxReceiptLocal]);

  const handleCancel = () => setTaxReceiptLocal(taxReceipt);

  const handleTaxReceiptEnabled = () => {
    if (taxReceiptEnabled) {
      setDialogConfirm({
        title: '¿Deshabilitar comprobantes?',
        isOpen: true,
        type: 'warning',
        message: 'Si deshabilitas los comprobantes, no se mostrarán en el punto de venta.',
        onConfirm: () => {
          fbEnabledTaxReceipt(user)
          onClose()
        },
      })
    } else {
      fbEnabledTaxReceipt(user)
    }
  };

  const handleAddNewTaxReceipt = () => {
    const newItem = generateNewTaxReceipt(taxReceiptLocal);
    setTaxReceiptLocal([...taxReceiptLocal, newItem]);
    message.success('Nuevo comprobante agregado. No olvides guardar los cambios.');
  };

  const handleOpenAddPredefinedReceipt = () => setIsAddModalVisible(true);
  const handleCloseAddPredefinedReceipt = () => setIsAddModalVisible(false);

  function handleAddPredefinedReceipts(newReceipts) {
    const { unique, duplicateNames, duplicateSeries } = filterPredefinedReceipts(
      newReceipts,
      taxReceiptLocal
    );

    let warningMsg = '';
    if (duplicateNames.length) {
      warningMsg += `Se omitieron ${duplicateNames.length} comprobante(s) con nombre(s) duplicado(s): ${duplicateNames.join(', ')}. `;
    }
    if (duplicateSeries.length) {
      warningMsg += `Se omitieron ${duplicateSeries.length} comprobante(s) con serie(s) duplicada(s): ${duplicateSeries.join(', ')}.`;
    }
    if (warningMsg) {
      message.warning(warningMsg);
    }

    if (unique.length) {
      setTaxReceiptLocal([...taxReceiptLocal, ...unique]);
      message.success(
        `${unique.length} comprobante(s) añadidos correctamente. No olvides guardar los cambios.`
      );
    } else if (!warningMsg) {
      message.error('No se agregaron comprobantes. Todos ya existen en el sistema.');
    }
  }

  const handleAlertConfigChange = async (config) => {
    setAlertConfig(config);
    
    // Guardar en Firebase
    try {
      await fbUpdateFiscalAlertsConfig(user, config);
      message.success('Configuración de alertas guardada correctamente');
    } catch (error) {
      console.error('Error al guardar configuración de alertas:', error);
      message.error('Error al guardar la configuración de alertas');
    }
  };

  // Definimos entradas para el control de carga con valores explícitos
  const loadEntries = [
    { loading: loadingReceipts === true, tip: 'Cargando comprobantes fiscales...' },
    { loading: isSaving === true, tip: 'Guardando comprobantes fiscales...' },
    { loading: loadingAlertConfig === true, tip: 'Cargando configuración de alertas...' },
  ];

  // Utilizamos useLoadingStatus para centralizar la lógica de carga
  const { isLoading, tip } = useLoadingStatus(loadEntries);
  return (
    <Spin spinning={isLoading} tip={tip}>
      <Page>
        <Head>
          <Title level={3} style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 }}>
            Configuración de Comprobantes
          </Title>
          <Paragraph style={{ fontSize: '16px', margin: 0, lineHeight: '1.5', color: 'rgba(0, 0, 0, 0.65)' }}>
            Ajusta cómo se generan y muestran los comprobantes en el punto de venta.
          </Paragraph>
        </Head>

        <ReceiptSettingsSection
          enabled={taxReceiptEnabled}
          onToggle={handleTaxReceiptEnabled}
        />

        <ReceiptTableSection
          enabled={taxReceiptEnabled}
          itemsLocal={taxReceiptLocal}
          setItemsLocal={setTaxReceiptLocal}
          isUnchanged={isUnchanged}
          onAddBlank={handleAddNewTaxReceipt}
          onAddPredefined={handleOpenAddPredefinedReceipt}
        />

        {/* Widget de Alertas - Solo mostrar si no está cargando los comprobantes
        {!loadingReceipts && (
          <FiscalReceiptsAlertWidget
            taxReceipts={taxReceiptLocal}
            onConfigChange={handleAlertConfigChange}
            disabled={!taxReceiptEnabled}
            alertConfig={alertConfig}
          />
        )} */}

        <AddReceiptDrawer
          visible={isAddModalVisible}
          onCancel={handleCloseAddPredefinedReceipt}
          onAddReceipt={handleAddPredefinedReceipts}
          existingReceipts={taxReceiptLocal}
        />
      </Page>
    </Spin>
  )
}

const Page = styled.div`
  display: grid;
  gap: 1.6em;
  padding: 1em;
`
const Head = styled.div`
  display: grid;
  width: 100%;
`

