export type LanguageCode = string;

export type HeaderLabel = string;
export type MappedFieldPath = string;

export type HeaderMapping<Lang extends string = string> = Record<
  Lang,
  Record<HeaderLabel, MappedFieldPath>
>;

export type HeaderAliases<Lang extends string = string> = Record<
  Lang,
  Record<string, string>
>;

export type ExcelPrimitive =
  | string
  | number
  | boolean
  | Date
  | null
  | undefined;

export interface ExcelCellValueObject {
  text?: string;
  result?: unknown;
  richText?: Array<{ text: string }>;
  [key: string]: unknown;
}

export type ExcelCellValue = ExcelPrimitive | ExcelCellValueObject;

export type ExcelInputFile = File | Blob | ArrayBuffer;

export type RawRow = Record<HeaderLabel, ExcelCellValue>;
export type RawData = RawRow[];

export type MappedPrimitive =
  | string
  | number
  | boolean
  | Date
  | null
  | undefined;

export type MappedValue = MappedPrimitive | MappedRecord;

export type MappedRecord = {
  [key: string]: MappedValue;
};

export type MappedData = MappedRecord[];

export interface ReadExcelOptions {
  expectedHeaders?: string[];
  minHeaderMatches?: number;
}

export type TransformFn = (value: unknown, row: MappedRecord) => unknown;

export interface TransformConfigItem {
  field: string;
  transform: TransformFn;
  source?: string;
}

export type TransformConfig = TransformConfigItem[];

export interface MapDataParams<Lang extends string = string> {
  data: RawData;
  headerMapping: HeaderMapping<Lang>;
  language?: Lang;
  transformConfig?: TransformConfig;
}

export interface ProcessMappedDataParams {
  dataMapped: MappedData;
  transformConfig?: TransformConfig;
}

export type HeaderGroupMap = Record<string, string[]>;

export interface AvailableHeaders {
  essential: string[];
  optionalGroups: HeaderGroupMap;
}
