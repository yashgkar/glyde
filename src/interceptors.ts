import type {
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
  RequestConfig,
  FliteResponse,
} from "./types"

interface Handler<T> {
  fulfilled: T
  rejected?: ErrorInterceptor
}

export class InterceptorManager<T> {
  private handlers: Array<Handler<T> | null> = []

  use(fulfilled: T, rejected?: ErrorInterceptor): number {
    this.handlers.push({ fulfilled, rejected })
    return this.handlers.length - 1
  }

  eject(id: number): void {
    if (this.handlers[id]) {
      this.handlers[id] = null
    }
  }

  forEach(fn: (handler: Handler<T>) => void): void {
    this.handlers.forEach((h) => {
      if (h !== null) fn(h)
    })
  }

  clear(): void {
    this.handlers = []
  }
}

export class InterceptorChain {
  public readonly request = new InterceptorManager<RequestInterceptor>()
  public readonly response = new InterceptorManager<ResponseInterceptor>()

  async runRequest(config: RequestConfig): Promise<RequestConfig> {
    let result = config
    const handlers: Array<Handler<RequestInterceptor>> = []
    this.request.forEach((h) => handlers.push(h))

    for (const handler of handlers) {
      try {
        result = await handler.fulfilled(result)
      } catch (err) {
        if (handler.rejected) {
          handler.rejected(err)
        } else {
          throw err
        }
      }
    }
    return result
  }

  async runResponse<T>(
    response: FliteResponse<T>,
  ): Promise<FliteResponse<T>> {
    let result = response as FliteResponse
    const handlers: Array<Handler<ResponseInterceptor>> = []
    this.response.forEach((h) => handlers.push(h))

    for (const handler of handlers) {
      try {
        result = await handler.fulfilled(result)
      } catch (err) {
        if (handler.rejected) {
          handler.rejected(err)
        } else {
          throw err
        }
      }
    }
    return result as FliteResponse<T>
  }
}
