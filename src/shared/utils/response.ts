import { ApiResponse, PaginatedResponse } from '../types/base';

export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message: message || 'Operation successful'
  };
}

export function errorResponse(error: string | Error, statusCode?: number): ApiResponse {
  return {
    success: false,
    error: typeof error === 'string' ? error : error.message,
    message: typeof error === 'string' ? error : error.message
  };
}

export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  message?: string
): PaginatedResponse<T> {
  return {
    success: true,
    data,
    message: message || 'Data retrieved successfully',
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}
