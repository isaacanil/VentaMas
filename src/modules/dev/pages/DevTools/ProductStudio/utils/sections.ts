import {
  BarcodeOutlined,
  DollarOutlined,
  QrcodeOutlined,
  SafetyCertificateOutlined,
  TagOutlined,
} from '@/constants/icons/antd';
import type { ComponentType } from 'react';

export type SectionId = 'identity' | 'pricing' | 'inventory' | 'warranty' | 'codes';

export interface SectionConfig {
  id: SectionId;
  label: string;
  icon: ComponentType;
}

export const FORM_SECTIONS: SectionConfig[] = [
  { id: 'identity', label: 'Identidad', icon: TagOutlined },
  { id: 'pricing', label: 'Precios', icon: DollarOutlined },
  { id: 'inventory', label: 'Inventario', icon: BarcodeOutlined },
  { id: 'warranty', label: 'Garantía', icon: SafetyCertificateOutlined },
  { id: 'codes', label: 'Códigos', icon: QrcodeOutlined },
];

export const getSectionDomId = (sectionId: SectionId) => `section-${sectionId}`;
