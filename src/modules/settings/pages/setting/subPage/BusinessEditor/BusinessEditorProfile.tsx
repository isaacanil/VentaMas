// @ts-nocheck
import { Form, message } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectBusinessData } from '@/features/auth/businessSlice';
import { selectUser } from '@/features/auth/userSlice';
import {
  fbUpdateBusinessInfo,
  fbUpdateBusinessLogo,
} from '@/firebase/businessInfo/fbAddBusinessInfo';
import { isEqual } from '@/utils/lodash-minimal';

import {
  Wrapper,
  PageContainer,
  StyledForm,
  BusinessProfileHeader,
  GeneralInformationSection,
  ContactChannelsSection,
  LocationSection,
  FormActionsBar,
  SubmitButton,
} from './components/BusinessProfileSections';
import { countries } from './countries.json';
import useUnsavedChangesPrompt from './hooks/useUnsavedChangesPrompt';
import {
  mapBusinessDataToFormValues,
  normalizeFormValues,
} from './utils/formValues';
import { beforeUpload } from './utils/imageUpload';

const BusinessProfileEditor = () => {
  const business = useSelector(selectBusinessData);
  const [form] = Form.useForm();
  const user = useSelector(selectUser);
  const [loading, setLoading] = useState(false);
  const initialValuesRef = useRef(normalizeFormValues());

  const businessFormValues = useMemo(() => {
    if (!business) return normalizeFormValues();
    return mapBusinessDataToFormValues(business);
  }, [business]);

  const businessTrigger = useMemo(
    () => `${JSON.stringify(businessFormValues)}|${business?.logoUrl || ''}`,
    [businessFormValues, business?.logoUrl],
  );

  const [{ trigger: logoTrigger, value: logoOverride }, setLogoOverrideState] =
    useState(() => ({ trigger: businessTrigger, value: undefined }));

  const logoOverrideValue =
    logoTrigger === businessTrigger ? logoOverride : undefined;

  const imageUrl =
    logoOverrideValue === undefined ? business?.logoUrl || null : logoOverrideValue;

  const setImageUrl = useCallback(
    (value) => setLogoOverrideState({ trigger: businessTrigger, value }),
    [businessTrigger],
  );

  const [{ trigger: dirtyTrigger, value: dirtyValue }, setDirtyState] = useState(
    () => ({ trigger: businessTrigger, value: false }),
  );

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

  const handleValuesChange = (_, allValues) => {
    const normalizedValues = normalizeFormValues(allValues);
    setHasUnsavedChanges(!isEqual(normalizedValues, initialValuesRef.current));
  };

  const handleChange = async (info) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }

    if (info.file.status === 'done') {
      try {
        const downloadURL = await fbUpdateBusinessLogo(
          user,
          info.file.originFileObj,
        );
        setLoading(false);
        setImageUrl(downloadURL);
        form.setFieldsValue({ logo: downloadURL });
        message.success('Logo actualizado correctamente');
        setHasUnsavedChanges(true);
      } catch (error) {
        setLoading(false);
        console.error('Error al actualizar el logo', error);
        message.error('Error al actualizar el logo');
      }
    }
  };

  const handleSubmit = async (values) => {
    try {
      const invoiceData = {
        invoiceMessage: business?.invoice?.invoiceMessage || '',
        invoiceType: business?.invoice?.invoiceType || 'invoiceTemplate1',
        ...(values?.invoice || {}),
      };
      const businessData = {
        ...business,
        ...values,
        logoUrl: imageUrl || '',
        logo: values.logo || '',
        country: values.country || '',
        province: values.province || '',
        tel: values.tel || '',
        email: values.email || '',
        rnc: values.rnc || '',
        address: values.address || '',
        name: values.name || '',
        businessType: values.businessType || 'general',
        invoice: invoiceData,
      };

      await fbUpdateBusinessInfo(user, businessData);
      message.success('Información actualizada');
      const normalizedCurrentValues = normalizeFormValues(
        form.getFieldsValue(true),
      );
      initialValuesRef.current = normalizedCurrentValues;
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error al actualizar la información del negocio', error);
      message.error(error?.message || 'Error al actualizar la información');
    }
  };

  const handleResetLogo = () => {
    setImageUrl(null);
    form.setFieldsValue({ logo: '' });
    setHasUnsavedChanges(true);
  };

  return (
    <Wrapper>
      <PageContainer>
        <StyledForm
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onValuesChange={handleValuesChange}
        >
          <BusinessProfileHeader />
          <GeneralInformationSection
            beforeUpload={beforeUpload}
            handleChange={handleChange}
            imageUrl={imageUrl}
            onResetLogo={handleResetLogo}
            uploading={loading}
          />
          <ContactChannelsSection />
          <LocationSection countries={countries || []} />
        </StyledForm>
      </PageContainer>
      <FormActionsBar>
        <SubmitButton onClick={() => form.submit()} />
      </FormActionsBar>
    </Wrapper>
  );
};

export default BusinessProfileEditor;
