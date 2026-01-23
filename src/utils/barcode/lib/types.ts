export type BarcodeInput = string | null | undefined;

export type BarcodeErrorCode =
  | 'ERR_EMPTY_CODE'
  | 'ERR_NON_NUMERIC'
  | 'ERR_NON_STANDARD_LENGTH';

export type KnownBarcodeType =
  | 'unknown'
  | 'UPC-E'
  | 'EAN-8'
  | 'UPC-A'
  | 'GTIN-14'
  | 'GTIN-13 (EAN-13)'
  | 'GTIN-13 (Peso/Precio Variable)';

export type BarcodeType = KnownBarcodeType | string;

export interface BarcodeCheckDigit {
  provided: string | null;
  calculated: string | null;
  isValid: boolean;
}

export interface BarcodeCheckDigitInfo extends BarcodeCheckDigit {
  correctDigit: string | null;
}

export interface BarcodeCountryInfo {
  country: string;
  region: string;
}

export interface BarcodeCountryInfoWithPrefix extends BarcodeCountryInfo {
  prefix: string;
}

export interface UpcEStructure {
  compressed: string;
  expanded: string;
  systemDigit: string;
  checkDigit: string | null;
}

export interface Ean8Structure {
  countryCode: string;
  productCode: string;
  checkDigit: string;
}

export interface UpcAStructure {
  systemDigit: string;
  manufacturerCode: string;
  productCode: string;
  checkDigit: string;
}

export interface Gtin13GenericStructure {
  countryCode: string;
  companyAndProduct: string;
  checkDigit: string;
}

export interface Gtin13RdStructure {
  countryCode: '746';
  companyPrefix: string;
  itemReference: string;
  checkDigit: string;
  type: string;
}

export interface Gtin14Structure {
  indicator: string;
  gtin13: string;
  checkDigit: string;
}

export interface VariableWeightStructure {
  type: string;
  prefix: string;
  itemCode: string;
  variableData: string;
  checkDigit: string;
  interpretation: string;
}

export type BarcodeStructure =
  | UpcEStructure
  | Ean8Structure
  | UpcAStructure
  | Gtin13GenericStructure
  | Gtin13RdStructure
  | Gtin14Structure
  | VariableWeightStructure;

export interface BarcodeAnalysisBase {
  isValid: boolean;
  type: BarcodeType | null;
  length: number;
  error?: BarcodeErrorCode;
  errorMessage?: string;
  original?: string;
  cleaned?: string;
  country?: BarcodeCountryInfoWithPrefix | null;
  structure?: BarcodeStructure | null;
  isVariableWeight?: boolean;
  checkDigit?: BarcodeCheckDigit;
}

export interface BarcodeAnalysisEmpty extends BarcodeAnalysisBase {
  isValid: false;
  error: 'ERR_EMPTY_CODE';
  errorMessage: string;
  type: null;
  length: 0;
}

export interface BarcodeAnalysisNonNumeric extends BarcodeAnalysisBase {
  isValid: false;
  error: 'ERR_NON_NUMERIC';
  errorMessage: string;
  type: 'unknown';
  length: number;
  original: string;
  cleaned: string;
}

export interface BarcodeAnalysisDetailed extends BarcodeAnalysisBase {
  original: string;
  cleaned: string;
  length: number;
  type: BarcodeType;
  country: BarcodeCountryInfoWithPrefix | null;
  structure: BarcodeStructure | null;
  isVariableWeight: boolean;
  checkDigit: BarcodeCheckDigit;
}

export type BarcodeAnalysis =
  | BarcodeAnalysisEmpty
  | BarcodeAnalysisNonNumeric
  | BarcodeAnalysisDetailed;

export interface BarcodeInfoValid {
  valid: true;
  type: BarcodeType;
  country: BarcodeCountryInfoWithPrefix | null;
  structure: BarcodeStructure | null;
  isVariableWeight: boolean;
  message: string;
  checkDigit: BarcodeCheckDigitInfo | null;
}

export interface BarcodeInfoInvalid {
  valid: false;
  type: string;
  message: string;
  error?: BarcodeErrorCode;
  checkDigit: BarcodeCheckDigitInfo | null;
}

export type BarcodeInfo = BarcodeInfoValid | BarcodeInfoInvalid;

export type CorrectionSuggestionReason =
  | 'expand'
  | 'complete'
  | 'convert'
  | 'fix'
  | 'clean'
  | 'truncate';

export type CorrectionSuggestionColor =
  | 'cyan'
  | 'blue'
  | 'purple'
  | 'green'
  | 'red'
  | 'orange';

export interface CorrectionSuggestion {
  id: string;
  type: string;
  code: string;
  description: string;
  color: CorrectionSuggestionColor;
  reason: CorrectionSuggestionReason;
}

export type Gs1StandardType =
  | 'UPC-A'
  | 'EAN-13'
  | 'EAN-8'
  | 'GTIN-14'
  | 'Code-128';

export interface Gs1Standard {
  xDimension: number;
  minHeight: number;
  exactLength?: number;
  maxLength?: number;
}

export interface Gs1Geometry {
  xPx: number;
  heightPx: number;
  quietZoneMm: number;
  exactLength?: number;
  maxLength?: number;
  standards: Gs1Standard;
}

export type CountryCode =
  | 'US'
  | 'CA'
  | 'MX'
  | 'DO'
  | 'GT'
  | 'SV'
  | 'HN'
  | 'NI'
  | 'CR'
  | 'PA'
  | 'VE'
  | 'CO'
  | 'UY'
  | 'PE'
  | 'BO'
  | 'AR'
  | 'CL'
  | 'PY'
  | 'BR'
  | 'DE'
  | 'FR'
  | 'GB'
  | 'IT'
  | 'ES'
  | 'NL'
  | 'AT'
  | 'CH'
  | 'NO'
  | 'SE'
  | 'DK'
  | 'JP'
  | 'CN'
  | 'IN'
  | 'KR'
  | 'SG'
  | 'TH'
  | 'VN'
  | 'AU'
  | 'NZ';

export interface Gs1PrefixConfig {
  prefix: string;
  name: string;
  region: string;
}

export type Gs1PrefixMap = Record<CountryCode, Gs1PrefixConfig>;

export type CompanySize = 'large' | 'medium' | 'small';

export interface CompanyStructure {
  name: string;
  companyPrefixLength: number;
  itemReferenceLength: number;
  maxProducts: number;
  description: string;
}

export type CompanyStructureMap = Record<CompanySize, CompanyStructure>;

export type InternalModeKey = 'standard';

export interface InternalModeStructure {
  name: string;
  companyPrefixLength: number;
  itemReferenceLength: number;
  maxProducts: number;
  description: string;
}

export type InternalModeStructureMap = Record<
  InternalModeKey,
  InternalModeStructure
>;

export type GtinFormat = 'GTIN13' | 'GTIN14';

export interface GenerateGtinConfig {
  country: CountryCode;
  companyPrefix: string;
  itemReference: string;
  format?: GtinFormat;
  indicator?: string;
}

export interface GenerateInternalGtinConfig {
  country: CountryCode;
  categoryPrefix?: string;
  itemReference: string;
  format?: GtinFormat;
  indicator?: string;
}

export interface GenerationValidationResult {
  isValid: boolean;
  errors: string[];
  suggestion: CompanyStructure | null;
}
