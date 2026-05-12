import type { RequestConfig, FliteResponse } from "./types"

export class FliteError extends Error {
  public readonly config: RequestConfig
  public readonly response?: FliteResponse
  public readonly status?: number

  constructor(
    message: string,
    config: RequestConfig,
    response?: FliteResponse,
  ) {
    super(message)
    this.name = "FliteError"
    this.config = config
    this.response = response
    this.status = response?.status
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class TimeoutError extends FliteError {
  constructor(config: RequestConfig) {
    super(`Request timed out after ${config.timeout}ms`, config)
    this.name = "TimeoutError"
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class NetworkError extends FliteError {
  constructor(config: RequestConfig, originalCause?: unknown) {
    super("Network error — request could not be sent", config)
    this.name = "NetworkError"
    // Store cause without relying on ES2022 Error.cause for broader compat
    if (originalCause !== undefined) {
      ;(this as unknown as Record<string, unknown>)["originalCause"] =
        originalCause
    }
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class HttpError extends FliteError {
  constructor(config: RequestConfig, response: FliteResponse) {
    super(`HTTP ${response.status}: ${response.statusText}`, config, response)
    this.name = "HttpError"
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export function isFliteError(error: unknown): error is FliteError {
  return error instanceof FliteError
}
export function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError
}
export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError
}
