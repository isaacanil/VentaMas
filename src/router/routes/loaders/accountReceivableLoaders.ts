import { redirect } from 'react-router';

import { store } from '@/app/store';
import { selectUser } from '@/features/auth/userSlice';
import fetchAccountsReceivableDetails from '@/firebase/accountsReceivable/fetchAccountsReceivableDetails';

export const accountReceivableInfoLoader = async ({ params }: { params: { id?: string } }) => {
  const { id } = params;
  const user = selectUser(store.getState()) as { businessID?: string } | null;

  if (!user || !user.businessID) {
    // If user is not authenticated or business ID is missing, redirect to login or show an error
    // For now, let's redirect to home or login, assuming the authentication flow handles full user object loading.
    // In a real app, you might want to redirect to a login page if this is a protected route.
    console.warn("User not authenticated or business ID missing for accountReceivableInfoLoader. Redirecting.");
    return redirect('/login'); // Or handle error appropriately
  }

  try {
    const data = await fetchAccountsReceivableDetails(user, id);
    return data;
  } catch (error: unknown) {
    console.error("Error fetching account receivable details:", error);
    // Throw a proper Error object
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    const err = new Error("Error loading account receivable details: " + errorMessage);
    // Attach status information for error boundary
    (err as Error & { status?: number; statusText?: string }).status = 500;
    (err as Error & { status?: number; statusText?: string }).statusText = errorMessage;
    throw err;
  }
};
