export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'TECHNICIAN' | 'CLIENT_VIEWER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface UserCreateRequest {
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  password: string;
}

export interface UserUpdateRequest {
  name: string;
  role: UserRole;
  phone?: string;
  version: number;
}
