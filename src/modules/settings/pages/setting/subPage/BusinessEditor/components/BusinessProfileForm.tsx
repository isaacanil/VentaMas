import type { FormInstance } from 'antd';
import type { UploadProps } from 'antd/es/upload/interface';

import {
  BusinessProfileHeader,
  ContactChannelsSection,
  GeneralInformationSection,
  LocationSection,
  StyledForm,
} from './BusinessProfileSections';
import { normalizeFormValues } from '../utils/formValues';

export interface BusinessCountryOption {
  id: string;
  name: string;
}

export type BusinessProfileFormValues = ReturnType<typeof normalizeFormValues>;

const EMPTY_COUNTRIES: BusinessCountryOption[] = [];

interface BusinessProfileFormProps {
  form: FormInstance<BusinessProfileFormValues>;
  beforeUpload: UploadProps['beforeUpload'];
  onSubmit: (values: BusinessProfileFormValues) => void | Promise<void>;
  onValuesChange?: (
    _: unknown,
    allValues: BusinessProfileFormValues,
  ) => void;
  imageUrl: string | null;
  uploading: boolean;
  onLogoChange: UploadProps['onChange'];
  onResetLogo: () => void;
  countries?: BusinessCountryOption[];
  initialValues?: BusinessProfileFormValues;
}

export const BusinessProfileForm = ({
  countries = EMPTY_COUNTRIES,
  beforeUpload,
  form,
  imageUrl,
  initialValues,
  onLogoChange,
  onResetLogo,
  onSubmit,
  onValuesChange,
  uploading,
}: BusinessProfileFormProps) => (
  <StyledForm
    form={form}
    layout="vertical"
    onFinish={onSubmit}
    onValuesChange={onValuesChange}
    initialValues={initialValues}
  >
    <BusinessProfileHeader />
    <GeneralInformationSection
      beforeUpload={beforeUpload}
      handleChange={onLogoChange}
      imageUrl={imageUrl}
      onResetLogo={onResetLogo}
      uploading={uploading}
    />
    <ContactChannelsSection />
    <LocationSection countries={countries} />
  </StyledForm>
);

export default BusinessProfileForm;
