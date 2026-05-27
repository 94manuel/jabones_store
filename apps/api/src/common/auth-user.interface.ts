import { Role } from '../database/enums';

export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  role: Role;
}
