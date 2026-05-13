import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import plane from "../src/index"
import { mockFetch, stubFetch } from "./helpers"

describe("interceptors", () => {
  let fetchSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchSpy = mockFetch()
    stubFetch(fetchSpy)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("request interceptor modifies config before fetch", async () => {
    const api = plane({ baseURL: "http://api.test" })
    api.interceptors.request.use((config) => ({
      ...config,
      headers: { ...config.headers, Authorization: "Bearer token123" },
    }))

    await api.get("/protected")

    expect(fetchSpy.mock.calls[0][1].headers["Authorization"]).toBe("Bearer token123")
  })

  it("response interceptor transforms response", async () => {
    fetchSpy = mockFetch({ wrapped: { id: 1 } })
    stubFetch(fetchSpy)

    const api = plane({ baseURL: "http://api.test" })
    api.interceptors.response.use((response) => ({
      ...response,
      data: (response.data as { wrapped: unknown }).wrapped,
    }))

    const res = await api.get<{ id: number }>("/data")
    expect(res.data).toEqual({ id: 1 })
  })

  it("multiple request interceptors run in order", async () => {
    const order: number[] = []
    const api = plane({ baseURL: "http://api.test" })

    api.interceptors.request.use((config) => {
      order.push(1)
      return config
    })
    api.interceptors.request.use((config) => {
      order.push(2)
      return config
    })

    await api.get("/test")
    expect(order).toEqual([1, 2])
  })

  it("async request interceptor is awaited", async () => {
    const api = plane({ baseURL: "http://api.test" })
    api.interceptors.request.use(async (config) => {
      await new Promise((r) => setTimeout(r, 10))
      return { ...config, headers: { ...config.headers, "X-Async": "true" } }
    })

    await api.get("/async")
    expect(fetchSpy.mock.calls[0][1].headers["X-Async"]).toBe("true")
  })

  it("eject removes an interceptor", async () => {
    const api = plane({ baseURL: "http://api.test" })
    const id = api.interceptors.request.use((config) => ({
      ...config,
      headers: { ...config.headers, "X-Should-Not-Exist": "1" },
    }))

    api.interceptors.request.eject(id)
    await api.get("/test")

    expect(fetchSpy.mock.calls[0][1].headers["X-Should-Not-Exist"]).toBeUndefined()
  })

  it("error interceptor catches request interceptor errors", async () => {
    const api = plane({ baseURL: "http://api.test" })
    const errorHandler = vi.fn()

    api.interceptors.request.use(
      () => { throw new Error("interceptor boom") },
      errorHandler,
    )

    await api.get("/test")
    expect(errorHandler).toHaveBeenCalledOnce()
  })
})
