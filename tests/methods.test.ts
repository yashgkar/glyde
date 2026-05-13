import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import plane from "../src/index"
import { mockFetch, stubFetch } from "./helpers"

describe("HTTP methods", () => {
  let fetchSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchSpy = mockFetch({ message: "ok" })
    stubFetch(fetchSpy)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("GET sends correct method and url", async () => {
    const api = plane({ baseURL: "http://api.test" })
    await api.get("/users")

    expect(fetchSpy).toHaveBeenCalledOnce()
    const [url, opts] = fetchSpy.mock.calls[0]
    expect(url).toBe("http://api.test/users")
    expect(opts.method).toBe("GET")
  })

  it("POST sends body as JSON", async () => {
    const api = plane({ baseURL: "http://api.test" })
    await api.post("/users", { name: "Yash" })

    const [, opts] = fetchSpy.mock.calls[0]
    expect(opts.method).toBe("POST")
    expect(opts.body).toBe(JSON.stringify({ name: "Yash" }))
  })

  it("PUT sends body as JSON", async () => {
    const api = plane({ baseURL: "http://api.test" })
    await api.put("/users/1", { name: "Updated" })

    const [url, opts] = fetchSpy.mock.calls[0]
    expect(url).toBe("http://api.test/users/1")
    expect(opts.method).toBe("PUT")
    expect(opts.body).toBe(JSON.stringify({ name: "Updated" }))
  })

  it("PATCH sends body as JSON", async () => {
    const api = plane({ baseURL: "http://api.test" })
    await api.patch("/users/1", { name: "Patched" })

    const [, opts] = fetchSpy.mock.calls[0]
    expect(opts.method).toBe("PATCH")
    expect(opts.body).toBe(JSON.stringify({ name: "Patched" }))
  })

  it("DELETE sends correct method without body", async () => {
    const api = plane({ baseURL: "http://api.test" })
    await api.delete("/users/1")

    const [url, opts] = fetchSpy.mock.calls[0]
    expect(url).toBe("http://api.test/users/1")
    expect(opts.method).toBe("DELETE")
    expect(opts.body).toBeUndefined()
  })

  it("HEAD sends correct method", async () => {
    fetchSpy = vi.fn().mockResolvedValue(
      new Response(null, { status: 200, statusText: "OK" }),
    )
    stubFetch(fetchSpy)

    const api = plane({ baseURL: "http://api.test" })
    await api.head("/health")

    const [url, opts] = fetchSpy.mock.calls[0]
    expect(url).toBe("http://api.test/health")
    expect(opts.method).toBe("HEAD")
  })

  it("request() allows arbitrary config", async () => {
    const api = plane({ baseURL: "http://api.test" })
    await api.request({ method: "GET", url: "/custom", headers: { "X-Custom": "1" } })

    const [url, opts] = fetchSpy.mock.calls[0]
    expect(url).toBe("http://api.test/custom")
    expect(opts.headers["X-Custom"]).toBe("1")
  })

  it("GET does not send body even if data is provided", async () => {
    const api = plane({ baseURL: "http://api.test" })
    await api.request({ method: "GET", url: "/test", data: { ignored: true } })

    expect(fetchSpy.mock.calls[0][1].body).toBeUndefined()
  })

  it("HEAD does not send body even if data is provided", async () => {
    fetchSpy = vi.fn().mockResolvedValue(
      new Response(null, { status: 200, statusText: "OK" }),
    )
    stubFetch(fetchSpy)

    const api = plane({ baseURL: "http://api.test" })
    await api.request({ method: "HEAD", url: "/test", data: { ignored: true } })

    expect(fetchSpy.mock.calls[0][1].body).toBeUndefined()
  })
})
