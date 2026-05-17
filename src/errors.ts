import type { RequestConfig, GlydeResponse } from "./types"

export class GlydeError extends Error {
  public readonly config: RequestConfig
  public readonly response?: GlydeResponse
  public readonly status?: number

  constructor(
    message: string,
    config: RequestConfig,
    response?: GlydeResponse,
  ) {
    super(message)
    this.name = "GlydeError"
    this.config = config
    this.response = response
    this.status = response?.status
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class TimeoutError extends GlydeError {
  constructor(config: RequestConfig) {
    super(`Request timed out after ${config.timeout}ms`, config)
    this.name = "TimeoutError"
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class NetworkError extends GlydeError {
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

export class HttpError extends GlydeError {
  constructor(config: RequestConfig, response: GlydeResponse) {
    super(`HTTP ${response.status}: ${response.statusText}`, config, response)
    this.name = "HttpError"
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export function isGlydeError(error: unknown): error is GlydeError {
  return error instanceof GlydeError
}
export function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError
}
export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError
}
