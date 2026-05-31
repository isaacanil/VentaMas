import { fbPublicSignUp } from '@/firebase/Auth/fbAuthV2/fbPublicSignUp';
import {
  fbSignIn,
  type FbSignInResult,
  type FbSignInUser,
} from '@/firebase/Auth/fbAuthV2/fbSignIn/fbSignIn';

export type PasswordAuthUser = FbSignInUser;
export type PasswordSignInResult = FbSignInResult;
export type PublicSignUpUser = Awaited<
  ReturnType<typeof fbPublicSignUp>
>['user'];

export const signInWithPassword = async ({
  password,
  username,
}: {
  password: string;
  username: string;
}): Promise<PasswordSignInResult> => {
  return fbSignIn({
    name: username,
    password,
  });
};

export const createPublicAccount = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  return fbPublicSignUp({
    name: email,
    realName: null,
    email,
    password,
  });
};
