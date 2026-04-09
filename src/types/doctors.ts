export interface DoctorRecord extends Record<string, unknown> {
  id?: string;
  name?: string;
  specialty?: string;
  status?: string;
}
