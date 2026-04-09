import { Form, message } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import type { UploadChangeParam, UploadFile } from 'antd/es/upload/interface';

import { selectBusinessData } from '@/features/auth/businessSlice';
import { selectUser } from '@/features/auth/userSlice';
import { isEqual } from '@/utils/lodash-minimal';

import {
  FormActionsBar,
  PageContainer,
  SubmitButton,
  Wrapper,
} from './components/BusinessProfileSections';
import {
  BusinessProfileForm,
  type BusinessProfileFormValues,
} from './components/BusinessProfileForm';
import { countries } from './countries.json';
import useUnsavedChangesPrompt from './hooks/useUnsavedChangesPrompt';
import {
  submitBusinessUpdate,
  uploadBusinessLogoUpdate,
} from './utils/businessEditActions';
import {
  mapBusinessDataToFormValues,
  normalizeFormValues,
} from './utils/formValues';
import { beforeUpload } from './utils/imageUpload';

interface LogoOverrideState {
  trigger: string;
  value: string | null | undefined;
}

interface DirtyState {
  trigger: string;
  value: boolean;
}

const BusinessEditPage = () => {
  const business = useSelector(selectBusinessData);
  const [form] = Form.useForm<BusinessProfileFormValues>();
  const user = useSelector(selectUser);
  const [loading, setLoading] = useState(false);
  const initialValuesRef = useRef<BusinessProfileFormValues>(normalizeFormValues());

  const businessFormValues = useMemo(() => {
    if (!business) return normalizeFormValues();
    return mapBusinessDataToFormValues(business);
  }, [business]);

  const businessTrigger = `${JSON.stringify(businessFormValues)}|${
    business?.logoUrl || ''
  }`;

  const [{ trigger: logoTrigger, value: logoOverride }, setLogoOverrideState] =
    useState<LogoOverrideState>(() => ({
      trigger: businessTrigger,
      value: undefined,
    }));

  const logoOverrideValue =
    logoTrigger === businessTrigger ? logoOverride : undefined;

  const imageUrl =
    logoOverrideValue === undefined
      ? business?.logoUrl || null
      : logoOverrideValue;

  const setImageUrl = useCallback(
    (value) => setLogoOverrideState({ trigger: businessTrigger, value }),
    [businessTrigger],
  );

  const [{ trigger: dirtyTrigger, value: dirtyValue }, setDirtyState] =
    useState<DirtyState>(() => ({ trigger: businessTrigger, value: false }));

  const hasUnsavedChanges =
    dirtyTrigger === businessTrigger ? dirtyValue : false;

  const setHasUnsavedChanges = useCallback(
    (value) => setDirtyState({ trigger: businessTrigger, value }),
    [businessTrigger],
  );

  useUnsavedChangesPrompt(hasUnsavedChanges);

  useEffect(() => {
    if (!business) {
      return;
    }

    form.setFieldsValue(businessFormValues);
    initialValuesRef.current = businessFormValues;
  }, [business, form, businessFormValues]);

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return undefined;
    }

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const handleValuesChange = (
    _: unknown,
    allValues: BusinessProfileFormValues,
  ) => {
    const normalizedValues = normalizeFormValues(allValues);
    setHasUnsavedChanges(!isEqual(normalizedValues, initialValuesRef.current));
  };

  const handleChange = async (info: UploadChangeParam<UploadFile>) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }

    if (info.file.status === 'done') {
      const result = await uploadBusinessLogoUpdate({
        file: info.file.originFileObj,
        user,
      });

      setLoading(false);
      if (result.status === 'error') {
        message.error(result.errorMessage);
        return;
      }

      setImageUrl(result.downloadURL || null);
      form.setFieldsValue({ logo: result.downloadURL });
      message.success('Logo actualizado correctamente');
      setHasUnsavedChanges(true);
    }
  };

  const handleSubmit = async (values) => {
    const result = await submitBusinessUpdate({
      business,
      imageUrl,
      user,
      values,
    });

    if (result.status === 'error') {
      message.error(result.errorMessage);
      return;
    }

    message.success('Información actualizada');
    const normalizedCurrentValues = normalizeFormValues(
      form.getFieldsValue(true),
    );
    initialValuesRef.current = normalizedCurrentValues;
    setHasUnsavedChanges(false);
  };

  const handleResetLogo = () => {
    setImageUrl(null);
    form.setFieldsValue({ logo: '' });
    setHasUnsavedChanges(true);
  };

  return (
    <Wrapper>
      <PageContainer>
        <BusinessProfileForm
          beforeUpload={beforeUpload}
          countries={countries || []}
          form={form}
          imageUrl={imageUrl}
          onLogoChange={handleChange}
          onResetLogo={handleResetLogo}
          onSubmit={handleSubmit}
          onValuesChange={handleValuesChange}
          uploading={loading}
        />
      </PageContainer>
      <FormActionsBar>
        <SubmitButton onClick={() => form.submit()} />
      </FormActionsBar>
    </Wrapper>
  );
};

export default BusinessEditPage;

