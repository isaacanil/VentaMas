import { Spin, Typography, Modal, message } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { useDialog } from '../../../../../Context/Dialog';
import { selectUser } from '../../../../../features/auth/userSlice';
import {
  getTaxReceiptData,
  selectTaxReceiptEnabled,
} from '../../../../../features/taxReceipt/taxReceiptSlice';
import { fbEnabledTaxReceipt } from '../../../../../firebase/Settings/taxReceipt/fbEnabledTaxReceipt';
import { fbGetTaxReceipt } from '../../../../../firebase/taxReceipt/fbGetTaxReceipt';
import { rebuildNcfLedger } from '../../../../../firebase/taxReceipt/rebuildNcfLedger';
import { useCompareArrays } from '../../../../../hooks/useCompareArrays';
import { useLoadingStatus } from '../../../../../hooks/useLoadingStatus';
import { serializeFirestoreDocuments } from '../../../../../utils/serialization/serializeFirestoreData';

import AddReceiptDrawer from './components/AddReceiptModal/AddReceiptModal';
import { ReceiptSettingsSection } from './components/ReceiptSettingsSection/ReceiptSettingsSection';
import { ReceiptTableSection } from './components/ReceiptTableSection/ReceiptTableSection';
import {
  buildPrefix,
  sanitizePart,
} from './components/TaxReceiptForm/utils/ncfUtils';
import {
  filterPredefinedReceipts,
  generateNewTaxReceipt,
} from './utils/taxReceiptUtils';

const { Title, Paragraph } = Typography;

export const TaxReceiptSetting = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const taxReceiptEnabled = useSelector(selectTaxReceiptEnabled);
  const { taxReceipt, isLoading: loadingReceipts } = fbGetTaxReceipt();
  const { setDialogConfirm, onClose } = useDialog();

  const [taxReceiptLocal, setTaxReceiptLocal] = useState([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [rebuildingLedger, setRebuildingLedger] = useState(false);

  const userId = user?.uid || user?.id || null;

  const configuredPrefixes = useMemo(() => {
    if (!Array.isArray(taxReceiptLocal)) return [];

    const prefixSet = new Set();

    taxReceiptLocal.forEach((item) => {
      const data = item?.data ?? item;
      const normalizedType = sanitizePart(data?.type).toUpperCase();
      const normalizedSerie = sanitizePart(data?.serie).toUpperCase();

      const primaryPrefix = buildPrefix(data?.type, data?.serie);
      if (primaryPrefix) {
        prefixSet.add(primaryPrefix.toUpperCase());
      }

      if (normalizedType || normalizedSerie) {
        const rawCombined = `${normalizedType}${normalizedSerie}`.trim();
        if (rawCombined) prefixSet.add(rawCombined);

        // Algunos negocios persisten el prefijo en orden inverso (serie + tipo)
        const swappedCombined = `${normalizedSerie}${normalizedType}`.trim();
        if (swappedCombined) prefixSet.add(swappedCombined);
      }
    });

    return Array.from(prefixSet).filter(Boolean);
  }, [taxReceiptLocal]);

  const isUnchanged = useCompareArrays(taxReceiptLocal, taxReceipt);

  useEffect(() => {
    const serializedTaxReceipt = serializeFirestoreDocuments(taxReceipt);
    dispatch(getTaxReceiptData(serializedTaxReceipt));
    setTaxReceiptLocal(serializedTaxReceipt);
  }, [taxReceipt, dispatch]);

  const handleTaxReceiptEnabled = () => {
    if (taxReceiptEnabled) {
      setDialogConfirm({
        title: '┬┐Deshabilitar comprobantes?',
        isOpen: true,
        type: 'warning',
        message:
          'Si deshabilitas los comprobantes, no se mostrar├ín en el punto de venta.',
        onConfirm: () => {
          fbEnabledTaxReceipt(user);
          onClose();
        },
      });
    } else {
      fbEnabledTaxReceipt(user);
    }
  };

  const handleAddNewTaxReceipt = () => {
    const newItem = generateNewTaxReceipt(taxReceiptLocal);
    setTaxReceiptLocal([...taxReceiptLocal, newItem]);
    message.success(
      'Nuevo comprobante agregado. No olvides guardar los cambios.',
    );
  };

  const handleOpenAddPredefinedReceipt = () => setIsAddModalVisible(true);
  const handleCloseAddPredefinedReceipt = () => setIsAddModalVisible(false);

  const handleAddPredefinedReceipts = (newReceipts) => {
    const { unique, duplicateNames, duplicateSeries } =
      filterPredefinedReceipts(newReceipts, taxReceiptLocal);

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
        `${unique.length} comprobante(s) a├▒adidos correctamente. No olvides guardar los cambios.`,
      );
    } else if (!warningMsg) {
      message.error(
        'No se agregaron comprobantes. Todos ya existen en el sistema.',
      );
    }
  };

  const handleRebuildLedger = useCallback(() => {
    if (!user?.businessID || !userId) {
      message.error(
        'No pudimos identificar tu sesi├│n para reconstruir el ledger.',
      );
      return;
    }

    Modal.confirm({
      title: 'Reconstruir ledger de NCF',
      centered: true,
      okText: 'Reconstruir',
      cancelText: 'Cancelar',
      content: (
        <div>
          <p>
            Esta acci├│n recalcular├í el ledger de comprobantes fiscales
            utilizando las facturas registradas para sincronizar la numeraci├│n.
          </p>
          {configuredPrefixes.length > 0 ? (
            <p>
              Detectamos los prefijos configurados:{' '}
              <strong>{configuredPrefixes.join(', ')}</strong>. El backend usar├í
              la configuraci├│n oficial de la empresa.
            </p>
          ) : (
            <p>
              No se detectaron prefijos espec├¡ficos; se procesar├í el ledger
              completo del negocio.
            </p>
          )}
          <p style={{ marginBottom: 0 }}>
            El proceso puede tardar algunos segundos.
          </p>
        </div>
      ),
      onOk: () => {
        setRebuildingLedger(true);

        return rebuildNcfLedger({
          businessId: user.businessID,
          userId,
        })
          .then((result) => {
            const {
              processed = 0,
              written = 0,
              skipped = 0,
              emptyNcf = 0,
            } = result ?? {};
            const parts = [`${written} reconstruidas`];
            if (skipped) parts.push(`${skipped} omitidas`);
            if (emptyNcf) parts.push(`${emptyNcf} sin NCF`);
            message.success(
              `Ledger sincronizado. Procesadas ${processed} facturas (${parts.join(', ')}).`,
            );
          })
          .catch((error) => {
            console.error('Error al reconstruir el ledger de NCF:', error);
            const errorMessage =
              error?.message || 'No se pudo reconstruir el ledger.';
            message.error(errorMessage);
          })
          .finally(() => {
            setRebuildingLedger(false);
          });
      },
    });
  }, [configuredPrefixes, user?.businessID, userId]);

  // Definimos entradas para el control de carga con valores expl├¡citos
  const loadEntries = [
    {
      loading: loadingReceipts === true,
      tip: 'Cargando comprobantes fiscales...',
    },
    {
      loading: rebuildingLedger === true,
      tip: 'Reconstruyendo ledger de NCF...',
    },
  ];

  // Utilizamos useLoadingStatus para centralizar la l├│gica de carga
  const { isLoading, tip } = useLoadingStatus(loadEntries);
  return (
    <Spin spinning={isLoading} tip={tip}>
      <Page>
        <Head>
          <Title
            level={3}
            style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 600 }}
          >
            Configuraci├│n de Comprobantes
          </Title>
          <Paragraph
            style={{
              fontSize: '16px',
              margin: 0,
              lineHeight: '1.5',
              color: 'rgb(0 0 0 / 65%)',
            }}
          >
            Ajusta c├│mo se generan y muestran los comprobantes en el punto de
            venta.
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
          onRebuildLedger={handleRebuildLedger}
          rebuildInProgress={rebuildingLedger}
        />

        <AddReceiptDrawer
          visible={isAddModalVisible}
          onCancel={handleCloseAddPredefinedReceipt}
          onAddReceipt={handleAddPredefinedReceipts}
          existingReceipts={taxReceiptLocal}
        />
      </Page>
    </Spin>
  );
};

const Page = styled.div`
  display: grid;
  gap: 1.6em;
  padding: 1em;
`;
const Head = styled.div`
  display: grid;
  width: 100%;
`;
