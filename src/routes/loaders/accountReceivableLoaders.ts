import { store } from '../../app/store';
import fetchAccountsReceivableDetails from '../../firebase/accountsReceivable/fetchAccountsReceivableDetails';
import { selectUser } from '../../features/auth/userSlice';
import { redirect } from 'react-router'; // Import redirect

export const accountReceivableInfoLoader = async ({ params }) => {
  const { id } = params;
  const user = selectUser(store.getState());

  if (!user || user === false || !user.businessID) {
    // If user is not authenticated or business ID is missing, redirect to login or show an error
    // For now, let's redirect to home or login, assuming the authentication flow handles full user object loading.
    // In a real app, you might want to redirect to a login page if this is a protected route.
    console.warn("User not authenticated or business ID missing for accountReceivableInfoLoader. Redirecting.");
    return redirect('/login'); // Or handle error appropriately
  }

  try {
    const data = await fetchAccountsReceivableDetails(user, id);
    return data;
  } catch (error) {
    console.error("Error fetching account receivable details:", error);
    // You can throw a Response with a status to be caught by errorElement
    throw new Response("Error loading account receivable details.", { status: 500, statusText: error.message || "Internal Server Error" });
  }
};
