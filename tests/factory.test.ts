import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import plane, { plane as namedPlane } from "../src/index"
import { mockFetch, stubFetch } from "./helpers"

describe("plane() factory", () => {
  beforeEach(() => {
    stubFetch(mockFetch())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("default export and named export are the same function", () => {
    expect(plane).toBe(namedPlane)
  })

  it("returns an object with all HTTP methods", () => {
    const api = plane()
    expect(typeof api.get).toBe("function")
    expect(typeof api.post).toBe("function")
    expect(typeof api.put).toBe("function")
    expect(typeof api.patch).toBe("function")
    expect(typeof api.delete).toBe("function")
    expect(typeof api.head).toBe("function")
    expect(typeof api.request).toBe("function")
    expect(typeof api.upload).toBe("function")
    expect(typeof api.stream).toBe("function")
    expect(api.interceptors).toBeDefined()
  })

  it("creates independent instances", () => {
    const a = plane({ baseURL: "http://a.com" })
    const b = plane({ baseURL: "http://b.com" })
    a.interceptors.request.use((c) => ({ ...c, headers: { ...c.headers, "X-A": "1" } }))

    expect(a.interceptors).not.toBe(b.interceptors)
  })
})
