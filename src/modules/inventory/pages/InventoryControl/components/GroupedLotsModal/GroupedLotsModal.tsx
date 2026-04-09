import { Button, Modal, message } from 'antd';

import { GroupedLotsTable } from './components/GroupedLotsTable';
import { useGroupedLotsChanges } from './hooks/useGroupedLotsChanges';

import type {
  BaselineSnapshot,
  CountsMap,
  CountsMetaMap,
  ExpirationEditsMap,
  InventoryGroup,
  LocationNamesMap,
  ResolvingMap,
} from '@/utils/inventory/types';

interface GroupedLotsModalProps {
  open: boolean;
  group: InventoryGroup | null;
  counts: CountsMap;
  countsMeta: CountsMetaMap;
  usersNameCache: Record<string, string>;
  locationNamesMap?: LocationNamesMap;
  resolvingLocations?: ResolvingMap;
  expirationEdits?: ExpirationEditsMap;
  onChangeExpiration?: (key: string, value: string | null | undefined) => void;
  onChangeCount: (key: string, value: number) => void;
  onClose: () => void;
  onSave?: () => Promise<void> | void;
  serverCounts?: CountsMap;
  readOnly?: boolean;
  saving?: boolean;
  baselineSnapshot?: BaselineSnapshot;
}

const EMPTY_LOCATION_NAMES_MAP: LocationNamesMap = {};
const EMPTY_RESOLVING_MAP: ResolvingMap = {};
const EMPTY_EXPIRATION_EDITS: ExpirationEditsMap = {};
const EMPTY_COUNTS_MAP: CountsMap = {};

export function GroupedLotsModal({
  open,
  group,
  counts,
  countsMeta,
  usersNameCache,
  locationNamesMap = EMPTY_LOCATION_NAMES_MAP,
  resolvingLocations = EMPTY_RESOLVING_MAP,
  expirationEdits = EMPTY_EXPIRATION_EDITS,
  onChangeExpiration,
  onChangeCount,
  onClose,
  onSave,
  serverCounts = EMPTY_COUNTS_MAP,
  readOnly = false,
  saving = false,
  baselineSnapshot,
}: GroupedLotsModalProps) {
  const hasChanges = useGroupedLotsChanges({
    group,
    counts,
    serverCounts,
    expirationEdits,
    countsMeta,
  });

  const handleSaveAndClose = async () => {
    if (!hasChanges) {
      message.info('No hay cambios para guardar');
      onClose();
      return;
    }
    if (onSave) {
      try {
        await onSave();
        onClose();
      } catch (saveError) {
        const description =
          saveError instanceof Error
            ? saveError.message
            : 'No se pudo guardar los cambios.';
        message.error(description);
      }
    } else {
      onClose();
    }
  };

  return (
    <Modal
      title={group ? `${group.productName} - Lotes` : ''}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancelar
        </Button>,
        ...(readOnly
          ? []
          : [
              <Button
                key="save"
                type="primary"
                onClick={handleSaveAndClose}
                loading={saving}
                disabled={!hasChanges}
              >
                {hasChanges ? 'Guardar y Cerrar' : 'Cerrar'}
              </Button>,
            ]),
      ]}
      width={1200}
      style={{ top: 10 }}
      destroyOnHidden
    >
      {group && (
        <GroupedLotsTable
          group={group}
          counts={counts}
          countsMeta={countsMeta}
          usersNameCache={usersNameCache}
          locationNamesMap={locationNamesMap}
          resolvingLocations={resolvingLocations}
          expirationEdits={expirationEdits}
          onChangeExpiration={onChangeExpiration}
          onChangeCount={onChangeCount}
          serverCounts={serverCounts}
          readOnly={readOnly}
          baselineSnapshot={baselineSnapshot}
        />
      )}
    </Modal>
  );
}

export default GroupedLotsModal;
