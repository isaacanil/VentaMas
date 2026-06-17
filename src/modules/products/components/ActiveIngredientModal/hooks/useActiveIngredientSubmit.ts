import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import {
  fbAddActiveIngredient,
  fbUpdateActiveIngredient,
} from '@/firebase/products/activeIngredient/activeIngredients';
import type { ActiveIngredient } from '@/types/products';
import type { UserWithBusiness } from '@/types/users';

export interface ActiveIngredientFormValues {
  name: string;
}

export const useActiveIngredientSubmit = () => {
  type UserRootState = Parameters<typeof selectUser>[0];
  const user = useSelector((state: UserRootState) => selectUser(state));

  const saveActiveIngredient = useCallback(
    async (
      values: ActiveIngredientFormValues,
      initialValues: ActiveIngredient | null,
    ) => {
      if (!user) {
        return;
      }

      if (initialValues) {
        await fbUpdateActiveIngredient(user as UserWithBusiness, {
          id: initialValues.id,
          name: values.name,
        });
        return;
      }

      await fbAddActiveIngredient(user as UserWithBusiness, {
        name: values.name,
      });
    },
    [user],
  );

  return {
    hasUser: Boolean(user),
    saveActiveIngredient,
  };
};
