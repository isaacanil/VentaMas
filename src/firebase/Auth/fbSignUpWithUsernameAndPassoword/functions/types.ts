export interface SignUpUserInput extends Record<string, unknown> {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  businessID: string;
}
