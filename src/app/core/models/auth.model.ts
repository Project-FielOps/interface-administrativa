import { UserRole, UserStatus } from './user.model';

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
  mustChangePassword: boolean;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  mustChangePassword: boolean;
}
