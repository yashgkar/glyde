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

export interface GlydeResponse<T = unknown> {
  data: T
  status: number
  statusText: string
  headers: Record<string, string>
  config: RequestConfig
}

export interface GlydeInstance {
  get<T = unknown>(
    url: string,
    config?: RequestConfig,
  ): Promise<GlydeResponse<T>>
  post<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<GlydeResponse<T>>
  put<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<GlydeResponse<T>>
  patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<GlydeResponse<T>>
  delete<T = unknown>(
    url: string,
    config?: RequestConfig,
  ): Promise<GlydeResponse<T>>
  head<T = unknown>(
    url: string,
    config?: RequestConfig,
  ): Promise<GlydeResponse<T>>
  request<T = unknown>(config: RequestConfig): Promise<GlydeResponse<T>>
}

export type RequestInterceptor = (
  config: RequestConfig,
) => RequestConfig | Promise<RequestConfig>
export type ResponseInterceptor<T = unknown> = (
  response: GlydeResponse<T>,
) => GlydeResponse<T> | Promise<GlydeResponse<T>>
export type ErrorInterceptor = (error: unknown) => unknown
