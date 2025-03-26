export interface User {
  id: string | null;
  name: string | null;
  email: string | null;
  token: string | null;
  status: string | null;
  creationDate?: string | null;
  birthday?: string | null;
}
