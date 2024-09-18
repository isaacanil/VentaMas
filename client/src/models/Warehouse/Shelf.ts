import { AuditInfo } from "./AuditInfo";

export interface Shelf {
    id: string; // auto-generated
    name: string;
    description: string;
    shortName: string;
    warehouseId: string; // Reference to the Warehouse
    rowCapacity: number;
    audit: AuditInfo;
  }
  