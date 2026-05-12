export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS"

export interface RequestConfig {
  url?: string
  method?: HttpMethod
  baseURL?: string
  headers?: Record<string, string>
  params?: Record<string, string | number | boolean>
  data?: unknown
  timeout?: number
  signal?: AbortSignal
  responseType?: "json" | "text" | "blob" | "arrayBuffer" | "stream"
  withCredentials?: boolean
}

export interface FliteResponse<T = unknown> {
  data: T
  status: number
  statusText: string
  headers: Record<string, string>
  config: RequestConfig
}

export interface FliteInstance {
  get<T = unknown>(
    url: string,
    config?: RequestConfig,
  ): Promise<FliteResponse<T>>
  post<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<FliteResponse<T>>
  put<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<FliteResponse<T>>
  patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<FliteResponse<T>>
  delete<T = unknown>(
    url: string,
    config?: RequestConfig,
  ): Promise<FliteResponse<T>>
  head<T = unknown>(
    url: string,
    config?: RequestConfig,
  ): Promise<FliteResponse<T>>
  request<T = unknown>(config: RequestConfig): Promise<FliteResponse<T>>
}

export type RequestInterceptor = (
  config: RequestConfig,
) => RequestConfig | Promise<RequestConfig>
export type ResponseInterceptor<T = unknown> = (
  response: FliteResponse<T>,
) => FliteResponse<T> | Promise<FliteResponse<T>>
export type ErrorInterceptor = (error: unknown) => unknown
