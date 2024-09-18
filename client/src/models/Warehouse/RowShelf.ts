import { AuditInfo } from "./AuditInfo";

export interface RowShelf {
    id: string; // auto-generated
    name: string;
    description: string;
    shortName: string;
    shelfId: string; // Reference to the Shelf
    capacity: number;
    audit: AuditInfo; // Objeto de auditoría
  }
  