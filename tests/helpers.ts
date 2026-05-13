import { vi } from "vitest"

export function mockFetch(
  body: unknown = {},
  init: { status?: number; statusText?: string; headers?: Record<string, string> } = {},
) {
  const { status = 200, statusText = "OK", headers = {} } = init
  return vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      statusText,
      headers: { "content-type": "application/json", ...headers },
    }),
  )
}

export function stubFetch(spy: ReturnType<typeof vi.fn>) {
  vi.stubGlobal("fetch", spy)
}
