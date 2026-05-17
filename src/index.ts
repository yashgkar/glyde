import { GlydeClient } from "./client"
import type { RequestConfig, GlydeResponse } from "./types"

export {
  GlydeError,
  TimeoutError,
  NetworkError,
  HttpError,
  isGlydeError,
  isTimeoutError,
  isHttpError,
} from "./errors"
export type {
  RequestConfig,
  GlydeResponse,
  GlydeInstance,
  HttpMethod,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
} from "./types"

export type Plane = ReturnType<typeof plane>

export function plane(config: RequestConfig = {}) {
  const core = new GlydeClient(config)

  return {
    request<T = unknown>(rc: RequestConfig): Promise<GlydeResponse<T>> {
      return core.request<T>(rc)
    },

    get<T = unknown>(
      url: string,
      rc: RequestConfig = {},
    ): Promise<GlydeResponse<T>> {
      return core.request<T>({ ...rc, method: "GET", url })
    },

    post<T = unknown>(
      url: string,
      data?: unknown,
      rc: RequestConfig = {},
    ): Promise<GlydeResponse<T>> {
      return core.request<T>({ ...rc, method: "POST", url, data })
    },

    put<T = unknown>(
      url: string,
      data?: unknown,
      rc: RequestConfig = {},
    ): Promise<GlydeResponse<T>> {
      return core.request<T>({ ...rc, method: "PUT", url, data })
    },

    patch<T = unknown>(
      url: string,
      data?: unknown,
      rc: RequestConfig = {},
    ): Promise<GlydeResponse<T>> {
      return core.request<T>({ ...rc, method: "PATCH", url, data })
    },

    delete<T = unknown>(
      url: string,
      rc: RequestConfig = {},
    ): Promise<GlydeResponse<T>> {
      return core.request<T>({ ...rc, method: "DELETE", url })
    },

    head<T = unknown>(
      url: string,
      rc: RequestConfig = {},
    ): Promise<GlydeResponse<T>> {
      return core.request<T>({ ...rc, method: "HEAD", url })
    },

    upload<T = unknown>(
      url: string,
      formData: FormData,
      rc: RequestConfig = {},
    ): Promise<GlydeResponse<T>> {
      return core.request<T>({ ...rc, method: "POST", url, data: formData })
    },

    stream(
      url: string,
      rc: RequestConfig = {},
    ): Promise<GlydeResponse<ReadableStream>> {
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
