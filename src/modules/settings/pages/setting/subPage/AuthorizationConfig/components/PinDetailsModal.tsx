import { SafetyOutlined } from '@/constants/icons/antd';
import { Modal, Typography, Button, message } from 'antd';
import { useMemo, useState } from 'react';
import type { GeneratedPins } from '@/firebase/authorization/pinAuth';
import { fbSendPinByEmail } from '@/firebase/authorization/pinAuth';

import { PinEntriesList } from './PinDetailsModal/PinEntriesList';
import { buildPinDetailsPrintContent } from './PinDetailsModal/printPinDetails';
import { ActionBar, Header, IconBadge, ModalBody, Subtitle } from './PinDetailsModal/styles';

import type { PinDetailsModalProps, PinEntryView } from './PinDetailsModal/types';

const { Title } = Typography;

const moduleNames: Record<string, string> = {
  invoices: 'Facturacion',
  accountsReceivable: 'Cuadre de Caja',
};

const normalizePinEntries = (pins: GeneratedPins['pins']): PinEntryView[] =>
  Array.isArray(pins)
    ? pins.map((entry) => ({
        module: entry.module,
        moduleName: moduleNames[entry.module] || entry.module,
        pin: entry.pin || '',
        createdAt:
          entry.createdAt instanceof Date
            ? entry.createdAt
            : entry.createdAt
              ? new Date(entry.createdAt)
              : null,
        expiresAt:
          entry.expiresAt instanceof Date
            ? entry.expiresAt
            : entry.expiresAt
              ? new Date(entry.expiresAt)
              : null,
      }))
    : [];

export const PinDetailsModal = ({
  visible,
  onClose,
  pinData,
  user,
  currentUser,
}: PinDetailsModalProps) => {
  const [visiblePins, setVisiblePins] = useState<Record<string, boolean>>({});
  const [copiedModules, setCopiedModules] = useState<Record<string, boolean>>(
    {},
  );
  const [sendingEmail, setSendingEmail] = useState(false);

  const userEmail = user?.email;
  const hasEmail = Boolean(userEmail && userEmail.includes('@'));
  const pinEntries = useMemo(() => normalizePinEntries(pinData?.pins), [pinData]);

  const togglePinVisibility = (moduleKey: string) => {
    setVisiblePins((prev) => ({
      ...prev,
      [moduleKey]: !prev[moduleKey],
    }));
  };

  const handleCopyModule = (moduleKey: string, pin: string) => {
    if (!pin) return;
    navigator.clipboard.writeText(pin);
    setCopiedModules((prev) => ({ ...prev, [moduleKey]: true }));
    setTimeout(() => {
      setCopiedModules((prev) => ({ ...prev, [moduleKey]: false }));
    }, 2000);
  };

  const handleSendEmail = () => {
    if (!hasEmail || !pinData || !user?.id) return;
    setSendingEmail(true);
    const pinsMap = pinData.pinsMap || {};
    const metadata = pinData.metadata
      ? {
          generatedAt: pinData.metadata.generatedAt
            ? pinData.metadata.generatedAt instanceof Date
              ? pinData.metadata.generatedAt.toISOString()
              : String(pinData.metadata.generatedAt)
            : null,
          expiresAt: pinData.metadata.expiresAt
            ? pinData.metadata.expiresAt instanceof Date
              ? pinData.metadata.expiresAt.toISOString()
              : String(pinData.metadata.expiresAt)
            : null,
        }
      : {};

    void fbSendPinByEmail(currentUser, user.id, pinsMap, metadata).then(
      () => {
        message.success(`PINs enviados al correo ${userEmail}`);
        setSendingEmail(false);
      },
      (error) => {
        const errorMsg =
          error instanceof Error ? error.message : 'Error enviando el correo';
        message.error(errorMsg);
        setSendingEmail(false);
      },
    );
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(
      buildPinDetailsPrintContent({
        pinEntries,
        displayName: user?.displayName,
      }),
    );
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={560}
      centered
      destroyOnClose
    >
      <ModalBody>
        <Header>
          <IconBadge>
            <SafetyOutlined />
          </IconBadge>
          <Title level={3}>PINs generados exitosamente</Title>
          <Subtitle>Guardalos en un lugar seguro.</Subtitle>
        </Header>

        <PinEntriesList
          pinEntries={pinEntries}
          visiblePins={visiblePins}
          copiedModules={copiedModules}
          hasEmail={hasEmail}
          userEmail={userEmail}
          sendingEmail={sendingEmail}
          onToggleVisibility={togglePinVisibility}
          onCopyModule={handleCopyModule}
          onPrint={handlePrint}
          onSendEmail={handleSendEmail}
        />

        <ActionBar>
          <Button onClick={onClose}>Cerrar</Button>
          <Button type="primary" onClick={onClose}>
            Entendido
          </Button>
        </ActionBar>
      </ModalBody>
    </Modal>
  );
};

export default PinDetailsModal;
