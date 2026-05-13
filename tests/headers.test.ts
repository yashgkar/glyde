import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import plane from "../src/index"
import { mockFetch, stubFetch } from "./helpers"

describe("headers", () => {
  let fetchSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchSpy = mockFetch()
    stubFetch(fetchSpy)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("sets default Content-Type and Accept", async () => {
    const api = plane()
    await api.get("http://api.test/data")

    const headers = fetchSpy.mock.calls[0][1].headers
    expect(headers["Content-Type"]).toBe("application/json")
    expect(headers["Accept"]).toBe("application/json")
  })

  it("merges per-request headers with defaults", async () => {
    const api = plane({ headers: { "X-App": "flite" } })
    await api.get("http://api.test/data", { headers: { "X-Request": "1" } })

    const headers = fetchSpy.mock.calls[0][1].headers
    expect(headers["X-App"]).toBe("flite")
    expect(headers["X-Request"]).toBe("1")
    expect(headers["Content-Type"]).toBe("application/json")
  })

  it("per-request headers override defaults", async () => {
    const api = plane({ headers: { "X-App": "old" } })
    await api.get("http://api.test/data", { headers: { "X-App": "new" } })

    expect(fetchSpy.mock.calls[0][1].headers["X-App"]).toBe("new")
  })

  it("removes Content-Type for FormData body", async () => {
    const api = plane({ baseURL: "http://api.test" })
    const formData = new FormData()
    formData.append("file", new Blob(["test"]), "test.txt")

    await api.upload("/upload", formData)

    const headers = fetchSpy.mock.calls[0][1].headers
    expect(headers["Content-Type"]).toBeUndefined()
  })

  it("removes Content-Type for URLSearchParams body", async () => {
    const api = plane({ baseURL: "http://api.test" })
    const params = new URLSearchParams({ grant_type: "password" })

    await api.post("/token", params)

    const headers = fetchSpy.mock.calls[0][1].headers
    expect(headers["Content-Type"]).toBeUndefined()
  })

  it("sends string body as-is", async () => {
    const api = plane({ baseURL: "http://api.test" })
    await api.post("/raw", "raw body string")

    expect(fetchSpy.mock.calls[0][1].body).toBe("raw body string")
  })
})
