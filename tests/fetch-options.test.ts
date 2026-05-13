import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import plane from "../src/index"
import { mockFetch, stubFetch } from "./helpers"

describe("fetch options", () => {
  let fetchSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchSpy = mockFetch()
    stubFetch(fetchSpy)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("abort", () => {
    it("passes external AbortSignal to fetch", async () => {
      const controller = new AbortController()
      const api = plane({ baseURL: "http://api.test" })

      await api.get("/data", { signal: controller.signal })

      const signal = fetchSpy.mock.calls[0][1].signal
      expect(signal).toBeDefined()
    })
  })

  describe("credentials", () => {
    it("defaults to same-origin", async () => {
      const api = plane()
      await api.get("http://api.test/data")

      expect(fetchSpy.mock.calls[0][1].credentials).toBe("same-origin")
    })

    it("uses include when withCredentials is true", async () => {
      const api = plane({ withCredentials: true })
      await api.get("http://api.test/data")

      expect(fetchSpy.mock.calls[0][1].credentials).toBe("include")
    })
  })

  describe("streaming", () => {
    it("returns ReadableStream without consuming body", async () => {
      const readable = new ReadableStream()
      fetchSpy = vi.fn().mockResolvedValue(
        new Response(readable, { status: 200, statusText: "OK" }),
      )
      stubFetch(fetchSpy)

      const api = plane({ baseURL: "http://api.test" })
      const res = await api.stream("/events")

      expect(res.data).toBeInstanceOf(ReadableStream)
      expect(res.status).toBe(200)
    })
  })
})
