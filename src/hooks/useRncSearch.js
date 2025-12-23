import { useState, useCallback } from 'react';

import supabase from '@/supabase/config';

const FIELD_MAPPINGS = {
  rnc: {
    formKey: 'rnc',
    dgiiKey: 'rnc_number',
    label: 'RNC',
  },
  personalID: {
    formKey: 'personalID',
    dgiiKey: 'rnc_number',
    label: 'Cédula/RNC',
  },
};

const COMPARABLE_FIELDS = [
  { formKey: 'name', dgiiKey: 'full_name', label: 'Nombre' },
  // Add other common fields here
];

export const useRncSearch = (form, fieldType = 'rnc') => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rncInfo, setRncInfo] = useState(null);
  const [differences, setDifferences] = useState([]);

  const clearAll = () => {
    setRncInfo(null);
    setDifferences([]);
    setError('');
  };

  const compareDgiiData = useCallback(
    (formData, dgiiData) => {
      if (!dgiiData) {
        setDifferences([]);
        return false;
      }

      const fieldsToCompare = [
        ...COMPARABLE_FIELDS,
        FIELD_MAPPINGS[fieldType], // Add the dynamic RNC/personalID field
      ];

      const diffs = fieldsToCompare.reduce((acc, field) => {
        const currentValue = formData[field.formKey];
        const dgiiValue = dgiiData[field.dgiiKey];

        if (currentValue && dgiiValue && currentValue !== dgiiValue) {
          acc.push({
            field: field.formKey,
            label: field.label,
            currentValue,
            dgiiValue,
          });
        }
        return acc;
      }, []);

      setDifferences(diffs);
      return diffs.length > 0;
    },
    [fieldType],
  );

  const syncWithDgii = async () => {
    if (!rncInfo) {
      clearAll();
      return;
    }

    setLoading(true);
    try {
      const fieldsToSync = [...COMPARABLE_FIELDS, FIELD_MAPPINGS[fieldType]];

      const updates = fieldsToSync.reduce((acc, field) => {
        if (rncInfo[field.dgiiKey]) {
          acc[field.formKey] = rncInfo[field.dgiiKey];
        }
        return acc;
      }, {});

      await form.setFieldsValue(updates);
      const formData = form.getFieldsValue();
      compareDgiiData(formData, rncInfo);
      setDifferences([]); // Clear differences after successful sync

      return true;
    } catch (error) {
      console.error('Error syncing with DGII:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const consultarRNC = async (value, silent = false) => {
    if (!value) {
      clearAll();
      return;
    }

    if (!silent) {
      clearAll();
    }

    try {
      setLoading(true);

      if (!/^\d{9,11}$/.test(value)) {
        clearAll();
        throw new Error('El número debe tener entre 9 y 11 dígitos.');
      }

      const { data, error: supabaseError } = await supabase
        .from('rnc')
        .select('*')
        .eq('rnc_number', value)
        .single();

      if (supabaseError) throw supabaseError;

      if (!data) {
        clearAll();
        throw new Error(
          'No se encontraron resultados para el número ingresado.',
        );
      }

      setRncInfo(data);

      const fieldsToUpdate = [...COMPARABLE_FIELDS, FIELD_MAPPINGS[fieldType]];

      const updates = fieldsToUpdate.reduce((acc, field) => {
        if (data[field.dgiiKey]) {
          acc[field.formKey] = data[field.dgiiKey];
        }
        return acc;
      }, {});

      form.setFieldsValue(updates);
      const formData = form.getFieldsValue();
      compareDgiiData(formData, data);

      return data;
    } catch {
      clearAll();
      if (!silent) {
        setError('No se pudo consultar el RNC. Intente de nuevo más tarde.');
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    rncInfo,
    differences,
    consultarRNC,
    syncWithDgii,
    compareDgiiData,
    setError,
  };
};
