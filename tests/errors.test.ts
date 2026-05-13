import { describe, it, expect, vi, afterEach } from "vitest"
import plane, {
  isFliteError,
  isHttpError,
  isTimeoutError,
  FliteError,
  HttpError,
  TimeoutError,
  NetworkError,
} from "../src/index"
import { mockFetch, stubFetch } from "./helpers"

describe("errors", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("throws HttpError on non-ok response", async () => {
    stubFetch(mockFetch({ error: "not found" }, { status: 404, statusText: "Not Found" }))

    const api = plane({ baseURL: "http://api.test" })
    await expect(api.get("/missing")).rejects.toThrow(HttpError)
  })

  it("HttpError contains status, response data, and config", async () => {
    stubFetch(mockFetch({ error: "forbidden" }, { status: 403, statusText: "Forbidden" }))

    const api = plane({ baseURL: "http://api.test" })

    try {
      await api.get("/secret")
      expect.unreachable()
    } catch (err) {
      expect(isHttpError(err)).toBe(true)
      if (isHttpError(err)) {
        expect(err.status).toBe(403)
        expect(err.response?.data).toEqual({ error: "forbidden" })
        expect(err.config.url).toBe("/secret")
        expect(err.message).toBe("HTTP 403: Forbidden")
      }
    }
  })

  it("throws TimeoutError when request times out", async () => {
    stubFetch(
      vi.fn().mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => {
              reject(new DOMException("The operation was aborted.", "AbortError"))
            }, 10)
          }),
      ),
    )

    const api = plane({ baseURL: "http://api.test", timeout: 10 })
    await expect(api.get("/slow")).rejects.toThrow(TimeoutError)
  })

  it("throws NetworkError on fetch failure", async () => {
    stubFetch(vi.fn().mockRejectedValue(new TypeError("Failed to fetch")))

    const api = plane({ baseURL: "http://api.test" })
    await expect(api.get("/down")).rejects.toThrow(NetworkError)
  })

  it("error hierarchy: HttpError extends FliteError", async () => {
    stubFetch(mockFetch({}, { status: 500, statusText: "Internal Server Error" }))

    const api = plane()

    try {
      await api.get("http://api.test/error")
      expect.unreachable()
    } catch (err) {
      expect(isFliteError(err)).toBe(true)
      expect(isHttpError(err)).toBe(true)
      expect(err instanceof FliteError).toBe(true)
      expect(err instanceof HttpError).toBe(true)
    }
  })

  it("type guard isTimeoutError works", async () => {
    stubFetch(vi.fn().mockRejectedValue(new DOMException("aborted", "AbortError")))

    const api = plane({ timeout: 1 })

    try {
      await api.get("http://api.test/slow")
      expect.unreachable()
    } catch (err) {
      expect(isTimeoutError(err)).toBe(true)
    }
  })
})
