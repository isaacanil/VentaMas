import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { selectAbilities, setAbilities } from '../../features/abilities/abilitiesSlice';
import { selectUser } from '../../features/auth/userSlice';
import { defineAbilitiesFor } from '../../abilities';
import { useAbility } from '@casl/react';
import { PureAbility } from '@casl/ability';
export const useAbilities = () => {
    const user = useSelector(selectUser);
    const abilities = useSelector(selectAbilities);
    const dispatch = useDispatch();
    useEffect(() => {
        if (user) {
            dispatch(setAbilities(user));
        }
    }, [user]);

    return abilities;
}

export function inspectUserAccess() {
    const rules = useSelector(selectAbilities)
    const abilities = new PureAbility(rules)
    return {abilities};
  }