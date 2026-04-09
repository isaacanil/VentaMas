import {
  CopyOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  MailOutlined,
  PrinterOutlined,
} from '@/constants/icons/antd';
import { Tooltip } from 'antd';
import React from 'react';

import {
  ModuleActions,
  ModuleButton,
  ModuleHeader,
  ModuleLabel,
  ModuleMeta,
  ModulePinRow,
  ModulePins,
  PinCard,
  PinNumber,
  PinPlaceholder,
  PrintButton,
} from './styles';

import type { PinEntryView } from './types';

export const PinEntriesList = ({
  pinEntries,
  visiblePins,
  copiedModules,
  hasEmail,
  userEmail,
  sendingEmail,
  onToggleVisibility,
  onCopyModule,
  onPrint,
  onSendEmail,
}: {
  pinEntries: PinEntryView[];
  visiblePins: Record<string, boolean>;
  copiedModules: Record<string, boolean>;
  hasEmail: boolean;
  userEmail?: string;
  sendingEmail: boolean;
  onToggleVisibility: (moduleKey: string) => void;
  onCopyModule: (moduleKey: string, pin: string) => void;
  onPrint: () => void;
  onSendEmail: () => void;
}) => (
  <PinCard>
    <ModulePins>
      {pinEntries.map((entry) => (
        <ModulePinRow key={entry.module}>
          <ModuleHeader>
            <ModuleLabel>{entry.moduleName}</ModuleLabel>
            <ModuleActions>
              <ModuleButton
                icon={
                  visiblePins[entry.module] ? (
                    <EyeInvisibleOutlined />
                  ) : (
                    <EyeOutlined />
                  )
                }
                onClick={() => onToggleVisibility(entry.module)}
                size="small"
              >
                {visiblePins[entry.module] ? 'Ocultar' : 'Ver PIN'}
              </ModuleButton>
              <ModuleButton
                icon={<CopyOutlined />}
                onClick={() => onCopyModule(entry.module, entry.pin)}
                disabled={!entry.pin}
                size="small"
              >
                {copiedModules[entry.module] ? 'Copiado' : 'Copiar'}
              </ModuleButton>
            </ModuleActions>
          </ModuleHeader>
          {visiblePins[entry.module] ? (
            <PinNumber>{entry.pin || '------'}</PinNumber>
          ) : (
            <PinPlaceholder>••••••</PinPlaceholder>
          )}
          <ModuleMeta>
            Expira:{' '}
            {entry.expiresAt ? entry.expiresAt.toLocaleString() : 'Sin expiracion'}
          </ModuleMeta>
        </ModulePinRow>
      ))}
    </ModulePins>
    <PrintButton icon={<PrinterOutlined />} onClick={onPrint} block>
      Imprimir Todos
    </PrintButton>
    {hasEmail ? (
      <PrintButton
        icon={<MailOutlined />}
        onClick={onSendEmail}
        loading={sendingEmail}
        block
        style={{ background: '#52c41a' }}
      >
        Enviar al correo ({userEmail})
      </PrintButton>
    ) : (
      <Tooltip title="El usuario no tiene un correo verificado vinculado">
        <PrintButton
          icon={<MailOutlined />}
          disabled
          block
          style={{ background: '#d9d9d9', color: '#999', border: 'none' }}
        >
          Enviar por correo (no disponible)
        </PrintButton>
      </Tooltip>
    )}
  </PinCard>
);
