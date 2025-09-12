import React from 'react'
import InventoryMigration from '../../pages/Prueba/InventoryMigration'
import { db } from '../../../firebase/firebaseconfig'

// Simple wrapper to inject Firestore db into the InventoryMigration UI
// This page is intended for developer use only and should be routed behind devOnly.
export default function InventoryMigrationTool() {
  return <InventoryMigration db={db} />
}
