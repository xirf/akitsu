export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface User extends BaseEntity {
  email: string;
  passwordHash: string;
  role: 'admin' | 'editor' | 'viewer';
  isActive: boolean;
}

export interface ApiKey extends BaseEntity {
  name: string;
  keyHash: string;
  permissions: ('read' | 'write' | 'admin')[];
  rateLimit: number;
  domains: string[];
  expiresAt: string | null;
  isActive: boolean;
  userId: string;
  lastUsedAt: string | null;
}

export interface AuthToken {
  token: string;
  expiresAt: number;
  userId: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
