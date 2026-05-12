import { FliteClient } from "./client"
import type { RequestConfig, FliteResponse } from "./types"

export {
  FliteError,
  TimeoutError,
  NetworkError,
  HttpError,
  isFliteError,
  isTimeoutError,
  isHttpError,
} from "./errors"
export type {
  RequestConfig,
  FliteResponse,
  FliteInstance,
  HttpMethod,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
} from "./types"

export type Plane = ReturnType<typeof plane>

export function plane(config: RequestConfig = {}) {
  const core = new FliteClient(config)

  return {
    request<T = unknown>(rc: RequestConfig): Promise<FliteResponse<T>> {
      return core.request<T>(rc)
    },

    get<T = unknown>(
      url: string,
      rc: RequestConfig = {},
    ): Promise<FliteResponse<T>> {
      return core.request<T>({ ...rc, method: "GET", url })
    },

    post<T = unknown>(
      url: string,
      data?: unknown,
      rc: RequestConfig = {},
    ): Promise<FliteResponse<T>> {
      return core.request<T>({ ...rc, method: "POST", url, data })
    },

    put<T = unknown>(
      url: string,
      data?: unknown,
      rc: RequestConfig = {},
    ): Promise<FliteResponse<T>> {
      return core.request<T>({ ...rc, method: "PUT", url, data })
    },

    patch<T = unknown>(
      url: string,
      data?: unknown,
      rc: RequestConfig = {},
    ): Promise<FliteResponse<T>> {
      return core.request<T>({ ...rc, method: "PATCH", url, data })
    },

    delete<T = unknown>(
      url: string,
      rc: RequestConfig = {},
    ): Promise<FliteResponse<T>> {
      return core.request<T>({ ...rc, method: "DELETE", url })
    },

    head<T = unknown>(
      url: string,
      rc: RequestConfig = {},
    ): Promise<FliteResponse<T>> {
      return core.request<T>({ ...rc, method: "HEAD", url })
    },

    upload<T = unknown>(
      url: string,
      formData: FormData,
      rc: RequestConfig = {},
    ): Promise<FliteResponse<T>> {
      return core.request<T>({ ...rc, method: "POST", url, data: formData })
    },

    stream(
      url: string,
      rc: RequestConfig = {},
    ): Promise<FliteResponse<ReadableStream>> {
      return core.request<ReadableStream>({
        ...rc,
        method: "GET",
        url,
        responseType: "stream",
      })
    },

    get interceptors() {
      return core.interceptors
    },
  }
}

export default plane
