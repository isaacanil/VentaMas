import { Form, message } from 'antd';
import isEqual from 'lodash/isEqual';
import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectBusinessData } from '../../../../../features/auth/businessSlice';
import { selectUser } from '../../../../../features/auth/userSlice';
import {
  fbUpdateBusinessInfo,
  fbUpdateBusinessLogo,
} from '../../../../../firebase/businessInfo/fbAddBusinessInfo';

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
  const [imageUrl, setImageUrl] = useState(business?.logoUrl || null);
  const [loading, setLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const initialValuesRef = useRef(normalizeFormValues());

  useUnsavedChangesPrompt(hasUnsavedChanges);

  useEffect(() => {
    if (!business) {
      return;
    }

    const normalizedValues = mapBusinessDataToFormValues(business);
    setImageUrl(business.logoUrl || null);
    form.setFieldsValue(normalizedValues);
    initialValuesRef.current = normalizedValues;
    setHasUnsavedChanges(false);
  }, [business, form]);

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
