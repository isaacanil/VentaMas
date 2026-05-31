export interface MissingBusiness {
  id: string;
  name: string;
  createdAt: unknown;
  raw: Record<string, unknown>;
  hasCreatedAtNested: boolean;
  hasCreatedAtRoot: boolean;
}

export interface ScanProgress {
  scanned: number;
  total: number;
}
