import { fbSelectActiveBusiness } from '@/firebase/Auth/fbAuthV2/fbSelectActiveBusiness';

export type ActiveBusinessSelection = Awaited<
  ReturnType<typeof fbSelectActiveBusiness>
>;

export const selectActiveBusiness = async (
  businessId: string,
): Promise<ActiveBusinessSelection> => {
  return fbSelectActiveBusiness(businessId);
};
