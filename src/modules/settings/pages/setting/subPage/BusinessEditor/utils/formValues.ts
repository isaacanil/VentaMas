const FORM_FIELDS = [
  'businessType',
  'name',
  'rnc',
  'email',
  'tel',
  'country',
  'province',
  'address',
  'logo',
] as const;

type FormField = (typeof FORM_FIELDS)[number];

interface BusinessFormValues {
  businessType: string;
  name: string;
  rnc: string;
  email: string;
  tel: string;
  country: string;
  province: string;
  address: string;
  logo: string;
}

interface BusinessProfileData {
  businessType?: string;
  name?: string;
  rnc?: string;
  email?: string;
  tel?: string;
  country?: string;
  province?: string;
  address?: string;
  logoUrl?: string;
  logo?: string;
}

const DEFAULT_FORM_VALUES: BusinessFormValues = {
  businessType: 'general',
  name: '',
  rnc: '',
  email: '',
  tel: '',
  country: '',
  province: '',
  address: '',
  logo: '',
};

const normalizeFormValues = (
  values: Partial<BusinessFormValues> = {},
): BusinessFormValues => {
  const normalizedValues: BusinessFormValues = { ...DEFAULT_FORM_VALUES };
  FORM_FIELDS.forEach((field: FormField) => {
    normalizedValues[field] = values[field] ?? DEFAULT_FORM_VALUES[field];
  });
  return normalizedValues;
};

const mapBusinessDataToFormValues = (business?: BusinessProfileData | null) =>
  normalizeFormValues({
    businessType: business?.businessType,
    name: business?.name,
    rnc: business?.rnc,
    email: business?.email,
    tel: business?.tel,
    country: business?.country,
    province: business?.province,
    address: business?.address,
    logo: business?.logoUrl || business?.logo,
  });

export {
  FORM_FIELDS,
  DEFAULT_FORM_VALUES,
  normalizeFormValues,
  mapBusinessDataToFormValues,
};
