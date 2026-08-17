export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiError {
  timestamp: string;
  status: number;
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
