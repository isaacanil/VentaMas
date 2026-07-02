import {
  BarcodeOutlined,
  DollarOutlined,
  QrcodeOutlined,
  SafetyCertificateOutlined,
  ShoppingOutlined,
  TagOutlined,
} from '@/constants/icons/antd';
import type { ComponentType } from 'react';

export type SectionId =
  | 'identity'
  | 'combo'
  | 'pricing'
  | 'saleUnits'
  | 'inventory'
  | 'warranty'
  | 'codes';

export interface SectionConfig {
  id: SectionId;
  label: string;
  icon: ComponentType;
}

export const FORM_SECTIONS: SectionConfig[] = [
  { id: 'identity', label: 'Identidad', icon: TagOutlined },
  { id: 'combo', label: 'Receta', icon: ShoppingOutlined },
  { id: 'pricing', label: 'Precios', icon: DollarOutlined },
  { id: 'saleUnits', label: 'Presentaciones', icon: ShoppingOutlined },
  { id: 'inventory', label: 'Inventario', icon: BarcodeOutlined },
  { id: 'warranty', label: 'Garantía', icon: SafetyCertificateOutlined },
  { id: 'codes', label: 'Códigos', icon: QrcodeOutlined },
];

export const getProductStudioSections = (
  itemType?: unknown,
  inventoryRole?: unknown,
): SectionConfig[] => {
  if (itemType === 'combo') {
    return FORM_SECTIONS.filter((section) =>
      ['identity', 'combo', 'pricing'].includes(section.id),
    );
  }

  if (itemType === 'service') {
    return FORM_SECTIONS.filter((section) =>
      ['identity', 'pricing'].includes(section.id),
    );
  }

  if (inventoryRole === 'raw_material') {
    return FORM_SECTIONS.filter((section) =>
      ['identity', 'pricing', 'inventory'].includes(section.id),
    );
  }

  return FORM_SECTIONS.filter((section) => section.id !== 'combo');
};

export const getSectionDomId = (sectionId: SectionId) => `section-${sectionId}`;
