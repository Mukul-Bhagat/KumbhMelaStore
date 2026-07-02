import axios from 'axios'

export interface ApiError {
  message: string
  status?: number
  code?: string
  details?: unknown
}

export function normalizeApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const apiError: ApiError = {
      message:
        (error.response?.data as { message?: string } | undefined)?.message ??
        error.message ??
        'Something went wrong.',
    }

    if (typeof error.response?.status === 'number') {
      apiError.status = error.response.status
    }

    if (error.code) {
      apiError.code = error.code
    }

    if (typeof error.response?.data !== 'undefined') {
      apiError.details = error.response.data
    }

    return apiError
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      details: error,
    }
  }

  return {
    message: 'An unexpected error occurred.',
    details: error,
  }
}
