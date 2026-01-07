// @ts-nocheck
import React from 'react';

import InventoryMigration from '@/views/pages/Prueba/InventoryMigration';

// Simple wrapper para exponer la herramienta de sincronización en DevTools.
// This page is intended for developer use only and should be routed behind devOnly.
export default function InventoryMigrationTool() {
  return <InventoryMigration />;
}
