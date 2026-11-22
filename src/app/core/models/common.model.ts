export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  code: string;
  message: string;
  path: string;
  requestId: string;
  fieldErrors?: FieldError[];
}

export interface PageQuery {
  page?: number;
  size?: number;
  sort?: string;
}

export type EntityStatus = 'ACTIVE' | 'INACTIVE';
