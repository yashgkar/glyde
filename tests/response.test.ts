import { describe, it, expect, vi, afterEach } from "vitest"
import plane from "../src/index"
import { mockFetch, stubFetch } from "./helpers"

describe("response parsing", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("returns parsed JSON data with status and headers", async () => {
    stubFetch(mockFetch({ id: 1, name: "Yash" }))

    const api = plane({ baseURL: "http://api.test" })
    const res = await api.get<{ id: number; name: string }>("/users/1")

    expect(res.data).toEqual({ id: 1, name: "Yash" })
    expect(res.status).toBe(200)
    expect(res.statusText).toBe("OK")
    expect(res.headers).toBeDefined()
    expect(res.config).toBeDefined()
  })

  it("returns text when responseType is text", async () => {
    stubFetch(
      vi.fn().mockResolvedValue(
        new Response("hello world", { status: 200, statusText: "OK" }),
      ),
    )

    const api = plane()
    const res = await api.get<string>("http://api.test/text", { responseType: "text" })
    expect(res.data).toBe("hello world")
  })

  it("returns empty object for empty JSON response", async () => {
    stubFetch(
      vi.fn().mockResolvedValue(
        new Response("", { status: 200, statusText: "OK" }),
      ),
    )

    const api = plane()
    const res = await api.get("http://api.test/empty")
    expect(res.data).toEqual({})
  })
})
