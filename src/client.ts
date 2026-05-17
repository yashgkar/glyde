import type { RequestConfig, GlydeResponse, GlydeInstance } from "./types"
import { InterceptorChain } from "./interceptors"
import { TimeoutError, NetworkError, HttpError } from "./errors"

function isFormData(data: unknown): data is FormData {
  return typeof FormData !== "undefined" && data instanceof FormData
}

function isURLSearchParams(data: unknown): data is URLSearchParams {
  return (
    typeof URLSearchParams !== "undefined" && data instanceof URLSearchParams
  )
}

function serializeBody(data: unknown): BodyInit | undefined {
  if (data === undefined) return undefined
  if (isFormData(data) || isURLSearchParams(data)) return data
  if (data instanceof ArrayBuffer || ArrayBuffer.isView(data))
    return data as BodyInit
  if (typeof data === "string") return data
  return JSON.stringify(data)
}

function shouldSetContentType(data: unknown): boolean {
  // Let browser auto-set Content-Type for FormData (needs boundary) and URLSearchParams
  if (isFormData(data) || isURLSearchParams(data)) return false
  return true
}

export class GlydeClient implements GlydeInstance {
  private defaults: RequestConfig
  public interceptors: InterceptorChain

  constructor(config: RequestConfig = {}) {
    const baseHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...config.headers,
    }
    this.defaults = {
      method: "GET",
      timeout: 0,
      responseType: "json",
      ...config,
      headers: baseHeaders,
    }
    this.interceptors = new InterceptorChain()
  }

  private buildURL(url: string, config: RequestConfig): string {
    const base = config.baseURL ?? this.defaults.baseURL ?? ""
    let fullURL = url.startsWith("http") ? url : `${base}${url}`

    if (config.params && Object.keys(config.params).length > 0) {
      const qs = new URLSearchParams(
        Object.entries(config.params).reduce<Record<string, string>>(
          (acc, [k, v]) => {
            acc[k] = String(v)
            return acc
          },
          {},
        ),
      ).toString()
      fullURL += (fullURL.includes("?") ? "&" : "?") + qs
    }

    return fullURL
  }

  private mergeConfig(config: RequestConfig): RequestConfig {
    const merged: RequestConfig = {
      ...this.defaults,
      ...config,
      headers: {
        ...(this.defaults.headers as Record<string, string>),
        ...(config.headers as Record<string, string>),
      },
    }

    // Remove Content-Type for FormData/URLSearchParams — browser sets it with boundary
    if (!shouldSetContentType(config.data)) {
      const headers = { ...(merged.headers as Record<string, string>) }
      delete headers["Content-Type"]
      merged.headers = headers
    }

    return merged
  }

  private parseHeaders(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {}
    headers.forEach((value, key) => {
      result[key] = value
    })
    return result
  }

  async request<T = unknown>(
    config: RequestConfig,
  ): Promise<GlydeResponse<T>> {
    let mergedConfig = this.mergeConfig(config)
    mergedConfig = await this.interceptors.runRequest(mergedConfig)

    const {
      method = "GET",
      headers,
      data,
      timeout,
      signal,
      responseType = "json",
      withCredentials,
    } = mergedConfig
    const url = this.buildURL(mergedConfig.url ?? "", mergedConfig)

    const signals: AbortSignal[] = []
    if (signal) signals.push(signal)

    let timeoutId: ReturnType<typeof setTimeout> | undefined
    if (timeout && timeout > 0) {
      const timeoutController = new AbortController()
      signals.push(timeoutController.signal)
      timeoutId = setTimeout(() => timeoutController.abort(), timeout)
    }

    const combinedSignal =
      signals.length > 1 && AbortSignal.any
        ? AbortSignal.any(signals)
        : signals[0]

    const fetchOptions: RequestInit = {
      method,
      headers: headers as HeadersInit,
      credentials: withCredentials ? "include" : "same-origin",
      signal: combinedSignal,
    }

    if (data !== undefined && !["GET", "HEAD"].includes(method)) {
      fetchOptions.body = serializeBody(data)
    }

    let rawResponse: Response

    try {
      rawResponse = await fetch(url, fetchOptions)
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId)
      if (err instanceof DOMException && err.name === "AbortError")
        throw new TimeoutError(mergedConfig)
      throw new NetworkError(mergedConfig, err)
    } finally {
      if (timeoutId) clearTimeout(timeoutId)
    }

    // Stream — return raw ReadableStream without consuming it
    if (responseType === "stream") {
      const response: GlydeResponse<T> = {
        data: rawResponse.body as unknown as T,
        status: rawResponse.status,
        statusText: rawResponse.statusText,
        headers: this.parseHeaders(rawResponse.headers),
        config: mergedConfig,
      }
      if (!rawResponse.ok)
        throw new HttpError(mergedConfig, response as GlydeResponse)
      return this.interceptors.runResponse(response)
    }

    let responseData: T
    try {
      switch (responseType) {
        case "text":
          responseData = (await rawResponse.text()) as unknown as T
          break
        case "blob":
          responseData = (await rawResponse.blob()) as unknown as T
          break
        case "arrayBuffer":
          responseData = (await rawResponse.arrayBuffer()) as unknown as T
          break
        case "json":
        default: {
          const text = await rawResponse.text()
          responseData = text ? JSON.parse(text) : ({} as T)
        }
      }
    } catch {
      responseData = null as unknown as T
    }

    const response: GlydeResponse<T> = {
      data: responseData,
      status: rawResponse.status,
      statusText: rawResponse.statusText,
      headers: this.parseHeaders(rawResponse.headers),
      config: mergedConfig,
    }

    if (!rawResponse.ok)
      throw new HttpError(mergedConfig, response as GlydeResponse)
    return this.interceptors.runResponse(response)
  }

  get<T = unknown>(
    url: string,
    config: RequestConfig = {},
  ): Promise<GlydeResponse<T>> {
    return this.request<T>({ ...config, method: "GET", url })
  }
  post<T = unknown>(
    url: string,
    data?: unknown,
    config: RequestConfig = {},
  ): Promise<GlydeResponse<T>> {
    return this.request<T>({ ...config, method: "POST", url, data })
  }
  put<T = unknown>(
    url: string,
    data?: unknown,
    config: RequestConfig = {},
  ): Promise<GlydeResponse<T>> {
    return this.request<T>({ ...config, method: "PUT", url, data })
  }
  patch<T = unknown>(
    url: string,
    data?: unknown,
    config: RequestConfig = {},
  ): Promise<GlydeResponse<T>> {
    return this.request<T>({ ...config, method: "PATCH", url, data })
  }
  delete<T = unknown>(
    url: string,
    config: RequestConfig = {},
  ): Promise<GlydeResponse<T>> {
    return this.request<T>({ ...config, method: "DELETE", url })
  }
  head<T = unknown>(
    url: string,
    config: RequestConfig = {},
  ): Promise<GlydeResponse<T>> {
    return this.request<T>({ ...config, method: "HEAD", url })
  }
  create(config: RequestConfig = {}): GlydeClient {
    return new GlydeClient({
      ...this.defaults,
      ...config,
      headers: {
        ...(this.defaults.headers as Record<string, string>),
        ...config.headers,
      },
    })
  }
}
