import { createClient } from '@supabase/supabase-js';

const RNC_SUPABASE_URL = 'https://safxuhklxqxkcbvvgjgi.supabase.co';
const rncSupabaseKey = import.meta.env.VITE_SUPABASE_KEY;
const rncSupabase = createClient(RNC_SUPABASE_URL, rncSupabaseKey);

export type DgiiComparableValue = string | number | null | undefined;
export type DgiiRecord = Record<string, DgiiComparableValue>;

export const fetchRncRecordByNumber = async (value: string) => {
  const { data, error } = await rncSupabase
    .from('rnc')
    .select('*')
    .eq('rnc_number', value)
    .maybeSingle<DgiiRecord>();

  if (error) {
    throw error;
  }

  return data;
};
