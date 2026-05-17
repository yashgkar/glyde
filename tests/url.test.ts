import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import plane from "../src/index"
import { mockFetch, stubFetch } from "./helpers"

describe("URL building", () => {
  let fetchSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchSpy = mockFetch()
    stubFetch(fetchSpy)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("prepends baseURL to relative paths", async () => {
    const api = plane({ baseURL: "http://api.test/v1" })
    await api.get("/users")

    expect(fetchSpy.mock.calls[0][0]).toBe("http://api.test/v1/users")
  })

  it("uses absolute URL as-is", async () => {
    const api = plane({ baseURL: "http://api.test" })
    await api.get("http://other.com/data")

    expect(fetchSpy.mock.calls[0][0]).toBe("http://other.com/data")
  })

  it("appends query params", async () => {
    const api = plane({ baseURL: "http://api.test" })
    await api.get("/search", { params: { q: "glyde", page: 1 } })

    const url = fetchSpy.mock.calls[0][0] as string
    expect(url).toContain("q=glyde")
    expect(url).toContain("page=1")
    expect(url).toMatch(/^http:\/\/api\.test\/search\?/)
  })

  it("appends params to URL that already has query string", async () => {
    const api = plane({ baseURL: "http://api.test" })
    await api.get("/search?existing=true", { params: { extra: "yes" } })

    const url = fetchSpy.mock.calls[0][0] as string
    expect(url).toContain("existing=true")
    expect(url).toContain("extra=yes")
    expect(url).toMatch(/\?existing=true&/)
  })
})
