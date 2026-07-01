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
  { id: 'pricing', label: 'Precios', icon: DollarOutlined },
  { id: 'saleUnits', label: 'Presentaciones', icon: ShoppingOutlined },
  { id: 'inventory', label: 'Inventario', icon: BarcodeOutlined },
  { id: 'warranty', label: 'Garantía', icon: SafetyCertificateOutlined },
  { id: 'codes', label: 'Códigos', icon: QrcodeOutlined },
];

export const getSectionDomId = (sectionId: SectionId) => `section-${sectionId}`;
