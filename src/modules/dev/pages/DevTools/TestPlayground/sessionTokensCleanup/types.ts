export interface SessionTokenDoc {
  userId?: string;
  [key: string]: unknown;
}

export interface TokenResultItem {
  id: string;
  userId: string;
  keys: string[];
}

export interface SessionTokensScanResult {
  scanned: number;
  tokens: TokenResultItem[];
}

export interface SessionTokensDeleteResult {
  successCount: number;
  failedCount: number;
  failures: PromiseRejectedResult[];
}
