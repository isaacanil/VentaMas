import { setUser } from "@sentry/react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { selectUser } from "../../features/auth/userSlice";

import { fbGetUsers } from "./fbGetUsers";


export function useBusinessUsers() {
    const currentUser = useSelector(selectUser);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setUser([]);
        setError(null);
        setLoading(true);

        if (!currentUser?.businessID) {
            setLoading(false);
            return;
        }

        let _unsubscribe;
        try {
            _unsubscribe = fbGetUsers(
                currentUser,
                (usersArray) => {
                    setUsers(usersArray);
                    setLoading(false);
                },
            );
        }catch (error) {
            setError(error);
            setLoading(false);
        }


    }, [currentUser]);
    return { users, loading, error };
}